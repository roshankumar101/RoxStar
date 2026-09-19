import * as OboeAudio from "oboe-audio";

export const audioService = {
  startRecording: OboeAudio.startRecording,
  stopRecording: OboeAudio.stopRecording,
  cancelRecording: OboeAudio.cancelRecording,
  setEffect: OboeAudio.setEffect,
  getRecordingState: OboeAudio.getRecordingState,
};
