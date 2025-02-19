
import { Mic, Trash2, Play, Pause } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface RecordingControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  isProcessing: boolean;
  recordingTime: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
}

export const RecordingControls = ({
  isRecording,
  isPaused,
  isProcessing,
  recordingTime,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording
}: RecordingControlsProps) => {
  const isMobile = useIsMobile();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full flex flex-col items-center justify-center text-center space-y-6">
      <div className={`${isMobile ? 'w-48 h-48' : 'w-64 h-64'} rounded-full bg-blue-50 flex items-center justify-center`}>
        <div className={`${isMobile ? 'w-32 h-32' : 'w-44 h-44'} rounded-full bg-blue-100 flex items-center justify-center ${
          isRecording && !isPaused ? 'animate-pulse' : ''
        }`}>
          <Mic className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} ${
            isRecording ? 'text-red-500' : 'text-blue-500'
          }`} />
        </div>
      </div>

      <div className="text-3xl font-medium text-gray-700">
        {formatTime(recordingTime)}
      </div>

      <div className="flex items-center justify-center space-x-6">
        {!isRecording ? (
          <button 
            className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors`}
            onClick={onStartRecording}
            disabled={isProcessing}
          >
            <Mic className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`} />
          </button>
        ) : (
          <>
            <button 
              className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-700 transition-colors`}
              onClick={onStopRecording}
              disabled={isProcessing}
            >
              <Trash2 className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} />
            </button>
            <button 
              className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors`}
              onClick={isPaused ? onResumeRecording : onPauseRecording}
              disabled={isProcessing}
            >
              {isPaused ? (
                <Play className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`} />
              ) : (
                <Pause className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`} />
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
