import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = "llama-3.3-70b-versatile"; // Updated from decommissioned llama3-8b-8192

// Core function — all features call this
export async function askAI(prompt: string): Promise<any> {
  const res = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a personal finance assistant. Always respond with valid JSON only. No explanation, no markdown, just raw JSON.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.3, // low = more consistent JSON output
    max_tokens: 1024,
  });

  const raw = res.choices[0].message.content ?? "{}";

  // Strip accidental markdown code fences if model adds them
  const cleaned = raw.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    console.error("AI returned non-JSON:", raw);
    throw new Error("AI response was not valid JSON");
  }
}  
