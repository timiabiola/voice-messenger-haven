export async function requestMicrophonePermissions(): Promise<MediaStream> {
  try {
    // console.log('=== Requesting microphone permissions ===');
    
    // First check if permissions are already granted
    const permissions = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    // console.log('Current microphone permission state:', permissions.state);
    
    if (permissions.state === 'denied') {
      throw new Error('Microphone access is blocked. Please enable it in your device settings.');
    }

    // Request microphone access
    const constraints = { 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100,
      } 
    };
    
    // console.log('Requesting getUserMedia with constraints:', constraints);
    
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    // Log stream details
    // const audioTracks = stream.getAudioTracks();
    // console.log('Got audio stream with', audioTracks.length, 'tracks');
    
    // audioTracks.forEach((track, index) => {
    //   console.log(`Audio track ${index}:`, {
    //     label: track.label,
    //     enabled: track.enabled,
    //     muted: track.muted,
    //     readyState: track.readyState,
    //     settings: track.getSettings()
    //   });
    // });

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
