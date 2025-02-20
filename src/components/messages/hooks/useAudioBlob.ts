
import { useState, useEffect } from 'react';

export const useAudioBlob = () => {
  const [audioBlob, setAudioBlob] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (audioBlob) {
        URL.revokeObjectURL(audioBlob);
      }
    };
  }, [audioBlob]);

  const createBlob = async (response: Response) => {
    const blob = await response.blob();
    if (audioBlob) {
      URL.revokeObjectURL(audioBlob);
    }
    const blobUrl = URL.createObjectURL(blob);
    setAudioBlob(blobUrl);
    return blobUrl;
  };

  const clearBlob = () => {
    if (audioBlob) {
      URL.revokeObjectURL(audioBlob);
      setAudioBlob(null);
    }
  };

  return { audioBlob, createBlob, clearBlob };
};
