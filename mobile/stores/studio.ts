import { PermissionsAndroid, Platform } from "react-native";
import { create } from "zustand";

import {
  createDraft,
  deleteDraft as removeDraft,
  getDrafts,
} from "@/services/draftService";
import { audioService } from "@/services/audioService";
import type { Draft, DraftEffect } from "@/types/draft";

type StudioState = {
  recording: boolean;
  elapsedMs: number;
  drafts: Draft[];
  loading: boolean;
  error: string | null;
  recordingPath: string | null;
  loadDrafts: () => Promise<void>;
  start: () => Promise<void>;
  stop: (durationMs?: number) => Promise<void>;
  cancel: () => Promise<void>;
  saveDraft: (name: string, effect: DraftEffect) => Promise<void>;
  deleteDraft: (id: string) => Promise<void>;
};

async function ensureMicrophonePermission(): Promise<boolean> {
  if (Platform.OS !== "android") return true;
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

export const useStudioStore = create<StudioState>((set, get) => ({
  recording: false,
  elapsedMs: 0,
  drafts: [],
  loading: false,
  error: null,
  recordingPath: null,
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
    if (!(await ensureMicrophonePermission())) {
      set({ error: "Microphone permission denied" });
      return;
    }
    try {
      const path = await audioService.startRecording();
      set({ recording: true, elapsedMs: 0, recordingPath: path, error: null });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Unable to start recording",
      });
    }
  },
  stop: async (durationMs) => {
    try {
      await audioService.stopRecording();
      set({
        recording: false,
        elapsedMs: Math.max(durationMs ?? get().elapsedMs, 1000),
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Unable to stop recording",
      });
    }
  },
  cancel: async () => {
    await audioService.cancelRecording();
    set({ recording: false, elapsedMs: 0, recordingPath: null });
  },
  saveDraft: async (name, effect) => {
    const duration = get().elapsedMs;
    set({ loading: true, error: null });
    try {
      const response = await createDraft({ name, duration, effect });
      set((state) => ({
        drafts: [response.draft, ...state.drafts],
        loading: false,
        elapsedMs: 0,
        recordingPath: null,
      }));
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Unable to save draft",
      });
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
