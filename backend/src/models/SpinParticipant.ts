import { Schema, model } from "mongoose";

const spinParticipantSchema = new Schema({
  spinId: {
    type: Schema.Types.ObjectId,
    ref: "Spin",
    required: true,
    index: true,
  },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  status: {
    type: String,
    enum: ["ACTIVE", "ELIMINATED", "WINNER", "WITHDRAWN"],
    default: "ACTIVE",
  },
  joinedAt: { type: Date, default: Date.now },
  eliminatedAt: { type: Date },
  withdrawnAt: { type: Date },
  eliminationOrder: { type: Number },
});
spinParticipantSchema.index({ spinId: 1, userId: 1 }, { unique: true });

export const SpinParticipant = model("SpinParticipant", spinParticipantSchema);
