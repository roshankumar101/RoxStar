import { Schema, model } from "mongoose";

const spinEventSchema = new Schema({
  spinId: {
    type: Schema.Types.ObjectId,
    ref: "Spin",
    required: true,
    index: true,
  },
  roomId: {
    type: Schema.Types.ObjectId,
    ref: "Room",
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ["SPIN_STARTED", "USER_ELIMINATED", "WINNER_ANNOUNCED"],
    required: true,
  },
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  data: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

export const SpinEvent = model("SpinEvent", spinEventSchema);
