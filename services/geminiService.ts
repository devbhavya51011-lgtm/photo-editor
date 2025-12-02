import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Sends an image and a prompt to the Gemini model to generate/edit content.
 * Uses 'gemini-2.5-flash-image' (Nano Banana).
 */
export const generateEditedImage = async (
  prompt: string,
  imageBase64: string,
  mimeType: string
): Promise<{ text: string | null; imageUrl: string | null }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    let resultText: string | null = null;
    let resultImageUrl: string | null = null;

    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString: string = part.inlineData.data;
          resultImageUrl = `data:image/png;base64,${base64EncodeString}`;
        } else if (part.text) {
          resultText = part.text;
        }
      }
    }

    return { text: resultText, imageUrl: resultImageUrl };
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};

/**
 * Helper to convert file to base64
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      } else {
        reject(new Error("Failed to convert file to base64"));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Helper to extract Base64 data from a Data URL (e.g. from a previous AI generation)
 */
export const extractBase64FromDataUrl = (dataUrl: string): string => {
  return dataUrl.split(',')[1];
}