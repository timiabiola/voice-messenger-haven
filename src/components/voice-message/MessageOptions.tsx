
import { AlertTriangle, Lock } from 'lucide-react';

interface MessageOptionsProps {
  subject: string;
  onSubjectChange: (value: string) => void;
  isUrgent: boolean;
  onUrgentChange: (value: boolean) => void;
  isPrivate: boolean;
  onPrivateChange: (value: boolean) => void;
  isProcessing: boolean;
}

export const MessageOptions = ({
  subject,
  onSubjectChange,
  isUrgent,
  onUrgentChange,
  isPrivate,
  onPrivateChange,
  isProcessing
}: MessageOptionsProps) => {
  return (
    <>
      <div className="space-y-2 max-w-2xl mx-auto">
        <label className="text-sm text-gray-600">Subject:</label>
        <input 
          type="text"
          placeholder="Add a subject..."
          className="w-full p-2 bg-white rounded-lg border focus:border-blue-500 outline-none"
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          disabled={isProcessing}
        />
      </div>

      <div className="flex flex-wrap gap-4 justify-center max-w-2xl mx-auto">
        <button 
          className={`flex items-center space-x-2 p-2 rounded-lg ${
            isUrgent ? 'bg-red-100 text-red-600' : 'bg-white text-gray-600'
          }`}
          onClick={() => onUrgentChange(!isUrgent)}
          disabled={isProcessing}
        >
          <AlertTriangle className="w-5 h-5" />
          <span>Urgent</span>
        </button>
        <button 
          className={`flex items-center space-x-2 p-2 rounded-lg ${
            isPrivate ? 'bg-blue-100 text-blue-600' : 'bg-white text-gray-600'
          }`}
          onClick={() => onPrivateChange(!isPrivate)}
          disabled={isProcessing}
        >
          <Lock className="w-5 h-5" />
          <span>Private</span>
        </button>
      </div>
    </>
  );
};
