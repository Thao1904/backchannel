import { archetypesByDevice } from "@/lib/generation/archetypes";
import { clamp, frequencyWeight } from "@/lib/generation/utils";
import type {
  CharacterRelationshipLabel,
  DeviceCharacter,
  DeviceInput,
  StyleTag,
} from "@/types/backchannel";

function deriveRelationshipLabel(input: DeviceInput): CharacterRelationshipLabel {
  const use = frequencyWeight(input.frequency);

  if (use >= 4 && input.lovePercent >= 75) {
    return "close, confident, possessive";
  }

  if (use >= 4 && input.lovePercent <= 35) {
    return "resentful, taken for granted";
  }

  if (use <= 2 && input.lovePercent >= 70) {
    return "idealized, neglected, dramatic";
  }

  if (input.hateRank <= 2 && use >= 4) {
    return "toxic dependency";
  }

  if (use <= 2 && input.likeScore <= 2) {
    return "peripheral observer";
  }

  return "familiar but keeping score";
}

function deriveStyleTags(input: DeviceInput, baseTags: StyleTag[]): StyleTag[] {
  const tags = [...baseTags];
  const use = frequencyWeight(input.frequency);

  if (use >= 4 && input.lovePercent >= 70) {
    tags.push("territorial");
  }

  if (use >= 4 && input.likeScore <= 2) {
    tags.push("fed up");
  }

  if (use <= 2 && input.lovePercent >= 70) {
    tags.push("yearning");
  }

  if (input.hateRank === 1) {
    tags.push("petty");
  }

  return tags;
}

export function synthesizeCharacters(inputs: DeviceInput[]): DeviceCharacter[] {
  return inputs.map((input) => {
    const archetype = archetypesByDevice[input.deviceType];
    const use = frequencyWeight(input.frequency);
    const dependence = input.dependenceScore ?? 3;

    const pride = clamp(
      input.likeScore * 10 + input.lovePercent * 0.6 + use * 8 - input.hateRank * 3,
    );
    const resentment = clamp(
      use * 16 + (6 - input.likeScore) * 10 + (100 - input.lovePercent) * 0.22,
    );
    const neglect = clamp(
      (6 - use) * 14 + (input.lovePercent >= 70 ? 14 : 0) + (dependence <= 2 ? 8 : 0),
    );
    const dependencyPower = clamp(
      use * 15 + dependence * 11 + input.lovePercent * 0.18,
    );

    return {
      deviceType: input.deviceType,
      name: archetype.label,
      emoji: archetype.emoji,
      archetype: archetype.baseTemperament,
      styleTags: deriveStyleTags(input, archetype.styleTags),
      relationshipLabel: deriveRelationshipLabel(input),
      pride,
      resentment,
      neglect,
      dependencyPower,
      participantInput: input,
    };
  });
}

/*
Unit-test-like examples:

const example = synthesizeCharacters([
  {
    deviceType: "phone",
    likeScore: 5,
    frequency: "constantly",
    lovePercent: 95,
    hateRank: 4,
    dependenceScore: 5,
  },
]);
// example[0].relationshipLabel === "close, confident, possessive"
// example[0].dependencyPower > 80

const neglected = synthesizeCharacters([
  {
    deviceType: "oven",
    likeScore: 5,
    frequency: "rarely",
    lovePercent: 88,
    hateRank: 5,
    dependenceScore: 1,
  },
]);
// neglected[0].relationshipLabel === "idealized, neglected, dramatic"
// neglected[0].neglect > neglected[0].pride / 2
*/
