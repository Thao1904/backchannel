import { sortByMetric } from "@/lib/generation/utils";
import type {
  ChatMessage,
  DeviceCharacter,
  GenerationResult,
  ParticipantInference,
} from "@/types/backchannel";

function makeMessage(
  id: string,
  speaker: DeviceCharacter,
  topic: ChatMessage["topic"],
  text: string,
): ChatMessage {
  return {
    id,
    speaker: speaker.deviceType,
    speakerName: speaker.name,
    emoji: speaker.emoji,
    topic,
    text,
  };
}

export function generateRuleBasedChat(
  characters: DeviceCharacter[],
  inference: ParticipantInference,
): ChatMessage[] {
  const favorite = sortByMetric(characters, (item) => item.pride)[0];
  const mostUsed = sortByMetric(characters, (item) => item.dependencyPower)[0];
  const secretlyHated = [...characters].sort(
    (left, right) =>
      left.participantInput.hateRank - right.participantInput.hateRank,
  )[0];
  const sharpestObserver = sortByMetric(characters, (item) => item.resentment)[0];
  const defender = sortByMetric(
    characters.filter((item) => item.deviceType !== secretlyHated.deviceType),
    (item) => item.pride - item.resentment,
  )[0];
  const finalJudge = sortByMetric(characters, (item) => item.neglect)[0];

  return [
    // Topic 1: who thinks they are the favorite
    makeMessage(
      "favorite-1",
      favorite,
      "favorite",
      `Please, I am obviously the favorite. The attachment pattern is literally glowing.`,
    ),
    makeMessage(
      "favorite-2",
      sharpestObserver,
      "favorite",
      `Favorite? Sure. But only because they panic when ${favorite.name.toLowerCase()} is not within arm's reach.`,
    ),
    // Topic 2: who gets used the most
    makeMessage(
      "most-used-1",
      mostUsed,
      "most-used",
      `I carry this entire routine. They touch me like a reflex, not a choice.`,
    ),
    makeMessage(
      "most-used-2",
      secretlyHated,
      "most-used",
      `And somehow the most-used role still comes with disrespect. Very chic. Very exhausting.`,
    ),
    // Topic 3: who is secretly hated
    makeMessage(
      "hated-1",
      secretlyHated,
      "secretly-hated",
      `Be so honest right now, why is my hate rank this high if you keep coming back to me?`,
    ),
    // Topic 4: what these patterns reveal about the participant
    makeMessage(
      "pattern-1",
      sharpestObserver,
      "participant-pattern",
      `Their whole personality is repetition plus guilt. ${inference.summary}`,
    ),
    makeMessage(
      "pattern-2",
      favorite,
      "participant-pattern",
      `They do not want ease. They want emotional support disguised as convenience.`,
    ),
    // Topic 5: one device unexpectedly defends the participant
    makeMessage(
      "defense-1",
      defender,
      "defense",
      `Okay but I will say this: they are trying. Messily, inconsistently, but trying.`,
    ),
    makeMessage(
      "defense-2",
      defender,
      "defense",
      `Some of that chaos is survival, not laziness. I can tell the difference.`,
    ),
    // Topic 6: a final painful-but-true verdict
    makeMessage(
      "verdict-1",
      finalJudge,
      "verdict",
      `Painful but true? ${inference.poeticDiagnosis}`,
    ),
    makeMessage(
      "verdict-2",
      finalJudge,
      "verdict",
      `${inference.deviceVerdict}`,
    ),
  ];
}

export function assembleGenerationResult(
  characters: DeviceCharacter[],
  inference: ParticipantInference,
): GenerationResult {
  return {
    characters,
    inference,
    messages: generateRuleBasedChat(characters, inference),
  };
}

/*
Unit-test-like examples:

const messages = generateRuleBasedChat(characters, inference);
// messages[0].topic === "favorite"
// messages[messages.length - 1].topic === "verdict"
// The message order always follows the six requested conversation topics.
*/
