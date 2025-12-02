export async function handler(event) {
  try {
    const body = JSON.parse(event.body || "{}");
    const prompt = body.prompt;
    const imageBase64 = body.imageBase64;
    const mimeType = body.mimeType;

    if (!prompt || !imageBase64) {
      return { statusCode: 400, body: "Missing prompt or imageBase64" };
    }

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

    if (!response.ok) {
      const text = await response.text();
      console.error("Google API error:", response.status, text);
      return { statusCode: response.status, body: text };
    }

    let data;
    try {
      data = await response.json();
    } catch (err) {
      console.error("Failed to parse JSON from Google API:", err);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Invalid response from AI API" }),
      };
    }

    let resultText = null;
    let resultImageUrl = null;

    if (data.candidates?.[0]?.content?.parts) {
      for (const part of data.candidates[0].content.parts) {
        if (part.inlineData) {
          resultImageUrl = `data:image/png;base64,${part.inlineData.data}`;
        } else if (part.text) {
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
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
