
import { GoogleGenAI, Type } from "@google/genai";
import { UserSelection } from "../types";

// Note: GoogleGenAI is instantiated inside functions to ensure the latest API key from the environment is used.

// Connection Test Utility
export const testConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "ping",
    });
    return { success: !!response.text, message: "Connection stable. Jazz frequencies are clear." };
  } catch (error: any) {
    console.error("Connection test failed:", error);
    return { success: false, message: error.message || "Failed to establish connection." };
  }
};

// 1. Smart Title Generator
export const generateTitles = async (selection: UserSelection): Promise<string[]> => {
  if (!selection.destination || !selection.view || !selection.mood) throw new Error("Incomplete selection");

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    You are a jazz channel copywriter for a "Ticketless Travel" concept app.
    Context:
    - Destination: ${selection.destination.label}
    - View: ${selection.view.label}
    - Mood: ${selection.mood.label}

    Task:
    Generate 3 distinct, emotional, and clickable playlist titles (max 25 characters each).
    Rules:
    - One title MUST include the tag "[Ticketless Travel]".
    - One title MUST include the tag "[Focus BGM]".
    - The third can be creative.
    - Return ONLY the titles in JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            titles: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["titles"],
        },
      },
    });

    const json = JSON.parse(response.text || '{"titles": []}');
    return json.titles;
  } catch (error) {
    console.error("Error generating titles:", error);
    return [`${selection.destination.label} Vibes`, "Ticketless Jazz [Focus BGM]", "Midnight Session"];
  }
};

// 2. Jazz Tone Analyzer
export const generateColorPalette = async (mood: string): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Analyze the jazz genre: "${mood}".
    Suggest a color palette of 3 colors (Hex codes) for cover art.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            colors: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["colors"],
        },
      },
    });
    const json = JSON.parse(response.text || '{"colors": []}');
    return json.colors;
  } catch (error) {
    return ["#1e293b", "#3b82f6", "#f59e0b"];
  }
};

// 3. Thumbnail Generator (Upgraded to Gemini 3 Pro Image)
export const generateThumbnail = async (selection: UserSelection, colors: string[]): Promise<{ url: string, prompt: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const aspectRatio = selection.aspectRatio || "1:1";
  
  const optimizedPrompt = `A high-quality, cinematic jazz playlist cover. Scene: A ${selection.view.label} in ${selection.destination.label}. Musical Mood: ${selection.mood.label} jazz. Aesthetic: Moody, atmospheric, professional photography, lighting inspired by colors ${colors.join(', ')}. No text, no logos.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: optimizedPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
          imageSize: "1K"
        }
      },
    });

    let imageUrl = '';
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) throw new Error("No image data in response");
    
    return {
      url: imageUrl,
      prompt: optimizedPrompt
    };
  } catch (error) {
    console.error("Pro Image generation failed:", error);
    throw error;
  }
};
