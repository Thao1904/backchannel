export const DEVICE_TYPES = [
  "phone",
  "laptop",
  "microwave",
  "vacuum",
  "rice_cooker",
  "kettle",
  "oven",
  "dishwasher",
  "washing_machine",
] as const;

export const USE_FREQUENCIES = [
  "rarely",
  "sometimes",
  "everyday",
  "constantly",
] as const;

export type DeviceType = (typeof DEVICE_TYPES)[number];
export type UseFrequency = (typeof USE_FREQUENCIES)[number];
export type GenerationMode = "rules" | "llm-stub";
export type ParticipantMode = "sample" | "manual";
export type ChatTopic =
  | "favorite"
  | "most-used"
  | "secretly-hated"
  | "participant-pattern"
  | "defense"
  | "verdict";
export type CharacterRelationshipLabel =
  | "close, confident, possessive"
  | "resentful, taken for granted"
  | "idealized, neglected, dramatic"
  | "toxic dependency"
  | "peripheral observer"
  | "familiar but keeping score";
export type StyleTag =
  | "nosy"
  | "chronically online"
  | "possessive"
  | "dry"
  | "competent"
  | "overworked"
  | "blunt"
  | "impatient"
  | "snarky"
  | "observant"
  | "judgy"
  | "matter-of-fact"
  | "steady"
  | "maternal"
  | "quietly superior"
  | "fast"
  | "sharp"
  | "cutting"
  | "dramatic"
  | "poetic"
  | "underbooked"
  | "bitter"
  | "service-minded"
  | "bone-tired"
  | "intimate"
  | "tolerant"
  | "deeply aware"
  | "territorial"
  | "fed up"
  | "yearning"
  | "petty";
export type NumericTrait = "pride" | "resentment" | "neglect" | "dependencyPower";
export type GenerationProvider = {
  mode: GenerationMode;
  generate: (inputs: DeviceInput[]) => Promise<GenerationResult>;
};

export type DeviceInput = {
  deviceType: DeviceType;
  likeScore: 1 | 2 | 3 | 4 | 5;
  frequency: UseFrequency;
  lovePercent: number;
  hateRank: number;
  dependenceScore?: 1 | 2 | 3 | 4 | 5;
};

export type DeviceArchetype = {
  deviceType: DeviceType;
  label: string;
  emoji: string;
  baseTemperament: string;
  baseRole: string;
  styleTags: StyleTag[];
};

export type DeviceCharacter = {
  deviceType: DeviceType;
  name: string;
  emoji: string;
  archetype: string;
  styleTags: StyleTag[];
  relationshipLabel: CharacterRelationshipLabel;
  pride: number;
  resentment: number;
  neglect: number;
  dependencyPower: number;
  participantInput: DeviceInput;
};

export type ParticipantPattern = {
  label: string;
  intensity: number;
  evidence: string;
};

export type ParticipantInference = {
  summary: string;
  poeticDiagnosis: string;
  patterns: ParticipantPattern[];
  deviceVerdict: string;
};

export type ChatMessage = {
  id: string;
  speaker: DeviceType;
  speakerName: string;
  emoji: string;
  topic: ChatTopic;
  text: string;
};

export type GenerationResult = {
  characters: DeviceCharacter[];
  inference: ParticipantInference;
  messages: ChatMessage[];
};

export type EditableContent = {
  introTitle: string;
  introDescription: string;
  introButton: string;
  selectionTitle: string;
  selectionDescription: string;
  ratingTitle: string;
  ratingDescription: string;
  synthesisLines: string[];
  chatroomTitle: string;
  verdictTitle: string;
  verdictSubtitle: string;
  restartLabel: string;
  sampleToggleLabel: string;
  manualToggleLabel: string;
  rulesModeLabel: string;
  llmModeLabel: string;
};
