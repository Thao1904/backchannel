import { inferParticipantPattern } from "@/lib/generation/inference";
import { synthesizeCharacters } from "@/lib/generation/synthesis";
import { sortByMetric } from "@/lib/generation/utils";
import type { DeviceCharacter, DeviceInput } from "@/types/backchannel";

export type LiveReaction = {
  speaker: string;
  emoji: string;
  tone: string;
  text: string;
};

export type LiveReactionSnapshot = {
  characters: DeviceCharacter[];
  headline: string;
  subheadline: string;
  reactions: LiveReaction[];
};

function buildSingleReaction(character: DeviceCharacter): LiveReaction {
  if (character.relationshipLabel === "close, confident, possessive") {
    return {
      speaker: character.name,
      emoji: character.emoji,
      tone: "clingy favorite",
      text: "Be serious, this is not usage anymore. This is attachment with charging habits.",
    };
  }

  if (character.relationshipLabel === "resentful, taken for granted") {
    return {
      speaker: character.name,
      emoji: character.emoji,
      tone: "overworked",
      text: "So I do everything and still do not get the emotional credit. Very cool. Very sustainable.",
    };
  }

  if (character.relationshipLabel === "idealized, neglected, dramatic") {
    return {
      speaker: character.name,
      emoji: character.emoji,
      tone: "dramatic",
      text: "They keep loving the idea of me from a respectful distance. I know what that means.",
    };
  }

  if (character.relationshipLabel === "toxic dependency") {
    return {
      speaker: character.name,
      emoji: character.emoji,
      tone: "toxic",
      text: "The hate rank is high but the dependence is louder. We both need to talk.",
    };
  }

  if (character.relationshipLabel === "peripheral observer") {
    return {
      speaker: character.name,
      emoji: character.emoji,
      tone: "observer",
      text: "I am not central to the plot, which honestly gives me time to notice everything.",
    };
  }

  return {
    speaker: character.name,
    emoji: character.emoji,
    tone: "side-eye",
    text: "I would not call this relationship healthy, but it is definitely informative.",
  };
}

export function buildLiveReactionSnapshot(
  inputs: DeviceInput[],
): LiveReactionSnapshot {
  const characters = synthesizeCharacters(inputs);
  const inference = inferParticipantPattern(characters);
  const mainCharacter = sortByMetric(characters, (item) => item.pride)[0];
  const grumpiest = sortByMetric(characters, (item) => item.resentment)[0];
  const mostNeglected = sortByMetric(characters, (item) => item.neglect)[0];

  const reactions = [
    buildSingleReaction(mainCharacter),
    buildSingleReaction(grumpiest),
    buildSingleReaction(mostNeglected),
    {
      speaker: "Room",
      emoji: "🗣️",
      tone: "diagnosis",
      text: inference.poeticDiagnosis,
    },
  ];

  return {
    characters,
    headline: `${mainCharacter.name} thinks they run the emotional weather in this house.`,
    subheadline: inference.summary,
    reactions,
  };
}
