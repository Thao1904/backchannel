"use client";

import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { defaultContent } from "@/lib/content-defaults";
import { generateChatByMode } from "@/lib/generation/providers";
import { defaultManualRatings, sampleParticipant } from "@/lib/seed-data";
import type { AppState } from "@/types/app-state";
import type {
  DeviceInput,
  DeviceType,
  EditableContent,
  GenerationMode,
  ParticipantMode,
} from "@/types/backchannel";

const STORAGE_KEY = "backchannel-state";

function buildInitialState(): AppState {
  const sampleRatings = Object.fromEntries(
    sampleParticipant.map((item) => [item.deviceType, item]),
  ) as AppState["ratings"];

  return {
    participantMode: "sample",
    generationMode: "rules",
    selectedDevices: sampleParticipant.map((item) => item.deviceType),
    ratings: {
      ...sampleRatings,
      ...defaultManualRatings,
    },
    content: defaultContent,
    generation: null,
  };
}

type BackchannelContextValue = {
  state: AppState;
  setParticipantMode: (mode: ParticipantMode) => void;
  setGenerationMode: (mode: GenerationMode) => void;
  toggleDevice: (device: DeviceType) => void;
  updateRating: (device: DeviceType, patch: Partial<DeviceInput>) => void;
  resetToSample: () => void;
  updateContent: (patch: Partial<EditableContent>) => void;
  runGeneration: () => Promise<void>;
  restart: () => void;
  activeInputs: DeviceInput[];
};

const BackchannelContext = createContext<BackchannelContextValue | null>(null);

export function BackchannelProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(buildInitialState);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<AppState>;
      const fallback = buildInitialState();
      setState({
        ...fallback,
        ...parsed,
        ratings: {
          ...fallback.ratings,
          ...(parsed.ratings ?? {}),
        },
        content: {
          ...fallback.content,
          ...(parsed.content ?? {}),
        },
      });
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const activeInputs = useMemo(() => {
    return state.selectedDevices
      .map((device) => state.ratings[device])
      .filter((item): item is DeviceInput => Boolean(item));
  }, [state.ratings, state.selectedDevices]);

  const setParticipantMode = useCallback((mode: ParticipantMode) => {
    setState((current) => ({
      ...current,
      participantMode: mode,
      generation: null,
      selectedDevices:
        mode === "sample"
          ? sampleParticipant.map((item) => item.deviceType)
          : current.selectedDevices,
    }));
  }, []);

  const setGenerationMode = useCallback((mode: GenerationMode) => {
    setState((current) => ({ ...current, generationMode: mode, generation: null }));
  }, []);

  const toggleDevice = useCallback((device: DeviceType) => {
    setState((current) => {
      const hasDevice = current.selectedDevices.includes(device);
      const nextSelected = hasDevice
        ? current.selectedDevices.filter((item) => item !== device)
        : [...current.selectedDevices, device];

      if (nextSelected.length > 6) {
        return current;
      }

      return {
        ...current,
        generation: null,
        selectedDevices: nextSelected,
      };
    });
  }, []);

  const updateRating = useCallback((device: DeviceType, patch: Partial<DeviceInput>) => {
    setState((current) => {
      const existing = current.ratings[device] ?? {
        deviceType: device,
        likeScore: 3,
        frequency: "sometimes",
        lovePercent: 50,
        hateRank: 1,
        dependenceScore: 3,
      };

      return {
        ...current,
        generation: null,
        ratings: {
          ...current.ratings,
          [device]: {
            ...existing,
            ...patch,
          },
        },
      };
    });
  }, []);

  const resetToSample = useCallback(() => {
    setState((current) => ({
      ...current,
      participantMode: "sample",
      selectedDevices: sampleParticipant.map((item) => item.deviceType),
      generation: null,
    }));
  }, []);

  const updateContent = useCallback((patch: Partial<EditableContent>) => {
    setState((current) => ({
      ...current,
      content: {
        ...current.content,
        ...patch,
      },
    }));
  }, []);

  const restart = useCallback(() => {
    setState(buildInitialState());
  }, []);

  const runGeneration = useCallback(async () => {
    if (activeInputs.length === 0) {
      setState((current) => ({
        ...current,
        generation: null,
      }));
      return;
    }

    const result = await generateChatByMode(activeInputs, state.generationMode);
    setState((current) => ({
      ...current,
      generation: result,
    }));
  }, [activeInputs, state.generationMode]);

  const value = useMemo<BackchannelContextValue>(
    () => ({
      state,
      activeInputs,
      setParticipantMode,
      setGenerationMode,
      toggleDevice,
      updateRating,
      resetToSample,
      updateContent,
      runGeneration,
      restart,
    }),
    [
      activeInputs,
      resetToSample,
      restart,
      runGeneration,
      setGenerationMode,
      setParticipantMode,
      state,
      toggleDevice,
      updateContent,
      updateRating,
    ],
  );

  return (
    <BackchannelContext.Provider value={value}>
      {children}
    </BackchannelContext.Provider>
  );
}

export function useBackchannel() {
  const context = useContext(BackchannelContext);

  if (!context) {
    throw new Error("useBackchannel must be used within BackchannelProvider");
  }

  return context;
}
