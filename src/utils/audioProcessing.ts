
export const combineAudioBuffers = async (
  audioContext: AudioContext,
  preambleBuffer: AudioBuffer,
  originalBuffer: AudioBuffer
): Promise<AudioBuffer> => {
  const numberOfChannels = Math.max(preambleBuffer.numberOfChannels, originalBuffer.numberOfChannels);
  const sampleRate = audioContext.sampleRate;
  const combinedLength = preambleBuffer.length + originalBuffer.length;
  const combinedBuffer = audioContext.createBuffer(numberOfChannels, combinedLength, sampleRate);

  for (let channel = 0; channel < numberOfChannels; channel++) {
    const combinedData = combinedBuffer.getChannelData(channel);
    const preambleData = preambleBuffer.getChannelData(channel % preambleBuffer.numberOfChannels);
    const originalData = originalBuffer.getChannelData(channel % originalBuffer.numberOfChannels);
    combinedData.set(preambleData, 0);
    combinedData.set(originalData, preambleBuffer.length);
  }

  return combinedBuffer;
};

export const renderAudioBuffer = async (
  buffer: AudioBuffer,
  numberOfChannels: number,
  sampleRate: number
): Promise<AudioBuffer> => {
  const offlineContext = new OfflineAudioContext(numberOfChannels, buffer.length, sampleRate);
  const source = offlineContext.createBufferSource();
  source.buffer = buffer;
  source.connect(offlineContext.destination);
  source.start();
  return offlineContext.startRendering();
};

export const recordAudioBuffer = async (renderedBuffer: AudioBuffer): Promise<Blob> => {
  const tempContext = new AudioContext();
  await tempContext.resume();

  const dest = tempContext.createMediaStreamDestination();
  const source = tempContext.createBufferSource();
  source.buffer = renderedBuffer;
  source.connect(dest);
  source.connect(tempContext.destination);

  source.start();

  // Set up MediaRecorder options for AAC in MP4
  let recorderOptions = { mimeType: 'audio/mp4;codecs=mp4a.40.2' };
  if (!MediaRecorder.isTypeSupported(recorderOptions.mimeType)) {
    recorderOptions = { mimeType: 'audio/mp4' };
    if (!MediaRecorder.isTypeSupported(recorderOptions.mimeType)) {
      console.warn('MP4/AAC not supported, falling back to WebM/Opus');
      recorderOptions = { mimeType: 'audio/webm;codecs=opus' };
    }
  }

  const recordedChunks: Blob[] = [];
  const mediaRecorder = new MediaRecorder(dest.stream, recorderOptions);

  mediaRecorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  await new Promise<void>((resolve) => {
    mediaRecorder.onstop = () => resolve();
    mediaRecorder.start();

    source.onended = () => {
      setTimeout(() => {
        mediaRecorder.stop();
      }, 100); // Add small delay to ensure all audio is captured
    };
  });

  return new Blob(recordedChunks, { type: recorderOptions.mimeType });
};
