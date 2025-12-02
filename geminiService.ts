/**
 * Sends an image and a prompt to the serverless function which calls Gemini.
 */
export const generateEditedImage = async (
  prompt: string,
  imageBase64: string,
  mimeType: string,
): Promise<{ text: string | null; imageUrl: string | null }> => {
  try {
    const res = await fetch("/.netlify/functions/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, imageBase64, mimeType }),
    });

    const data = await res.json();

    return {
      text: data.text || null,
      imageUrl: data.imageUrl || null,
    };
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
      if (typeof reader.result === "string") {
        const base64String = reader.result.split(",")[1]; // remove prefix
        resolve(base64String);
      } else {
        reject(new Error("Failed to convert file to base64"));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Helper to extract Base64 data from a Data URL
 */
export const extractBase64FromDataUrl = (dataUrl: string): string => {
  return dataUrl.split(",")[1];
};
