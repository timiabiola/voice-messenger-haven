
export async function requestMicrophonePermissions(): Promise<MediaStream> {
  try {
    // First check if permissions are already granted
    const permissions = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    
    if (permissions.state === 'denied') {
      throw new Error('Microphone access is blocked. Please enable it in your device settings.');
    }

    // Request microphone access
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100,
      } 
    });

    return stream;
  } catch (error) {
    console.error('Error requesting microphone permissions:', error);
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        throw new Error('Please grant microphone permissions in your device settings to record audio.');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No microphone found. Please ensure your device has a working microphone.');
      }
    }
    throw error;
  }
}
