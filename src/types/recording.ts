
export type RecordingStatus = 'in_progress' | 'paused' | 'completed';

export type AudioChunk = {
  data: string;
  type: string;
  size: number;
};

export type RecordingState = {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  isProcessing: boolean;
};
