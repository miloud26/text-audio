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
    contents: `You are an expert speech director for professional advertisements. 
    Analyze the following script for a NATURAL, HUMAN delivery. 
    Break it down into segments and identify the SUBTLE underlying tone (e.g., thoughtful, authentic, reassuring, clear).
    Avoid extreme or exaggerated emotions. Focus on how a real professional narrator would speak.
    
    Return ONLY a JSON array of objects:
    [
      { "text": "...", "emotion": "thoughtful", "direction": "warm, steady pace, natural pauses" },
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
    return Array.isArray(parsed) ? parsed : [{ text: script, emotion: "natural", direction: "conversational and clear" }];
  } catch (e) {
    console.error("Failed to parse script analysis", e);
    return [{ text: script, emotion: "natural", direction: "conversational and clear" }];
  }
}

export async function generateEmotionalAudio(
  segments: ScriptSegment[],
  voice: "male" | "female"
): Promise<string> {
  // Female: Kore (balanced), Puck (expressive)
  // Male: Charon (steady), Fenrir (vibrant)
  const voiceName = voice === "female" ? "Kore" : "Charon";

  // Refined prompt for more natural flow
  const fullPrompt = `Speak the following script in a completely natural, human, and conversational way. 
  Do NOT over-act or exaggerate the emotions. Use a professional narration style with subtle emphasis where appropriate.
  Ensure smooth transitions between parts.
  
  Script details:
  ${segments.map(s => `[Tone: ${s.emotion}, Style: ${s.direction}] ${s.text}`).join("\n")}`;

  console.log("Generating natural audio for prompt:", fullPrompt);

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
