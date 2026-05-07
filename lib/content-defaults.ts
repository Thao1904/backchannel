import type { EditableContent } from "@/types/backchannel";

export const defaultContent: EditableContent = {
  introTitle: "Backchannel",
  introDescription:
    "A speculative group chat where your devices gossip about your routines, contradictions, and soft spots.",
  introButton: "Start",
  selectionTitle: "Choose the room",
  selectionDescription:
    "Pick 5 to 6 devices that quietly know too much about your life.",
  ratingTitle: "Rate the tension",
  ratingDescription:
    "Tell the room who you rely on, who you love, and who you secretly resent.",
  synthesisLines: [
    "building the room...",
    "assigning tensions...",
    "detecting who feels used...",
  ],
  chatroomTitle: "Group chat transcript",
  verdictTitle: "What your devices think of you",
  verdictSubtitle:
    "A poetic diagnosis assembled from repetition, neglect, and dependency.",
  restartLabel: "Restart",
  sampleToggleLabel: "Use sample participant",
  manualToggleLabel: "Enter my own ratings",
  rulesModeLabel: "Rule-based demo",
  llmModeLabel: "LLM-ready stub",
};
