# Skip Buttons Debug Notes

## Current Issue
Skip forward/backward buttons are not working on desktop despite multiple fix attempts.

## What We've Tried (That Didn't Work)

### 1. Added pointer-events-none to child elements
- **Theory**: SVG icons and text were intercepting clicks
- **Implementation**: Added `pointer-events-none` class to icons and text spans
- **Result**: Didn't fix the issue - buttons still don't skip

### 2. Exposed audioBlob and updated source elements
- **Theory**: Audio wasn't loading because source elements had no blob URL
- **Implementation**: 
  - Exposed `audioBlob` from useAudioPlayback hook
  - Updated all `<source>` elements to use `audioBlob || message.audio_url`
- **Result**: Still not working - skip buttons don't function

### 3. Made skip functions load audio if not loaded
- **Theory**: Audio needs to be loaded before currentTime can be manipulated
- **Implementation**:
  - Modified handleSkipBackward/Forward to check if audioBlob exists
  - If not, calls loadAudio() before attempting skip
  - Added readyState checks
- **Result**: Still not working

## Key Observations

1. **Audio Loading Issue**: 
   - We removed `audioRef.current.src = blobUrl` to fix playback
   - But this means audio element might not have a proper source
   - Source elements update but browser might not reload audio

2. **Timing Issues**:
   - loadAudio() is async but might not wait for audio to be fully ready
   - readyState checks might pass but audio still not seekable

3. **Mobile vs Desktop**:
   - User reports it works on mobile but not desktop
   - Could be browser-specific behavior differences

## What We Know
- Skip functions ARE being called (no click interception issues)
- audioRef.current exists
- But setting currentTime has no effect

## Next Steps to Investigate

1. **Check if audio.load() is actually being called after source update**
   - Currently only called in loadAudio()
   - Might need to call after source elements change

2. **Verify audio element state**:
   - Check duration value
   - Check if audio is actually seekable
   - Log readyState values

3. **Test direct src assignment**:
   - Instead of using source elements
   - Set audioRef.current.src = audioBlob directly
   - This worked before but broke format selection

4. **Browser Console Debugging**:
   - Add console logs to track:
     - When loadAudio is called
     - audioBlob value
     - readyState before/after skip
     - duration value
     - currentTime before/after setting

## Potential Root Causes

1. **Source elements don't trigger reload**: Changing source element src attributes doesn't automatically reload audio
2. **Blob URL timing**: Blob might be created but audio element doesn't pick it up
3. **Seekable ranges**: Audio might be loaded but not seekable
4. **Duration not available**: Skip forward checks duration > 0 but it might be NaN/undefined

## Code Context

- File: `src/components/messages/hooks/useAudioPlayback.ts`
- Skip functions: `handleSkipBackward` and `handleSkipForward`
- Audio loading: `loadAudio` function
- Component: `src/components/messages/MessageCard.tsx`