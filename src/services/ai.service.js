const Groq = require("groq-sdk");
const dotenv = require("dotenv");
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = "llama-3.3-70b-versatile"; // free, fast model

/**
 * Core function — all features call this
 * @param {string} prompt 
 * @returns {Promise<any>}
 */
async function askAI(prompt) {
  try {
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

    const raw = res.choices[0].message.content || "{}";

    // Strip accidental markdown code fences if model adds them
    const cleaned = raw.replace(/```json|```/g, "").trim();

    return JSON.parse(cleaned);
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error("AI returned non-JSON:", error.message);
      throw new Error("AI response was not valid JSON");
    }
    console.error("Groq AI Error:", error);
    throw new Error("Failed to get response from Groq AI");
  }
}

module.exports = {
  askAI,
};
