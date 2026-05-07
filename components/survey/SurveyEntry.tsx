"use client";

import { EyesFollow } from "@/components/chat/EyesFollow";
import { BackchannelPrototype } from "@/components/survey/backchannel-prototype";
import {
  clearGeneratedChatCache,
  loadAdminSettings,
  saveAdminSettings,
  saveMessages,
  saveSurveyPayload,
} from "@/lib/chat-storage";
import { buildSurveyPayloadFromPrototypeState } from "@/lib/survey-intelligence";

export function SurveyEntry() {
  return (
    <div className="survey-theme min-h-screen">
      <div className="pointer-events-none fixed inset-x-0 top-6 z-40 flex justify-center">
        <EyesFollow />
      </div>
      <BackchannelPrototype
        onComplete={(state) => {
          const settings = loadAdminSettings();
          const survey = buildSurveyPayloadFromPrototypeState({
            state,
            language: settings.language,
          });

          saveAdminSettings({
            ...settings,
            ownerName: survey.owner.ownerName,
          });

          clearGeneratedChatCache();
          saveMessages([]);
          saveSurveyPayload({
            savedAt: Date.now(),
            survey,
          });

          window.location.href = "/chat/transfer";
        }}
      />
    </div>
  );
}
