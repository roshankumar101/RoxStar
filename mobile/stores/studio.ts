import { PermissionsAndroid, Platform } from "react-native";
import { create } from "zustand";

import {
  createDraft,
  deleteDraft as removeDraft,
  getDrafts,
} from "@/services/draftService";
import { audioService } from "@/services/audioService";
import type { Draft, DraftEffect } from "@/types/draft";

type RecordingMode = "native" | "visual";

type StudioState = {
  recording: boolean;
  recordingBusy: boolean;
  recordingCompleted: boolean;
  recordingMode: RecordingMode;
  recordingStartedAt: number | null;
  elapsedMs: number;
  drafts: Draft[];
  loading: boolean;
  error: string | null;
  recordingUri: string | null;
  loadDrafts: () => Promise<void>;
  start: () => Promise<void>;
  stop: (durationMs?: number) => Promise<void>;
  cancel: () => Promise<void>;
  saveDraft: (name: string, effect: DraftEffect) => Promise<boolean>;
  deleteDraft: (id: string) => Promise<void>;
};

async function ensureMicrophonePermission(): Promise<boolean> {
  if (Platform.OS !== "android") return true;
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

const recordingMode: RecordingMode =
  audioService.getRecordingState() === "unavailable" ? "visual" : "native";

export const useStudioStore = create<StudioState>((set, get) => ({
  recording: false,
  recordingBusy: false,
  recordingCompleted: false,
  recordingMode,
  recordingStartedAt: null,
  elapsedMs: 0,
  drafts: [],
  loading: false,
  error: null,
  recordingUri: null,
  loadDrafts: async () => {
    set({ loading: true, error: null });
    try {
      set({ drafts: (await getDrafts()).drafts, loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Unable to load drafts",
      });
    }
  },
  start: async () => {
    if (get().recording || get().recordingBusy) return;
    set({ recordingBusy: true, error: null });
    try {
      if (get().recordingMode === "visual") {
        set({
          recording: true,
          recordingBusy: false,
          recordingCompleted: false,
          recordingStartedAt: Date.now(),
          elapsedMs: 0,
          recordingUri: null,
        });
        return;
      }
      if (!(await ensureMicrophonePermission())) {
        set({ recordingBusy: false, error: "Microphone permission denied" });
        return;
      }
      await audioService.startRecording();
      set({
        recording: true,
        recordingBusy: false,
        recordingCompleted: false,
        recordingStartedAt: Date.now(),
        elapsedMs: 0,
        recordingUri: null,
        error: null,
      });
    } catch (error) {
      set({
        recordingBusy: false,
        error:
          error instanceof Error ? error.message : "Unable to start recording",
      });
    }
  },
  stop: async (durationMs) => {
    const state = get();
    if (!state.recording || state.recordingBusy) return;
    const measuredDuration =
      durationMs ??
      (state.recordingStartedAt
        ? Date.now() - state.recordingStartedAt
        : state.elapsedMs);
    set({ recordingBusy: true });
    if (state.recordingMode === "visual") {
      set({
        recording: false,
        recordingBusy: false,
        recordingCompleted: true,
        recordingStartedAt: null,
        elapsedMs: Math.max(measuredDuration, 0),
        recordingUri: null,
        error: null,
      });
      return;
    }
    try {
      const recordingUri = await audioService.stopRecording();
      set({
        recording: false,
        recordingBusy: false,
        recordingCompleted: true,
        recordingStartedAt: null,
        elapsedMs: Math.max(measuredDuration, 0),
        recordingUri,
        error: null,
      });
    } catch (error) {
      set({
        recording: false,
        recordingBusy: false,
        recordingCompleted: false,
        recordingStartedAt: null,
        elapsedMs: Math.max(measuredDuration, 0),
        recordingUri: null,
        error:
          error instanceof Error ? error.message : "Unable to stop recording",
      });
    }
  },
  cancel: async () => {
    try {
      if (get().recordingMode === "native") {
        await audioService.cancelRecording();
      }
      set({
        recording: false,
        recordingBusy: false,
        recordingCompleted: false,
        recordingStartedAt: null,
        elapsedMs: 0,
        recordingUri: null,
        error: null,
      });
    } catch (error) {
      set({
        recording: false,
        recordingBusy: false,
        recordingCompleted: false,
        recordingStartedAt: null,
        elapsedMs: 0,
        recordingUri: null,
        error:
          error instanceof Error
            ? error.message
            : "Unable to cancel recording",
      });
    }
  },
  saveDraft: async (name, effect) => {
    const trimmedName = name.trim();
    const duration = get().elapsedMs;
    const fileUrl = get().recordingUri;
    if (!trimmedName) {
      set({ error: "Enter a name for this draft" });
      return false;
    }
    if (!get().recordingCompleted) {
      set({ error: "Record and stop audio before saving a draft" });
      return false;
    }
    if (get().recordingMode === "native" && !fileUrl) {
      set({ error: "The recorded WAV file is unavailable" });
      return false;
    }
    set({ loading: true, error: null });
    try {
      const response = await createDraft({
        name: trimmedName,
        duration,
        effect,
        ...(fileUrl ? { fileUrl } : {}),
      });
      set((state) => ({
        drafts: [response.draft, ...state.drafts],
        loading: false,
        recordingCompleted: false,
        recordingStartedAt: null,
        elapsedMs: 0,
        recordingUri: null,
      }));
      return true;
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Unable to save draft",
      });
      return false;
    }
  },
  deleteDraft: async (id) => {
    try {
      await removeDraft(id);
      set((state) => ({
        drafts: state.drafts.filter((draft) => draft._id !== id),
      }));
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Unable to delete draft",
      });
    }
  },
}));
