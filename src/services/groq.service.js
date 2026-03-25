const Groq = require("groq-sdk");
const dotenv = require("dotenv");
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Get completion from Groq AI
 * @param {Array} messages - Chat messages [{role: 'user', content: '...'}]
 * @param {String} model - Groq model to use
 */
const getGroqChatCompletion = async (messages, model = "llama-3.3-70b-versatile") => {
    try {
        const response = await groq.chat.completions.create({
            model: model,
            messages: messages,
        });
        return response.choices[0].message.content;
    } catch (error) {
        console.error("Groq AI Error:", error);
        throw new Error("Failed to get response from Groq AI");
    }
};

module.exports = {
    getGroqChatCompletion,
};
