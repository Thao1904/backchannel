"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CameraTracker } from "@/components/chat/CameraTracker";
import type {
  AdminSettings,
  CameraTrackingState,
  SessionPrompt,
  StoredSurveyPayload,
  VaultDocument,
} from "@/lib/chat-types";
import {
  loadAdminSettings,
  loadDocuments,
  loadMessages,
  loadSessionPrompts,
  loadSurveyPayload,
  saveAdminSettings,
  saveDocuments,
  saveMessages,
  saveSessionPrompts,
  saveSurveyPayload,
} from "@/lib/chat-storage";
import {
  createId,
  defaultAdminSettings,
  defaultSessionPrompts,
  getChatCopy,
} from "@/lib/chat-utils";
import {
  buildChatSurveyPayload,
  buildRuleBasedPersonas,
} from "@/lib/survey-intelligence";

type SettingsSection = "data" | "camera" | "cast" | "prompts";

export default function ChatSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hasHydrated, setHasHydrated] = useState(false);
  const [activeSection, setActiveSection] = useState<SettingsSection>("data");
  const [adminSettings, setAdminSettings] =
    useState<AdminSettings>(defaultAdminSettings);
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [sessionPrompts, setSessionPrompts] =
    useState<SessionPrompt[]>(defaultSessionPrompts);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [promptTitle, setPromptTitle] = useState("");
  const [promptContent, setPromptContent] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [documentInfo, setDocumentInfo] = useState("");
  const [documentValue, setDocumentValue] = useState("");
  const [cameraState, setCameraState] = useState<CameraTrackingState>("BLUE");
  const [previewCipherMode, setPreviewCipherMode] = useState(false);
  const [surveyPayload, setSurveyPayload] = useState<StoredSurveyPayload | null>(
    null,
  );

  useEffect(() => {
    setAdminSettings(loadAdminSettings());
    setDocuments(loadDocuments());
    setSessionPrompts(loadSessionPrompts());
    setSurveyPayload(loadSurveyPayload());
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!surveyPayload?.survey.owner.ownerName) {
      return;
    }

    setAdminSettings((current) =>
      current.ownerName === surveyPayload.survey.owner.ownerName
        ? current
        : {
            ...current,
            ownerName: surveyPayload.survey.owner.ownerName,
          },
    );
  }, [surveyPayload]);

  useEffect(() => {
    if (!hasHydrated) return;
    saveAdminSettings(adminSettings);
  }, [adminSettings, hasHydrated]);

  useEffect(() => {
    if (!hasHydrated) return;
    saveDocuments(documents);
  }, [documents, hasHydrated]);

  useEffect(() => {
    if (!hasHydrated) return;
    saveSessionPrompts(sessionPrompts);
  }, [hasHydrated, sessionPrompts]);

  const copy = getChatCopy(adminSettings.language);
  const activeSurvey = useMemo(
    () =>
      surveyPayload?.survey.devices.length
        ? {
            ...surveyPayload.survey,
            owner: {
              ...surveyPayload.survey.owner,
              ownerName:
                surveyPayload.survey.owner.ownerName || adminSettings.ownerName,
              language: adminSettings.language,
            },
          }
        : buildChatSurveyPayload({
            ownerName: adminSettings.ownerName,
            language: adminSettings.language,
            documents,
          }),
    [adminSettings.language, adminSettings.ownerName, documents, surveyPayload],
  );
  const liveCastPersonas = useMemo(() => {
    return buildRuleBasedPersonas(activeSurvey).personas;
  }, [activeSurvey]);
  const isEnglish = adminSettings.language === "en";
  const openedFromSurvey = searchParams?.get("source") === "survey";

  function handleOwnerNameChange(nextOwnerName: string) {
    setAdminSettings((current) => ({
      ...current,
      ownerName: nextOwnerName,
    }));

    if (!surveyPayload) {
      return;
    }

    const nextSurveyPayload = {
      ...surveyPayload,
      survey: {
        ...surveyPayload.survey,
        owner: {
          ...surveyPayload.survey.owner,
          ownerName: nextOwnerName,
        },
      },
    };

    setSurveyPayload(nextSurveyPayload);
    saveSurveyPayload(nextSurveyPayload);
  }

  function resetPromptEditor() {
    setEditingPromptId(null);
    setPromptTitle("");
    setPromptContent("");
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-5 sm:px-6">
      <section className="rounded-[2rem] border-[2px] border-white/90 bg-[#1d1d1d] px-5 py-5 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)] sm:px-8 sm:py-7">
        <div className="flex items-center justify-between gap-4">
          <div className="flex rounded-[0.95rem] border-[2px] border-white/90 p-1">
            <button
              type="button"
              onClick={() =>
                setAdminSettings((current) => ({ ...current, language: "vi" }))
              }
              className={`rounded-[0.7rem] px-4 py-2 text-sm font-black uppercase transition ${
                adminSettings.language === "vi"
                  ? "bg-white text-black"
                  : "text-white"
              }`}
            >
              Vie
            </button>
            <button
              type="button"
              onClick={() =>
                setAdminSettings((current) => ({ ...current, language: "en" }))
              }
              className={`rounded-[0.7rem] px-4 py-2 text-sm font-black uppercase transition ${
                adminSettings.language === "en"
                  ? "bg-white text-black"
                  : "text-white"
              }`}
            >
              Eng
            </button>
          </div>

          <div className="text-center">
            <p className="text-3xl font-black uppercase tracking-[-0.08em] sm:text-5xl">
              Setting
            </p>
          </div>

          {openedFromSurvey ? (
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-[0.95rem] border-[2px] border-white/90 px-4 py-2 text-sm font-black lowercase transition hover:bg-white hover:text-black"
            >
              {isEnglish ? "close" : "dong"}
            </button>
          ) : (
            <div className="flex gap-3">
              <Link
                href="/chat/database"
                className="rounded-[0.95rem] border-[2px] border-white/30 bg-[#343434] px-4 py-2 text-sm font-black lowercase transition hover:bg-white hover:text-black"
              >
                {isEnglish ? "database" : "database"}
              </Link>
              <Link
                href="/chat"
                className="rounded-[0.95rem] border-[2px] border-white/90 px-4 py-2 text-sm font-black lowercase transition hover:bg-white hover:text-black"
              >
                {isEnglish ? "back to chat" : "ve chat"}
              </Link>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <SectionTab
            active={activeSection === "data"}
            label={isEnglish ? "data" : "data"}
            onClick={() => setActiveSection("data")}
          />
          <SectionTab
            active={activeSection === "camera"}
            label={isEnglish ? "camera control" : "camera control"}
            onClick={() => setActiveSection("camera")}
          />
          <SectionTab
            active={activeSection === "cast"}
            label={isEnglish ? "live cast" : "live cast"}
            onClick={() => setActiveSection("cast")}
          />
          <SectionTab
            active={activeSection === "prompts"}
            label={isEnglish ? "prompt library" : "prompt library"}
            onClick={() => setActiveSection("prompts")}
          />
        </div>

        <div className="mt-5 rounded-[1.8rem] bg-[#252525] p-5 sm:p-7">
          {activeSection === "data" ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <SettingCard title={copy.ownerName}>
                <input
                  value={adminSettings.ownerName}
                  onChange={(event) => handleOwnerNameChange(event.target.value)}
                  className="vault-input w-full rounded-[0.95rem] border-white/15 px-4 py-3"
                />
              </SettingCard>

              <SettingCard title={copy.replyUnlockSeconds}>
                <input
                  type="number"
                  min={0}
                  step={5}
                  value={adminSettings.userReplyDelaySeconds}
                  onChange={(event) =>
                    setAdminSettings((current) => ({
                      ...current,
                      userReplyDelaySeconds: Math.max(
                        0,
                        Number(event.target.value) || 0,
                      ),
                    }))
                  }
                  className="vault-input w-full rounded-[0.95rem] border-white/15 px-4 py-3"
                />
              </SettingCard>

              <SettingCard title={copy.autoChatGapSeconds}>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={adminSettings.autoChatGapSeconds}
                  onChange={(event) =>
                    setAdminSettings((current) => ({
                      ...current,
                      autoChatGapSeconds: Math.max(
                        0,
                        Number(event.target.value) || 0,
                      ),
                    }))
                  }
                  className="vault-input w-full rounded-[0.95rem] border-white/15 px-4 py-3"
                />
              </SettingCard>

              <SettingCard title={copy.replySpeed}>
                <select
                  value={adminSettings.replySpeed}
                  onChange={(event) =>
                    setAdminSettings((current) => ({
                      ...current,
                      replySpeed: event.target.value as AdminSettings["replySpeed"],
                    }))
                  }
                  className="vault-input w-full rounded-[0.95rem] border-white/15 px-4 py-3"
                >
                  <option value="slow">{isEnglish ? "slow" : "cham"}</option>
                  <option value="normal">{isEnglish ? "normal" : "thuong"}</option>
                  <option value="fast">{isEnglish ? "fast" : "nhanh"}</option>
                  <option value="instant">
                    {isEnglish ? "instant" : "ngay lap tuc"}
                  </option>
                </select>
              </SettingCard>

              <SettingCard
                title={copy.responseControls}
                className="lg:col-span-2"
              >
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <TogglePill
                    label={copy.typing}
                    checked={adminSettings.typingIndicator}
                    onToggle={() =>
                      setAdminSettings((current) => ({
                        ...current,
                        typingIndicator: !current.typingIndicator,
                      }))
                    }
                  />
                  <TogglePill
                    label={isEnglish ? "Auto scroll" : "Tu cuon"}
                    checked={adminSettings.autoScroll}
                    onToggle={() =>
                      setAdminSettings((current) => ({
                        ...current,
                        autoScroll: !current.autoScroll,
                      }))
                    }
                  />
                  <TogglePill
                    label={copy.typewriter}
                    checked={adminSettings.typewriterEffect}
                    onToggle={() =>
                      setAdminSettings((current) => ({
                        ...current,
                        typewriterEffect: !current.typewriterEffect,
                      }))
                    }
                  />
                  <TogglePill
                    label={copy.cipher}
                    checked={adminSettings.cipherMode}
                    onToggle={() =>
                      setAdminSettings((current) => ({
                        ...current,
                        cipherMode: !current.cipherMode,
                      }))
                    }
                  />
                </div>
              </SettingCard>

              <SettingCard title={isEnglish ? "Conversation reset" : "Reset hoi thoai"}>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      saveMessages([]);
                      window.location.href = "/chat";
                    }}
                    className="rounded-[0.95rem] border-[2px] border-white bg-white px-5 py-3 text-sm font-black text-black transition hover:bg-transparent hover:text-white"
                  >
                    {copy.restartAutoGossip}
                  </button>
                  <Link
                    href="/chat/transfer"
                    className="rounded-[0.95rem] border-[2px] border-white/30 bg-[#3a3a3a] px-5 py-3 text-sm font-black text-white transition hover:bg-white hover:text-black"
                  >
                    {isEnglish ? "Preview transition" : "Preview transition"}
                  </Link>
                </div>
              </SettingCard>

              <SettingCard
                title={isEnglish ? "Transfer screen" : "Man hinh chuyen giao"}
                className="lg:col-span-2"
              >
                <div className="grid gap-3">
                  <p className="text-sm leading-7 text-white/62">
                    {isEnglish
                      ? "This screen is meant to appear after the survey is finished. It fades from pink into black, shows your chosen message, then transitions into the current chat UI."
                      : "Man hinh nay dung de chen vao sau khi survey hoan thanh. No se fade tu hong sang den, hien message ban chinh, roi chuyen vao giao dien chat hien tai."}
                  </p>
                  <Field label={isEnglish ? "Main text" : "Text chinh"}>
                    <input
                      value={adminSettings.transferScreenTitle}
                      onChange={(event) =>
                        setAdminSettings((current) => ({
                          ...current,
                          transferScreenTitle: event.target.value,
                        }))
                      }
                      className="vault-input w-full rounded-[0.95rem] border-white/15 px-4 py-3"
                    />
                  </Field>
                  <Field label={isEnglish ? "Supporting text" : "Text phu"}>
                    <textarea
                      value={adminSettings.transferScreenSubtitle}
                      onChange={(event) =>
                        setAdminSettings((current) => ({
                          ...current,
                          transferScreenSubtitle: event.target.value,
                        }))
                      }
                      rows={4}
                      className="vault-input w-full rounded-[0.95rem] border-white/15 px-4 py-3"
                    />
                  </Field>
                  <Field label={isEnglish ? "Duration (ms)" : "Thoi gian (ms)"}>
                    <input
                      type="number"
                      min={1200}
                      step={100}
                      value={adminSettings.transferScreenDurationMs}
                      onChange={(event) =>
                        setAdminSettings((current) => ({
                          ...current,
                          transferScreenDurationMs: Math.max(
                            1200,
                            Number(event.target.value) || 1200,
                          ),
                        }))
                      }
                      className="vault-input w-full rounded-[0.95rem] border-white/15 px-4 py-3"
                    />
                  </Field>
                </div>
              </SettingCard>
            </div>
          ) : null}

          {activeSection === "camera" ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <SettingCard title={copy.cameraSensitivity}>
                <div className="grid gap-3">
                  <input
                    type="range"
                    min={0.5}
                    max={1.5}
                    step={0.05}
                    value={adminSettings.cameraSensitivity}
                    onChange={(event) =>
                      setAdminSettings((current) => ({
                        ...current,
                        cameraSensitivity: Number(event.target.value) || 1,
                      }))
                    }
                    className="w-full accent-white"
                  />
                  <span className="text-sm font-bold text-white/72">
                    {adminSettings.cameraSensitivity.toFixed(2)}x
                  </span>
                </div>
              </SettingCard>

              <SettingCard title={copy.currentCameraState}>
                <div className="flex flex-wrap gap-2">
                  <StatusPill label={copy.stateLabel(cameraState)} />
                  <StatusPill label={adminSettings.cameraStateRenderMap[cameraState]} />
                  <StatusPill label={previewCipherMode ? copy.cipher : copy.normal} />
                </div>
              </SettingCard>

              {(["RED", "BLUE", "GREEN", "YELLOW"] as const).map((state) => (
                <SettingCard key={state} title={copy.mappingLabel(state)}>
                  <select
                    value={adminSettings.cameraStateRenderMap[state]}
                    onChange={(event) =>
                      setAdminSettings((current) => ({
                        ...current,
                        cameraStateRenderMap: {
                          ...current.cameraStateRenderMap,
                          [state]: event.target.value as "cipher" | "normal",
                        },
                      }))
                    }
                    className="vault-input w-full rounded-[0.95rem] border-white/15 px-4 py-3"
                  >
                    <option value="cipher">{copy.cipher}</option>
                    <option value="normal">{copy.normal}</option>
                  </select>
                </SettingCard>
              ))}

              <SettingCard title={copy.openThreshold}>
                <input
                  type="number"
                  min={0.1}
                  max={0.6}
                  step={0.01}
                  value={adminSettings.cameraOpenThreshold}
                  onChange={(event) =>
                    setAdminSettings((current) => ({
                      ...current,
                      cameraOpenThreshold: Number(event.target.value) || 0,
                    }))
                  }
                  className="vault-input w-full rounded-[0.95rem] border-white/15 px-4 py-3"
                />
              </SettingCard>

              <SettingCard title={copy.closedThreshold}>
                <input
                  type="number"
                  min={0.01}
                  max={0.2}
                  step={0.005}
                  value={adminSettings.cameraClosedThreshold}
                  onChange={(event) =>
                    setAdminSettings((current) => ({
                      ...current,
                      cameraClosedThreshold: Number(event.target.value) || 0,
                    }))
                  }
                  className="vault-input w-full rounded-[0.95rem] border-white/15 px-4 py-3"
                />
              </SettingCard>

              <SettingCard title={copy.occlusionThreshold}>
                <input
                  type="number"
                  min={0.1}
                  max={0.9}
                  step={0.01}
                  value={adminSettings.cameraOcclusionThreshold}
                  onChange={(event) =>
                    setAdminSettings((current) => ({
                      ...current,
                      cameraOcclusionThreshold: Number(event.target.value) || 0,
                    }))
                  }
                  className="vault-input w-full rounded-[0.95rem] border-white/15 px-4 py-3"
                />
              </SettingCard>

              <SettingCard title={copy.uncertainThreshold}>
                <input
                  type="number"
                  min={0.1}
                  max={0.95}
                  step={0.01}
                  value={adminSettings.cameraUncertainThreshold}
                  onChange={(event) =>
                    setAdminSettings((current) => ({
                      ...current,
                      cameraUncertainThreshold: Number(event.target.value) || 0,
                    }))
                  }
                  className="vault-input w-full rounded-[0.95rem] border-white/15 px-4 py-3"
                />
              </SettingCard>

              <SettingCard title={copy.cameraPreview} className="lg:col-span-2">
                <p className="mb-4 text-sm font-medium text-white/55">
                  {isEnglish
                    ? "Default thresholds: open 0.275, closed 0.055, occlusion 0.48, uncertain 0.62, sensitivity 1.00."
                    : "Mac dinh ban dau: open 0.275, closed 0.055, occlusion 0.48, uncertain 0.62, sensitivity 1.00."}
                </p>
                <CameraTracker
                  settings={adminSettings}
                  onCipherChange={setPreviewCipherMode}
                  onStateChange={setCameraState}
                  className="h-52 sm:h-64"
                />
              </SettingCard>
            </div>
          ) : null}

          {activeSection === "cast" ? (
            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <SettingCard title={isEnglish ? "Live cast" : "Live cast"}>
                <div className="space-y-3">
                  {liveCastPersonas.map((persona, index) => (
                    <article
                      key={persona.deviceId}
                      className="rounded-[1rem] bg-[#313131] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-base font-black uppercase tracking-[0.04em]">
                          {persona.name}
                        </h3>
                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/55">
                          {documents.length > 0 && index < documents.length
                            ? "document"
                            : "default"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-white/78">
                        {persona.archetype}
                      </p>
                      <p className="mt-2 text-sm font-medium text-white/62">
                        {persona.personality}
                      </p>
                      <div className="mt-3 grid gap-2 text-xs leading-6 text-white/58">
                        <p><span className="font-black text-white/75">Voice:</span> {persona.voiceStyle}</p>
                        <p><span className="font-black text-white/75">Owner dynamic:</span> {persona.ownerDynamic}</p>
                        <p><span className="font-black text-white/75">Gossip angle:</span> {persona.gossipAngle}</p>
                        <p><span className="font-black text-white/75">Catchphrase:</span> {persona.catchphrase}</p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <MiniMetric label="attach" value={persona.scores.attachmentScore} />
                        <MiniMetric label="utility" value={persona.scores.utilityScore} />
                        <MiniMetric label="friction" value={persona.scores.frictionScore} />
                        <MiniMetric label="depend" value={persona.scores.dependenceScore} />
                        <MiniMetric label="resent" value={persona.scores.resentmentPotential} />
                        <MiniMetric label="replace" value={persona.scores.replaceRisk} />
                        <MiniMetric label="neglect" value={persona.scores.neglectRisk} />
                      </div>
                    </article>
                  ))}
                </div>
              </SettingCard>

              <div className="grid gap-4">
                <SettingCard title={isEnglish ? "Persona notes" : "Ghi chu persona"}>
                  <p className="text-sm leading-7 text-white/62">
                    {isEnglish
                      ? "This panel is where the full cast profile lives. Right now it shows the characteristics inferred from the current object data. Later, if Gemini or survey data assigns richer personas, they can stay visible here too."
                      : "Day la noi hien full profile cua cast. Hien tai no dang show cac characteristic suy ra tu object data hien co. Sau nay neu Gemini hoac survey data assign persona chi tiet hon, van co the giu hien o day."}
                  </p>
                </SettingCard>

                <SettingCard title={isEnglish ? "Add object" : "Them do vat"}>
                  <div className="grid gap-3">
                    <Field label={isEnglish ? "Object name" : "Ten do vat"}>
                      <input
                        value={documentName}
                        onChange={(event) => setDocumentName(event.target.value)}
                        className="vault-input w-full rounded-[0.95rem] border-white/15 px-4 py-3"
                      />
                    </Field>
                    <Field label={isEnglish ? "Personality / info" : "Tinh cach / ghi chu"}>
                      <input
                        value={documentInfo}
                        onChange={(event) => setDocumentInfo(event.target.value)}
                        className="vault-input w-full rounded-[0.95rem] border-white/15 px-4 py-3"
                      />
                    </Field>
                    <Field label={isEnglish ? "Details" : "Chi tiet"}>
                      <textarea
                        value={documentValue}
                        onChange={(event) => setDocumentValue(event.target.value)}
                        rows={4}
                        className="vault-input w-full rounded-[0.95rem] border-white/15 px-4 py-3"
                      />
                    </Field>
                    <button
                      type="button"
                      onClick={() => {
                        if (!documentName.trim()) return;

                        setDocuments((current) => [
                          ...current,
                          {
                            id: createId("document"),
                            name: documentName.trim(),
                            info: documentInfo.trim() || undefined,
                            value: documentValue.trim(),
                            createdAt: Date.now(),
                          },
                        ]);
                        setDocumentName("");
                        setDocumentInfo("");
                        setDocumentValue("");
                      }}
                      className="w-fit rounded-[0.95rem] border-[2px] border-white bg-white px-4 py-3 text-sm font-black text-black transition hover:bg-transparent hover:text-white"
                    >
                      {isEnglish ? "Add object" : "Them do vat"}
                    </button>
                  </div>
                </SettingCard>

                <SettingCard title={isEnglish ? "Object list" : "Danh sach do vat"}>
                  <div className="space-y-3">
                    {documents.length === 0 ? (
                      <p className="text-sm font-medium text-white/55">
                        {isEnglish
                          ? "No custom objects yet."
                          : "Chua co do vat tuy chinh."}
                      </p>
                    ) : null}
                    {documents.map((document) => (
                      <article
                        key={document.id}
                        className="rounded-[1rem] bg-[#313131] p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-base font-black uppercase tracking-[0.04em]">
                              {document.name}
                            </h3>
                            {document.info ? (
                              <p className="mt-2 text-sm font-semibold text-white/72">
                                {document.info}
                              </p>
                            ) : null}
                            {document.value ? (
                              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-white/58">
                                {document.value}
                              </p>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setDocuments((current) =>
                                current.filter((item) => item.id !== document.id),
                              )
                            }
                            className="rounded-[0.8rem] border-[2px] border-white/70 px-3 py-2 text-xs font-black uppercase transition hover:bg-white hover:text-black"
                          >
                            {isEnglish ? "Delete" : "Xoa"}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </SettingCard>
              </div>
            </div>
          ) : null}

          {activeSection === "prompts" ? (
            <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
              <SettingCard title={isEnglish ? "Prompt library" : "Thu vien prompt"}>
                <div className="mb-4 rounded-[1rem] bg-[#313131] p-4 text-sm leading-7 text-white/62">
                  <p className="font-black uppercase tracking-[0.06em] text-white">
                    {isEnglish ? "What this section does" : "Section nay dung de lam gi"}
                  </p>
                  <p className="mt-2">
                    {isEnglish
                      ? "Prompt library is the set of reusable instruction snippets you can inject into the chat input. It is useful for quick actions like summarize, translate, explain, or list. These are user-side helper prompts, not the hidden system prompt sent to Gemini."
                      : "Prompt library la bo instruction snippet co the chen nhanh vao input chat. No hop cho cac tac vu nhu tom tat, dich, giai thich, liet ke. Day la prompt helper phia user, khong phai hidden system prompt gui sang Gemini."}
                  </p>
                </div>
                <div className="space-y-3">
                  {sessionPrompts.map((prompt) => (
                    <article
                      key={prompt.id}
                      className="rounded-[1rem] bg-[#313131] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-black uppercase tracking-[0.04em]">
                            {prompt.title}
                          </h3>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-white/62">
                            {prompt.content}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPromptId(prompt.id);
                              setPromptTitle(prompt.title);
                              setPromptContent(prompt.content);
                            }}
                            className="rounded-[0.8rem] border-[2px] border-white px-3 py-2 text-xs font-black uppercase transition hover:bg-white hover:text-black"
                          >
                            {isEnglish ? "Edit" : "Sua"}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSessionPrompts((current) =>
                                current.filter((item) => item.id !== prompt.id),
                              )
                            }
                            className="rounded-[0.8rem] border-[2px] border-white/70 px-3 py-2 text-xs font-black uppercase transition hover:bg-white hover:text-black"
                          >
                            {isEnglish ? "Delete" : "Xoa"}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </SettingCard>

              <div className="grid gap-4">
                <SettingCard title={isEnglish ? "Gemini conversation prompt" : "Prompt Gemini cho hoi thoai"}>
                  <div className="grid gap-3">
                    <p className="text-sm leading-7 text-white/62">
                      {isEnglish
                        ? "This prompt is appended to the chat generation request sent to Gemini. Use it to steer tone, structure, humor level, meanness, pacing, or episode format."
                        : "Prompt nay duoc noi vao request generate hoi thoai gui sang Gemini. Ban dung no de dieu chinh tone, structure, do hai, muc do ca khia, nhip do, hoac format episode."}
                    </p>
                    <textarea
                      value={adminSettings.conversationPromptTemplate}
                      onChange={(event) =>
                        setAdminSettings((current) => ({
                          ...current,
                          conversationPromptTemplate: event.target.value,
                        }))
                      }
                      rows={8}
                      className="vault-input w-full rounded-[0.95rem] border-white/15 px-4 py-3"
                    />
                  </div>
                </SettingCard>

                <SettingCard title={editingPromptId ? (isEnglish ? "Edit prompt" : "Sua prompt") : (isEnglish ? "New prompt" : "Prompt moi")}>
                  <div className="grid gap-3">
                    <Field label={isEnglish ? "Title" : "Tieu de"}>
                      <input
                        value={promptTitle}
                        onChange={(event) => setPromptTitle(event.target.value)}
                        className="vault-input w-full rounded-[0.95rem] border-white/15 px-4 py-3"
                      />
                    </Field>

                    <Field label={isEnglish ? "Prompt content" : "Noi dung prompt"}>
                      <textarea
                        value={promptContent}
                        onChange={(event) => setPromptContent(event.target.value)}
                        rows={8}
                        className="vault-input w-full rounded-[0.95rem] border-white/15 px-4 py-3"
                      />
                    </Field>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (!promptTitle.trim() || !promptContent.trim()) return;

                          const nextPrompt = {
                            id: editingPromptId ?? createId("prompt"),
                            title: promptTitle.trim(),
                            content: promptContent.trim(),
                          };

                          setSessionPrompts((current) => {
                            const exists = current.some(
                              (item) => item.id === nextPrompt.id,
                            );

                            return exists
                              ? current.map((item) =>
                                  item.id === nextPrompt.id ? nextPrompt : item,
                                )
                              : [...current, nextPrompt];
                          });

                          resetPromptEditor();
                        }}
                        className="rounded-[0.95rem] border-[2px] border-white bg-white px-4 py-3 text-sm font-black text-black transition hover:bg-transparent hover:text-white"
                      >
                        {editingPromptId
                          ? isEnglish
                            ? "Save prompt"
                            : "Luu prompt"
                          : isEnglish
                            ? "Add prompt"
                            : "Them prompt"}
                      </button>

                      {editingPromptId ? (
                        <button
                          type="button"
                          onClick={resetPromptEditor}
                          className="rounded-[0.95rem] border-[2px] border-white px-4 py-3 text-sm font-black transition hover:bg-white hover:text-black"
                        >
                          {isEnglish ? "Cancel" : "Huy"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </SettingCard>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function SectionTab({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[0.95rem] border-[2px] px-5 py-3 text-sm font-black transition ${
        active
          ? "border-white bg-white text-black"
          : "border-white/90 text-white hover:bg-white hover:text-black"
      }`}
    >
      {label}
    </button>
  );
}

function SettingCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[1.25rem] bg-[#2d2d2d] p-4 sm:p-5 ${className ?? ""}`}
    >
      <p className="mb-4 text-sm font-black uppercase tracking-[0.08em] text-white">
        {title}
      </p>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-white/72">{label}</span>
      {children}
    </label>
  );
}

function TogglePill({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`rounded-[0.95rem] border-[2px] px-4 py-3 text-left text-sm font-black transition ${
        checked
          ? "border-white bg-white text-black"
          : "border-white/20 bg-[#3a3a3a] text-white hover:bg-white hover:text-black"
      }`}
    >
      {label}
    </button>
  );
}

function StatusPill({ label }: { label: string }) {
  return (
    <span className="rounded-[0.85rem] bg-[#3a3a3a] px-3 py-2 text-xs font-black uppercase tracking-[0.08em]">
      {label}
    </span>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-[0.75rem] bg-[#3a3a3a] px-3 py-2 text-[11px] font-black uppercase tracking-[0.08em] text-white/78">
      {label} {Math.round(value)}
    </span>
  );
}
