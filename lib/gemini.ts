import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function generateAIOutput(prompt: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    config: {
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.HIGH,
      },
    },
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
  });

  return response.text;
}
