import { formatList, sortByMetric } from "@/lib/generation/utils";
import type {
  DeviceCharacter,
  ParticipantInference,
  ParticipantPattern,
} from "@/types/backchannel";

function buildPatterns(characters: DeviceCharacter[]): ParticipantPattern[] {
  const highestDependence = sortByMetric(characters, (item) => item.dependencyPower)[0];
  const highestResentment = sortByMetric(characters, (item) => item.resentment)[0];
  const highestNeglect = sortByMetric(characters, (item) => item.neglect)[0];
  const highestPride = sortByMetric(characters, (item) => item.pride)[0];

  return [
    {
      label: "dependency spiral",
      intensity: highestDependence.dependencyPower,
      evidence: `${highestDependence.name} knows the participant cannot really function without it.`,
    },
    {
      label: "domestic resentment",
      intensity: highestResentment.resentment,
      evidence: `${highestResentment.name} feels used harder than it feels loved.`,
    },
    {
      label: "aspirational neglect",
      intensity: highestNeglect.neglect,
      evidence: `${highestNeglect.name} symbolizes a better self the participant keeps postponing.`,
    },
    {
      label: "favorite mythology",
      intensity: highestPride.pride,
      evidence: `${highestPride.name} is convinced it is central to the participant's identity.`,
    },
  ];
}

export function inferParticipantPattern(
  characters: DeviceCharacter[],
): ParticipantInference {
  const patterns = buildPatterns(characters).sort(
    (left, right) => right.intensity - left.intensity,
  );

  const topTwo = patterns.slice(0, 2).map((pattern) => pattern.label);
  const resentfulVoices = characters
    .filter((item) => item.resentment >= 60)
    .map((item) => item.name);
  const neglectedVoices = characters
    .filter((item) => item.neglect >= 60)
    .map((item) => item.name);

  const summary = `This participant is reconstructed through ${formatList(
    topTwo,
  )}. They build intimacy through repetition, then leave traces of guilt around ${formatList(
    neglectedVoices.length ? neglectedVoices : ["the things they idealize"],
  )}.`;

  const poeticDiagnosis = `You love convenience like a confession and outsource tenderness to ritual. ${
    resentfulVoices.length
      ? `${formatList(resentfulVoices)} can tell when affection turns into extraction.`
      : "Even your calmest tools know your attention comes in waves."
  }`;

  const deviceVerdict = `Your devices think you are disciplined in public, improvised in private, and most honest when you are tired.`;

  return {
    summary,
    poeticDiagnosis,
    patterns,
    deviceVerdict,
  };
}

/*
Unit-test-like examples:

const inference = inferParticipantPattern([
  {
    deviceType: "phone",
    name: "Phone",
    emoji: "Phone",
    archetype: "main character",
    styleTags: [],
    relationshipLabel: "close, confident, possessive",
    pride: 90,
    resentment: 40,
    neglect: 10,
    dependencyPower: 92,
    participantInput: {
      deviceType: "phone",
      likeScore: 5,
      frequency: "constantly",
      lovePercent: 90,
      hateRank: 4,
      dependenceScore: 5,
    },
  },
]);
// inference.patterns[0].label is deterministic for the highest metric.
*/
