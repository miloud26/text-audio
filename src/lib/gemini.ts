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
    contents: `Analyze this advertisement script and break it down into emotional segments. 
    Focus on detecting sadness, pain, empathy, and the transition to a solution.
    Return only valid JSON as an array of objects: { text: string, emotion: string, direction: string }.
    
    Script:
    ${script}`,
    config: {
      responseMimeType: "application/json",
    },
  });

  try {
    return JSON.parse(response.text || "[]");
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
  const fullPrompt = `Convert this script to audio. Pay close attention to the emotional directions provided for each segment:
  ${segments.map(s => `[${s.direction}] ${s.text}`).join("\n")}`;

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
  if (!base64Audio) throw new Error("Audio generation failed");
  
  return base64Audio;
}
