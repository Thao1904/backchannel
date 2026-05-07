import { generateRuleBasedChat } from "@/lib/generation/chat";
import { inferParticipantPattern } from "@/lib/generation/inference";
import { synthesizeCharacters } from "@/lib/generation/synthesis";
import type {
  DeviceInput,
  GenerationMode,
  GenerationProvider,
  GenerationResult,
} from "@/types/backchannel";

export function generateChatWithRules(inputs: DeviceInput[]): GenerationResult {
  const characters = synthesizeCharacters(inputs);
  const inference = inferParticipantPattern(characters);

  return {
    characters,
    inference,
    messages: generateRuleBasedChat(characters, inference),
  };
}

export async function generateChatWithLLM(
  inputs: DeviceInput[],
): Promise<GenerationResult> {
  // TODO: Replace this fallback with a real provider call.
  // Suggested shape:
  // 1. build a prompt from `inputs` and the synthesized characters
  // 2. call OpenAI or a local model here
  // 3. validate the returned messages into `GenerationResult`
  // 4. keep this function deterministic in tests by mocking the provider
  const fallback = generateChatWithRules(inputs);
  const narrator = fallback.characters[0];

  if (!narrator) {
    return fallback;
  }

  return Promise.resolve({
    ...fallback,
    messages: [
      ...fallback.messages,
      {
        id: "llm-stub-note",
        speaker: narrator.deviceType,
        speakerName: narrator.name,
        emoji: narrator.emoji,
        topic: "verdict",
        text: "LLM-ready stub active. Swap this provider with OpenAI or a local model later.",
      },
    ],
  });
}

export async function generateChatByMode(
  inputs: DeviceInput[],
  mode: GenerationMode,
) {
  const providers: Record<GenerationMode, GenerationProvider> = {
    rules: {
      mode: "rules",
      generate: async (nextInputs) => generateChatWithRules(nextInputs),
    },
    "llm-stub": {
      mode: "llm-stub",
      generate: async (nextInputs) => generateChatWithLLM(nextInputs),
    },
  };

  return providers[mode].generate(inputs);
}
