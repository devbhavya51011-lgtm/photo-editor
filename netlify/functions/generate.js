import fetch from "node-fetch"; // only if using Node 18+ Netlify runtime

export async function handler(event) {
  try {
    // Parse request body safely
    let body = {};
    try {
      body = JSON.parse(event.body || "{}");
    } catch (err) {
      console.error("Failed to parse event body:", err);
      return { statusCode: 400, body: "Invalid JSON input" };
    }

    const { prompt, imageBase64, mimeType } = body;

    if (!prompt || !imageBase64 || !mimeType) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Missing prompt, imageBase64, or mimeType",
        }),
      };
    }

    // Call Google Gemini API
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta2/models/gemini-2.5-flash-image:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GOOGLE_API_KEY}`,
        },
        body: JSON.stringify({
          contents: [
            { inlineData: { data: imageBase64, mimeType } },
            { text: prompt },
          ],
        }),
      },
    );

    // Check if API returned OK
    if (!response.ok) {
      const text = await response.text();
      console.error("Google API returned error:", response.status, text);
      return { statusCode: response.status, body: text };
    }

    // Parse response safely
    let data;
    try {
      data = await response.json();
    } catch (err) {
      console.error("Failed to parse JSON from Google API:", err);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Invalid JSON from AI API" }),
      };
    }

    // Extract result text and image
    let resultText = null;
    let resultImageUrl = null;

    if (data?.candidates?.[0]?.content?.parts?.length > 0) {
      for (const part of data.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          resultImageUrl = `data:image/png;base64,${part.inlineData.data}`;
        }
        if (part.text) {
          resultText = part.text;
        }
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ text: resultText, imageUrl: resultImageUrl }),
    };
  } catch (err) {
    console.error("Function error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Unknown error" }),
    };
  }
}
