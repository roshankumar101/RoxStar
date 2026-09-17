import { apiRequest } from "./apiService";
import type { Draft, DraftEffect } from "@/types/draft";

export function createDraft(input: {
  name: string;
  duration: number;
  effect?: DraftEffect;
  fileUrl?: string;
}): Promise<{ draft: Draft }> {
  return apiRequest("/drafts", { method: "POST", body: JSON.stringify(input) });
}

export function getDrafts(): Promise<{ drafts: Draft[] }> {
  return apiRequest("/drafts");
}
export function deleteDraft(draftId: string): Promise<{ ok: true }> {
  return apiRequest(`/drafts/${draftId}`, { method: "DELETE" });
}
export function updateDraft(
  draftId: string,
  input: Partial<Pick<Draft, "name" | "duration" | "effect" | "fileUrl">>,
): Promise<{ draft: Draft }> {
  return apiRequest(`/drafts/${draftId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function shareDraft(
  roomId: string,
  input: {
    draftId?: string;
    name: string;
    duration: number;
    effect?: DraftEffect;
    fileUrl?: string;
  },
): Promise<{ draft: Draft }> {
  return apiRequest(`/rooms/${roomId}/drafts`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
