export type SpinStatus = "WAITING" | "RUNNING" | "COMPLETED" | "ABORTED";
export type SpinParticipantStatus = "ACTIVE" | "ELIMINATED" | "WINNER";

export type Spin = {
  _id: string;
  roomId: string;
  startedBy: string;
  status: SpinStatus;
  winnerId?: string;
  startedAt: string;
  completedAt?: string;
};

export type SpinParticipant = {
  _id: string;
  spinId: string;
  userId: string | { _id: string; name: string; avatar?: string };
  status: SpinParticipantStatus;
  eliminationOrder?: number;
};
