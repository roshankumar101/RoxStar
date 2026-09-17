import { apiRequest } from "./apiService";
import type { Room, RoomState } from "@/types/room";

export function createRoom(name: string): Promise<{ room: Room }> {
  return apiRequest("/rooms", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}
export function joinRoom(
  code: string,
): Promise<{ room: Room; state: RoomState }> {
  return apiRequest(`/rooms/${encodeURIComponent(code)}/join`, {
    method: "POST",
  });
}
export function leaveRoom(roomId: string): Promise<{ ok: true }> {
  return apiRequest(`/rooms/${roomId}/leave`, { method: "POST" });
}
export function getRoom(roomId: string): Promise<RoomState> {
  return apiRequest(`/rooms/${roomId}`);
}
