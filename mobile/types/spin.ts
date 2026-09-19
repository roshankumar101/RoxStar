export type SpinStatus = "WAITING" | "RUNNING" | "COMPLETED" | "ABORTED";
export type SpinParticipantStatus =
  | "ACTIVE"
  | "ELIMINATED"
  | "WINNER"
  | "WITHDRAWN";

export type Spin = {
  _id: string;
  roomId: string;
  startedBy: string;
  status: SpinStatus;
  winnerId?: string;
  round?: number;
  nextEliminationAt?: string;
  startedAt: string;
  completedAt?: string;
};

export type SpinParticipant = {
  _id: string;
  spinId: string;
  userId: string | { _id: string; name: string; avatar?: string };
  status: SpinParticipantStatus;
  eliminatedAt?: string;
  withdrawnAt?: string;
  eliminationOrder?: number;
};
