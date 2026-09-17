import { Schema, model } from 'mongoose';

const roomSchema = new Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status: { type: String, enum: ['WAITING', 'ACTIVE', 'COMPLETED'], default: 'WAITING', index: true },
}, { timestamps: true });

export const Room = model('Room', roomSchema);
