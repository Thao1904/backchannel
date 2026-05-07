export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  speaker?: string;
  content: string;
  createdAt: number;
}

export interface VaultDocument {
  id: string;
  name: string;
  value: string;
  info?: string;
  fileName?: string;
  fileType?: string;
  fileDataUrl?: string;
  createdAt: number;
}

export interface SessionPrompt {
  id: string;
  title: string;
  content: string;
}

export type ReplySpeed = "slow" | "normal" | "fast" | "instant";
export type ChatLanguage = "vi" | "en";
export type CameraTrackingState = "RED" | "GREEN" | "YELLOW" | "BLUE";
export type CameraRenderMode = "cipher" | "normal";
export type SurveyFrequency = "rarely" | "sometimes" | "everyday" | "constantly";

export interface CameraStateRenderMap {
  RED: CameraRenderMode;
  GREEN: CameraRenderMode;
  YELLOW: CameraRenderMode;
  BLUE: CameraRenderMode;
}

export interface SurveyOwnerContext {
  ownerName: string;
  language?: ChatLanguage;
  tone?: string;
  householdSummary?: string;
}

export interface SurveyDeviceRecord {
  id: string;
  name: string;
  type?: string;
  likeScore: 1 | 2 | 3 | 4 | 5;
  frequency: SurveyFrequency;
  helpfulnessPercent: number;
  easeOfUseScore: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

export interface SurveyCollectionPayload {
  owner: SurveyOwnerContext;
  devices: SurveyDeviceRecord[];
}

export interface StoredSurveyPayload {
  savedAt: number;
  survey: SurveyCollectionPayload;
}

export interface GeneratedChatCache {
  surveySignature: string;
  savedAt: number;
  owner: SurveyOwnerContext;
  personas: PersonaCard[];
  episodes: GeneratedConversationEpisode[];
  provider: "rules" | "gemini" | "openrouter";
  model: string;
}

export interface ConversationArchiveRecord {
  id: string;
  sessionId: string;
  surveySignature: string;
  createdAt: number;
  updatedAt: number;
  owner: SurveyOwnerContext;
  provider: "rules" | "gemini" | "openrouter";
  model: string;
  personas: PersonaCard[];
  messages: ChatMessage[];
}

export interface DeviceFeatureMap {
  attachmentScore: number;
  utilityScore: number;
  frictionScore: number;
  dependenceScore: number;
  resentmentPotential: number;
  replaceRisk: number;
  neglectRisk: number;
  archetype: string;
  speakingStyle: string;
  ownerDynamic: string;
  summary: string;
}

export interface PersonaCard {
  deviceId: string;
  name: string;
  archetype: string;
  personality: string;
  voiceStyle: string;
  ownerDynamic: string;
  gossipAngle: string;
  catchphrase: string;
  scores: DeviceFeatureMap;
}

export interface PersonaRequest {
  survey: SurveyCollectionPayload;
  model?: string;
}

export interface PersonaResponse {
  owner: SurveyOwnerContext;
  personas: PersonaCard[];
  provider: "rules" | "gemini" | "openrouter";
  model: string;
}

export interface GeneratedConversationLine {
  speaker: string;
  content: string;
  mood: string;
}

export interface GeneratedConversationEpisode {
  id: string;
  title: string;
  summary: string;
  lines: GeneratedConversationLine[];
}

export interface ChatGenerationRequest {
  owner: SurveyOwnerContext;
  personas: PersonaCard[];
  episodeCount?: number;
  linesPerEpisode?: number;
  model?: string;
  conversationPromptTemplate?: string;
}

export interface ChatGenerationResponse {
  owner: SurveyOwnerContext;
  episodes: GeneratedConversationEpisode[];
  provider: "rules" | "gemini" | "openrouter";
  model: string;
}

export interface BootstrapChatRequest {
  survey: SurveyCollectionPayload;
  episodeCount?: number;
  linesPerEpisode?: number;
  model?: string;
  conversationPromptTemplate?: string;
}

export interface BootstrapChatResponse {
  owner: SurveyOwnerContext;
  personas: PersonaCard[];
  episodes: GeneratedConversationEpisode[];
  provider: "rules" | "gemini" | "openrouter";
  model: string;
}

export interface InteractiveReplyRequest {
  owner: SurveyOwnerContext;
  personas: PersonaCard[];
  userMessage: string;
  recentMessages?: Pick<ChatMessage, "speaker" | "content" | "role">[];
  model?: string;
  conversationPromptTemplate?: string;
}

export interface InteractiveReplyResponse {
  speaker?: string;
  content?: string;
  replies: {
    speaker: string;
    content: string;
  }[];
  provider: "rules" | "gemini" | "openrouter";
  model: string;
}

export interface AdminSettings {
  replySpeed: ReplySpeed;
  autoChatGapSeconds: number;
  typingIndicator: boolean;
  autoScroll: boolean;
  typewriterEffect: boolean;
  cipherMode: boolean;
  ownerName: string;
  userReplyDelaySeconds: number;
  language: ChatLanguage;
  cameraStateRenderMap: CameraStateRenderMap;
  cameraOpenThreshold: number;
  cameraClosedThreshold: number;
  cameraOcclusionThreshold: number;
  cameraUncertainThreshold: number;
  cameraSensitivity: number;
  conversationPromptTemplate: string;
  transferScreenTitle: string;
  transferScreenSubtitle: string;
  transferScreenDurationMs: number;
}
