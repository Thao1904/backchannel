import type {
  AdminSettings,
  ChatMessage,
  ConversationArchiveRecord,
  GeneratedChatCache,
  SessionPrompt,
  StoredSurveyPayload,
  VaultDocument,
} from "@/lib/chat-types";
import { defaultAdminSettings, defaultSessionPrompts } from "@/lib/chat-utils";

const storageKeys = {
  messages: "chat.messages",
  documents: "chat.documents",
  sessionPrompts: "chat.sessionPrompts",
  adminSettings: "chat.adminSettings",
  surveyPayload: "chat.surveyPayload",
  generatedChatCache: "chat.generatedChatCache",
  conversationArchives: "chat.conversationArchives",
} as const;

function canUseStorage() {
  return typeof window !== "undefined";
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (!canUseStorage()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadMessages() {
  return loadFromStorage<ChatMessage[]>(storageKeys.messages, []);
}

export function saveMessages(messages: ChatMessage[]) {
  saveToStorage(storageKeys.messages, messages);
}

export function loadDocuments() {
  return loadFromStorage<VaultDocument[]>(storageKeys.documents, []);
}

export function saveDocuments(documents: VaultDocument[]) {
  saveToStorage(storageKeys.documents, documents);
}

export function loadSessionPrompts() {
  return loadFromStorage<SessionPrompt[]>(
    storageKeys.sessionPrompts,
    defaultSessionPrompts,
  );
}

export function saveSessionPrompts(prompts: SessionPrompt[]) {
  saveToStorage(storageKeys.sessionPrompts, prompts);
}

export function loadAdminSettings() {
  const stored = loadFromStorage<Partial<AdminSettings>>(
    storageKeys.adminSettings,
    defaultAdminSettings,
  );

  return {
    ...defaultAdminSettings,
    ...stored,
  };
}

export function saveAdminSettings(settings: AdminSettings) {
  saveToStorage(storageKeys.adminSettings, settings);
}

export function loadSurveyPayload() {
  return loadFromStorage<StoredSurveyPayload | null>(
    storageKeys.surveyPayload,
    null,
  );
}

export function saveSurveyPayload(payload: StoredSurveyPayload) {
  saveToStorage(storageKeys.surveyPayload, payload);
}

export function loadGeneratedChatCache() {
  return loadFromStorage<GeneratedChatCache | null>(
    storageKeys.generatedChatCache,
    null,
  );
}

export function saveGeneratedChatCache(cache: GeneratedChatCache) {
  saveToStorage(storageKeys.generatedChatCache, cache);
}

export function clearGeneratedChatCache() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(storageKeys.generatedChatCache);
}

export function loadConversationArchives() {
  return loadFromStorage<ConversationArchiveRecord[]>(
    storageKeys.conversationArchives,
    [],
  );
}

export function saveConversationArchives(records: ConversationArchiveRecord[]) {
  saveToStorage(storageKeys.conversationArchives, records);
}

export function upsertConversationArchive(record: ConversationArchiveRecord) {
  const existing = loadConversationArchives();
  const nextRecords = [...existing];
  const index = nextRecords.findIndex((item) => item.id === record.id);

  if (index >= 0) {
    nextRecords[index] = record;
  } else {
    nextRecords.unshift(record);
  }

  nextRecords.sort((a, b) => b.updatedAt - a.updatedAt);
  saveConversationArchives(nextRecords);
}

export function deleteConversationArchive(id: string) {
  saveConversationArchives(
    loadConversationArchives().filter((record) => record.id !== id),
  );
}
