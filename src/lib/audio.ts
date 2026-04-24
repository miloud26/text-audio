/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Helper to play Gemini TTS Audio
export async function playTTSAudio(base64Data: string) {
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const audioBuffer = await audioContext.decodeAudioData(bytes.buffer);
  
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start();
  
  return { audioContext, source };
}
