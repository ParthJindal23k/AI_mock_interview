/**
 * Groq API model wrapper.
 * Uses Groq's OpenAI-compatible REST API with llama-3.3-70b-versatile.
 * Groq provides generous free tier with very fast inference.
 * 
 * Requires GROQ_API_KEY in .env
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL_NAME = "llama-3.3-70b-versatile";

export const model = {
  async invoke(input: string): Promise<{ content: string }> {
    let lastError: any;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(GROQ_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: MODEL_NAME,
            messages: [
              {
                role: "user",
                content: input,
              },
            ],
            temperature: 0.4,
            max_tokens: 2048,
          }),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`Groq API error ${response.status}: ${errorBody}`);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content ?? "";
        return { content: text };
      } catch (error: any) {
        lastError = error;
        console.warn(`Groq attempt ${attempt}/3 failed:`, error.message);

        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
        }
      }
    }

    throw lastError;
  },
};
