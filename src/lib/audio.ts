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
  
  try {
    // If first decode fails, try wrapping in WAV header (some browsers need it or the data might be raw PCM)
    const audioBuffer = await audioContext.decodeAudioData(bytes.buffer);
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
    return { audioContext, source };
  } catch (e) {
    console.warn("Direct decode failed, attempting raw PCM interpretation", e);
    // Fallback: Assume raw 16-bit PCM Mono 24kHz
    const pcmData = new Int16Array(bytes.buffer);
    const buffer = audioContext.createBuffer(1, pcmData.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < pcmData.length; i++) {
      channelData[i] = pcmData[i] / 32768;
    }
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start();
    return { audioContext, source };
  }
}

export function downloadAudioAsWav(base64Data: string, fileName: string = "advert_audio.wav") {
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Create a WAV header for raw PCM 16-bit mono 24000Hz
  const buffer = new ArrayBuffer(44 + bytes.length);
  const view = new DataView(buffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + bytes.length, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, 1, true);
  /* sample rate */
  view.setUint32(24, 24000, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, 24000 * 2, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, 2, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, bytes.length, true);

  // Copy audio data
  const data = new Uint8Array(buffer, 44);
  data.set(new Uint8Array(bytes.buffer));

  const blob = new Blob([buffer], { type: "audio/wav" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
