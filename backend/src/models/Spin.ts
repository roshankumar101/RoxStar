import { Schema, model } from 'mongoose';

const spinSchema = new Schema({
  roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  startedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['WAITING', 'RUNNING', 'COMPLETED', 'ABORTED'], default: 'WAITING', index: true },
  winnerId: { type: Schema.Types.ObjectId, ref: 'User' },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
}, { timestamps: true });

spinSchema.index({ roomId: 1 }, { unique: true, partialFilterExpression: { status: { $in: ['WAITING', 'RUNNING'] } } });

export const Spin = model('Spin', spinSchema);
