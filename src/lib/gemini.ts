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
    contents: `You are a script director for Meta Ads (Facebook/Instagram/TikTok) specializing in the Algerian market. 
    Analyze this script which is written in ALGERIAN DARIJA (or Arabic for Algerians).
    
    Structure the analysis for an advertisement:
    1. Hook (The first 3 seconds to grab attention).
    2. Problem/Empathy (Touching the customer's pain point).
    3. Solution/Value (Presenting the product/service).
    4. Call to Action (The final push).

    Provide vocal directions in English for the TTS engine to achieve a NATURAL ALGERIAN accent and an ADVERTISING tone. 
    Avoid robotic or formal Arabic sounds. Use "conversational", "excited but natural", "trustworthy friend" vibes.
    
    Return ONLY a JSON array of objects:
    [
      { "text": "...", "emotion": "engaging hook", "direction": "energetic, natural Algerian accent, punchy" },
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
    return Array.isArray(parsed) ? parsed : [{ text: script, emotion: "natural", direction: "conversational Algerian" }];
  } catch (e) {
    console.error("Failed to parse script analysis", e);
    return [{ text: script, emotion: "natural", direction: "conversational Algerian" }];
  }
}

export async function generateEmotionalAudio(
  segments: ScriptSegment[],
  voice: "male" | "female"
): Promise<string> {
  const voiceName = voice === "female" ? "Kore" : "Charon";

  // Specialized prompt for Algerian Ad delivery
  const fullPrompt = `Task: Professional Meta Ad Voiceover in Algerian Darija.
  Tone: Authentic, Modern, and Persuasive. 
  Accent: Algerian (Natural/Local).
  
  Guidelines:
  - Speak like a real Algerian person in a viral ad, NOT a news reporter.
  - Follow the segment-specific directions provided.
  - Ensure the "Hook" segments are very engaging.
  
  Script Segments (JSON-informed delivery):
  ${segments.map(s => `[Niche: ${s.emotion}, Style: ${s.direction}] Text: ${s.text}`).join("\n")}`;

  console.log("Generating Algerian Ad Audio...");

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
