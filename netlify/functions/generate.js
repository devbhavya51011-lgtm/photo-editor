export async function handler(event) {
  const body = JSON.parse(event.body || "{}");
  const prompt = body.prompt;
  const imageBase64 = body.imageBase64;
  const mimeType = body.mimeType;

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
          { inlineData: { data: imageBase64, mimeType: mimeType } },
          { text: prompt },
        ],
      }),
    },
  );

  const data = await response.json();

  let resultText = null;
  let resultImageUrl = null;

  if (
    data.candidates &&
    data.candidates[0].content &&
    data.candidates[0].content.parts
  ) {
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
}
