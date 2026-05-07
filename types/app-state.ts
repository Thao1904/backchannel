import type {
  DeviceInput,
  DeviceType,
  EditableContent,
  GenerationMode,
  GenerationResult,
  ParticipantMode,
} from "@/types/backchannel";

export type AppState = {
  participantMode: ParticipantMode;
  generationMode: GenerationMode;
  selectedDevices: DeviceType[];
  ratings: Record<DeviceType, DeviceInput | undefined>;
  content: EditableContent;
  generation: GenerationResult | null;
};
