import { apiRequest } from "./apiService";
import type { Spin, SpinParticipant } from "@/types/spin";

export function startSpin(roomId: string): Promise<{ spin: Spin }> {
  return apiRequest(`/rooms/${roomId}/spin`, { method: "POST" });
}
export function getSpin(
  spinId: string,
): Promise<{ spin: Spin; participants: SpinParticipant[] }> {
  return apiRequest(`/spins/${spinId}`);
}
export function getSpinResult(spinId: string): Promise<{
  status: Spin["status"];
  winnerId?: string;
  participants: SpinParticipant[];
}> {
  return apiRequest(`/spins/${spinId}/result`);
}
