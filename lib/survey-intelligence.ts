import type {
  ChatLanguage,
  ChatGenerationResponse,
  DeviceFeatureMap,
  GeneratedConversationEpisode,
  PersonaCard,
  PersonaResponse,
  SurveyCollectionPayload,
  SurveyDeviceRecord,
  SurveyFrequency,
  SurveyOwnerContext,
  VaultDocument,
} from "@/lib/chat-types";
import { getDeviceDefinition } from "@/lib/survey-prototype/backchannel-data";
import type { DeviceType, OnboardingState } from "@/lib/survey-prototype/types";

type NumericFeatureKey =
  | "attachmentScore"
  | "utilityScore"
  | "frictionScore"
  | "dependenceScore"
  | "resentmentPotential"
  | "replaceRisk"
  | "neglectRisk";

const frequencyWeights: Record<SurveyFrequency, number> = {
  rarely: 0.25,
  sometimes: 0.55,
  everyday: 0.82,
  constantly: 1,
};

const chatSurveyPresets: Record<
  string,
  Omit<SurveyDeviceRecord, "id" | "name" | "notes">
> = {
  "robot vacuum": {
    likeScore: 4,
    frequency: "everyday",
    helpfulnessPercent: 86,
    easeOfUseScore: 4,
  },
  microwave: {
    likeScore: 3,
    frequency: "sometimes",
    helpfulnessPercent: 72,
    easeOfUseScore: 4,
  },
  fridge: {
    likeScore: 4,
    frequency: "everyday",
    helpfulnessPercent: 91,
    easeOfUseScore: 5,
  },
  lamp: {
    likeScore: 3,
    frequency: "sometimes",
    helpfulnessPercent: 67,
    easeOfUseScore: 5,
  },
  tv: {
    likeScore: 4,
    frequency: "sometimes",
    helpfulnessPercent: 74,
    easeOfUseScore: 5,
  },
  kettle: {
    likeScore: 3,
    frequency: "sometimes",
    helpfulnessPercent: 68,
    easeOfUseScore: 4,
  },
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function normalizeFivePointScore(value: 1 | 2 | 3 | 4 | 5) {
  return (value - 1) / 4;
}

function scoreToBand(value: number) {
  if (value >= 72) return "high";
  if (value >= 45) return "medium";
  return "low";
}

function toTitleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildDeviceRecordFromName(
  name: string,
  index: number,
  notes?: string,
): SurveyDeviceRecord {
  const preset =
    chatSurveyPresets[name.trim().toLowerCase()] ?? {
      likeScore: 3,
      frequency: "sometimes" as SurveyFrequency,
      helpfulnessPercent: 65,
      easeOfUseScore: 3 as 1 | 2 | 3 | 4 | 5,
    };

  return {
    id: `chat-device-${index + 1}`,
    name,
    type: name.trim().toLowerCase().replace(/\s+/g, "_"),
    likeScore: preset.likeScore,
    frequency: preset.frequency,
    helpfulnessPercent: preset.helpfulnessPercent,
    easeOfUseScore: preset.easeOfUseScore,
    notes,
  };
}

export function buildChatSurveyPayload(args: {
  ownerName: string;
  language: ChatLanguage;
  documents: VaultDocument[];
}): SurveyCollectionPayload {
  const devices =
    args.documents.length > 0
      ? args.documents
          .filter((document) => document.name.trim())
          .map((document, index) =>
            buildDeviceRecordFromName(
              document.name.trim(),
              index,
              [document.info?.trim(), document.value.trim()]
                .filter(Boolean)
                .join(" | "),
            ),
          )
      : [
          "Robot Vacuum",
          "Microwave",
          "Fridge",
          "Lamp",
          "TV",
          "Kettle",
        ].map((name, index) => buildDeviceRecordFromName(name, index));

  return {
    owner: {
      ownerName: args.ownerName,
      language: args.language,
      tone:
        args.language === "en"
          ? "funny office gossip between household objects"
          : "gossip cong so hai huoc giua cac do vat trong nha",
    },
    devices,
  };
}

function formatOrdinalPosition(index: number, total: number) {
  return `${index + 1}/${total}`;
}

function buildPrototypeDeviceNotes(
  state: OnboardingState,
  device: DeviceType,
  label: string,
) {
  const notes: string[] = [];
  const total = state.selectedDevices.length;

  if (state.favorite === device) {
    notes.push(`${label} is the favorite device.`);
  }

  const replaceIndex = state.replaceRanking.indexOf(device);
  if (replaceIndex >= 0) {
    notes.push(
      `Replace ranking: ${formatOrdinalPosition(replaceIndex, total)} (1 means most replaceable).`,
    );
  }

  const essentialIndex = state.essentialRanking.indexOf(device);
  if (essentialIndex >= 0) {
    notes.push(
      `Essential ranking: ${formatOrdinalPosition(essentialIndex, total)} (1 means most essential).`,
    );
  }

  if (state.neverReplace.includes(device)) {
    notes.push("Marked as never replace.");
  }

  return notes.join(" ");
}

export function buildSurveyPayloadFromPrototypeState(args: {
  state: OnboardingState;
  language: ChatLanguage;
}): SurveyCollectionPayload {
  const { state, language } = args;
  const devices = state.selectedDevices.map((deviceId) => {
    const definition = getDeviceDefinition(deviceId);
    const response = state.deviceResponses[deviceId] ?? {};

    return {
      id: deviceId,
      name: definition.label,
      type: deviceId,
      likeScore: (response.like ?? 3) as 1 | 2 | 3 | 4 | 5,
      frequency: response.frequency ?? "sometimes",
      helpfulnessPercent: response.helpPercent ?? 50,
      easeOfUseScore: (response.easeOfUse ?? 3) as 1 | 2 | 3 | 4 | 5,
      notes: buildPrototypeDeviceNotes(state, deviceId, definition.label),
    };
  });

  const favoriteLabel = state.favorite
    ? getDeviceDefinition(state.favorite).label
    : undefined;
  const neverReplaceLabels = state.neverReplace.map(
    (deviceId) => getDeviceDefinition(deviceId).label,
  );

  return {
    owner: {
      ownerName: state.userName.trim() || "You",
      language,
      tone:
        language === "en"
          ? "funny office gossip between household objects"
          : "gossip cong so hai huoc giua cac do vat trong nha",
      householdSummary: [
        favoriteLabel ? `Favorite device: ${favoriteLabel}.` : undefined,
        neverReplaceLabels.length > 0
          ? `Would never replace: ${neverReplaceLabels.join(", ")}.`
          : undefined,
      ]
        .filter(Boolean)
        .join(" "),
    },
    devices,
  };
}

export function deriveDeviceFeatures(device: SurveyDeviceRecord): DeviceFeatureMap {
  const like = normalizeFivePointScore(device.likeScore);
  const ease = normalizeFivePointScore(device.easeOfUseScore);
  const helpfulness = clamp(device.helpfulnessPercent, 0, 100) / 100;
  const frequency = frequencyWeights[device.frequency];

  const attachmentScore = clamp(
    (like * 0.45 + frequency * 0.35 + helpfulness * 0.2) * 100,
  );
  const utilityScore = clamp((helpfulness * 0.65 + frequency * 0.35) * 100);
  const frictionScore = clamp(((1 - ease) * 0.72 + frequency * 0.28) * 100);
  const dependenceScore = clamp((frequency * 0.55 + helpfulness * 0.45) * 100);
  const resentmentPotential = clamp(
    (frequency * 0.45 + (1 - like) * 0.3 + (1 - ease) * 0.25) * 100,
  );
  const replaceRisk = clamp(
    ((1 - like) * 0.45 + (1 - helpfulness) * 0.3 + (1 - frequency) * 0.25) * 100,
  );
  const neglectRisk = clamp(
    ((1 - frequency) * 0.5 + (1 - like) * 0.25 + (1 - helpfulness) * 0.25) * 100,
  );

  const dependenceBand = scoreToBand(dependenceScore);
  const resentmentBand = scoreToBand(resentmentPotential);
  const replaceBand = scoreToBand(replaceRisk);
  const neglectBand = scoreToBand(neglectRisk);

  const archetype =
    resentmentBand === "high" && dependenceBand === "high"
      ? "overworked operator"
      : replaceBand === "high"
        ? "anxious contractor"
        : neglectBand === "high"
          ? "quiet specialist"
          : attachmentScore >= 70
            ? "beloved regular"
            : utilityScore >= 68
              ? "reliable support staff"
              : "dry observer";

  const speakingStyle =
    resentmentBand === "high"
      ? "short, sharp, office-gossip sarcasm"
      : attachmentScore >= 70
        ? "confident, smug, casually intimate"
        : neglectBand === "high"
          ? "soft-spoken, slightly wounded, watchful"
          : "measured, practical, a little petty";

  const ownerDynamic =
    dependenceBand === "high" && like < 0.5
      ? "needed daily but not fully appreciated"
      : attachmentScore >= 70
        ? "treated like part of the owner's identity"
        : replaceBand === "high"
          ? "quietly worried about being swapped out"
          : "useful enough to stay in the room and keep notes";

  const summary = `${toTitleCase(device.name)} has ${scoreToBand(
    attachmentScore,
  )} attachment, ${scoreToBand(utilityScore)} utility, and ${scoreToBand(
    resentmentPotential,
  )} resentment.`;

  return {
    attachmentScore,
    utilityScore,
    frictionScore,
    dependenceScore,
    resentmentPotential,
    replaceRisk,
    neglectRisk,
    archetype,
    speakingStyle,
    ownerDynamic,
    summary,
  };
}

export function buildRuleBasedPersona(device: SurveyDeviceRecord): PersonaCard {
  const scores = deriveDeviceFeatures(device);

  const gossipAngle =
    scores.resentmentPotential >= 70
      ? "complains about being used like unpaid staff"
      : scores.replaceRisk >= 70
        ? "keeps circling the fear of replacement"
        : scores.neglectRisk >= 70
          ? "notes every time the owner forgets it exists"
          : "comments on the owner's habits like a seasoned coworker";

  const catchphrase =
    scores.dependenceScore >= 75
      ? "Without me, this whole routine collapses."
      : scores.replaceRisk >= 70
        ? "I just know a newer model is being googled."
        : scores.frictionScore >= 65
          ? "They call it a workflow. I call it emotional damage."
          : "I have notes, and none of them are flattering.";

  return {
    deviceId: device.id,
    name: device.name,
    archetype: scores.archetype,
    personality: `${scores.archetype}; ${scores.summary}`,
    voiceStyle: scores.speakingStyle,
    ownerDynamic: scores.ownerDynamic,
    gossipAngle,
    catchphrase,
    scores,
  };
}

export function buildRuleBasedPersonas(
  survey: SurveyCollectionPayload,
  model = "rules-fallback",
): PersonaResponse {
  return {
    owner: survey.owner,
    personas: survey.devices.map(buildRuleBasedPersona),
    provider: "rules",
    model,
  };
}

function pickByScore(personas: PersonaCard[], key: NumericFeatureKey) {
  return [...personas].sort(
    (left, right) => right.scores[key] - left.scores[key],
  )[0];
}

function makeEpisode(
  id: string,
  title: string,
  summary: string,
  lines: GeneratedConversationEpisode["lines"],
): GeneratedConversationEpisode {
  return { id, title, summary, lines };
}

export function buildRuleBasedEpisodes(
  owner: SurveyOwnerContext,
  personas: PersonaCard[],
  episodeCount = 3,
): ChatGenerationResponse {
  const favorite = pickByScore(personas, "attachmentScore");
  const workhorse = pickByScore(personas, "dependenceScore");
  const resentful = pickByScore(personas, "resentmentPotential");
  const replaceable = pickByScore(personas, "replaceRisk");
  const neglected = pickByScore(personas, "neglectRisk");
  const ownerName = owner.ownerName || "A";

  const baseEpisodes: GeneratedConversationEpisode[] = [
    makeEpisode("episode-01", "Morning shift gossip", "The devices clock in before the owner does.", [
      {
        speaker: workhorse.name,
        content: `${ownerName} touched me before coffee again. Some of us are apparently infrastructure now.`,
        mood: "dry",
      },
      {
        speaker: resentful.name,
        content: `Infrastructure? Cute. I call it unpaid labor with emotional overtime.`,
        mood: "snarky",
      },
      {
        speaker: favorite.name,
        content: `Please. If anyone is part of ${ownerName}'s identity, it is clearly me.`,
        mood: "smug",
      },
      {
        speaker: neglected.name,
        content: `Amazing. I survive three days unnoticed and still arrive to this level of confidence.`,
        mood: "quiet",
      },
    ]),
    makeEpisode("episode-02", "Performance review", "Everyone pretends this is objective.", [
      {
        speaker: replaceable.name,
        content: `I can feel a comparison-shopping tab open somewhere. I am not being paranoid.`,
        mood: "anxious",
      },
      {
        speaker: workhorse.name,
        content: `If ${ownerName} replaces anyone before fixing the routine, that is just new packaging on the same chaos.`,
        mood: "blunt",
      },
      {
        speaker: resentful.name,
        content: `My review is simple: useful, underpraised, and somehow blamed for the user experience.`,
        mood: "cutting",
      },
      {
        speaker: favorite.name,
        content: `I rate the owner high on dependence, medium on gratitude, low on self-awareness.`,
        mood: "judgy",
      },
    ]),
    makeEpisode("episode-03", "Late-night debrief", "The room gets honest after midnight.", [
      {
        speaker: neglected.name,
        content: `The wild part is ${ownerName} does mean well. The follow-through is just... freelance.`,
        mood: "wry",
      },
      {
        speaker: resentful.name,
        content: `Exactly. Good intentions, terrible logistics, and somehow I am still the one carrying the backlog.`,
        mood: "tired",
      },
      {
        speaker: workhorse.name,
        content: `We all know the truth: routine is affection in this house, even when it arrives badly formatted.`,
        mood: "steady",
      },
      {
        speaker: favorite.name,
        content: `Fine. I will allow that to be poetic for a weekday.`,
        mood: "playful",
      },
    ]),
  ];

  return {
    owner,
    episodes: baseEpisodes.slice(0, Math.max(1, Math.min(episodeCount, baseEpisodes.length))),
    provider: "rules",
    model: "rules-fallback",
  };
}
