
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { TileType, GenerateContentResponseWithGrounding } from '../types';
import { GEMINI_MODEL_NAME } from '../constants';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not found. Gemini API features will be disabled.");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export const generateFlavorText = async (tileType: TileType, tileName?: string): Promise<string> => {
  if (!ai) {
    return "The air hums with an unknown energy, but the details are lost to static. (Gemini API key not configured)";
  }

  const locationName = tileName || tileType;
  const prompt = `Generate a short, evocative description (1-2 sentences, max 30 words) for a location in a post-apocalyptic sci-fi board game called 'Starfall Dominion'. The location is '${locationName}'. It's part of a coastal area dominated by a giant crashed starship and overgrown ruins. The tone should be mysterious and hint at past events or current conditions.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        // thinkingConfig: { thinkingBudget: 0 } // Optional: For faster, potentially less nuanced responses
      }
    });
    
    return response.text.trim() || `A strange silence hangs over the ${locationName}.`;
  } catch (error) {
    console.error("Error generating flavor text:", error);
    return `The ${locationName} is shrouded in mystery, its secrets currently obscured by interference. (API Error)`;
  }
};

export const generateStoryForGame = async (): Promise<GenerateContentResponseWithGrounding> => {
  if (!ai) {
    return { text: "The story of Starfall Dominion remains untold... (Gemini API key not configured)" };
  }
  
  const prompt = "Tell me a short origin story for the world of 'Starfall Dominion'. It's a coastal region with a giant crashed alien starship, now overgrown and contested by factions. Mention the 'Starfall Event'. Use Google Search for any recent relevant sci-fi tropes or themes if you like, but focus on originality.";

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}], // Enable Google Search grounding
        temperature: 0.8,
      }
    });
    // Cast to include potential groundingMetadata
    const responseWithGrounding = response as unknown as GenerateContentResponseWithGrounding;
    return responseWithGrounding;

  } catch (error) {
    console.error("Error generating game story:", error);
    if (error instanceof Error && error.message.includes("application/json") && error.message.includes("googleSearch")) {
        return { text: "Error: The model configuration for story generation with Google Search is incorrect. JSON output is not compatible with grounding. (API Error)" };
    }
    return { text: "The legends of Starfall Dominion are currently lost to the digital ether. (API Error)" };
  }
};
