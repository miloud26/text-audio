import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ScriptSegment {
  text: string;
  emotion: string;
  direction: string;
}

export async function analyzeScript(script: string): Promise<ScriptSegment[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are an expert script analyzer for advertisements. 
    Analyze the following script and break it down into meaningful segments.
    Identify the emotion (sadness, pain, empathy, hope, solution, etc.) and give specific vocal directions for each segment to achieve a cinematic and emotional effect.
    
    Return ONLY a JSON array of objects like this:
    [
      { "text": "...", "emotion": "painful", "direction": "whisper with deep breath" },
      ...
    ]

    Script:
    ${script}`,
    config: {
      responseMimeType: "application/json",
    },
  });

  try {
    const text = response.text || "[]";
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [{ text: script, emotion: "neutral", direction: "read clearly" }];
  } catch (e) {
    console.error("Failed to parse script analysis", e);
    return [{ text: script, emotion: "neutral", direction: "read clearly" }];
  }
}

export async function generateEmotionalAudio(
  segments: ScriptSegment[],
  voice: "male" | "female"
): Promise<string> {
  // Voice mapping: 
  // Female: Kore (soft), Puck (youthful)
  // Male: Charon (deep), Fenrir (strong), Zephyr (airy)
  const voiceName = voice === "female" ? "Kore" : "Charon";

  // Construct a prompt for the TTS model that includes directions
  const fullPrompt = segments.map(s => `Say with ${s.emotion} emotion and ${s.direction} direction: ${s.text}`).join("\n");

  console.log("Generating audio for prompt:", fullPrompt);

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-tts-preview",
    contents: [{ parts: [{ text: fullPrompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    console.error("No audio data in response", response);
    throw new Error("Audio generation failed - no data received");
  }
  
  return base64Audio;
}
