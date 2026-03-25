const { askAI } = require('./ai.service');

/**
 * Parses natural language text into a structured expense object.
 * @param {string} text - The natural language description (e.g., "Lunch for 200 today")
 * @returns {Promise<Object>} - The structured JSON representation of the expense.
 */
async function parseExpenseText(text) {
  const today = new Date().toISOString().split('T')[0];

  const prompt = `
    Today's date is ${today}.
    Parse this expense description into structured data:
    "${text}"

    Return JSON in this exact format:
    {
      "title": "Lunch with team",
      "amount": 450,
      "category": "Food",
      "date": "2026-03-18",
      "description": "Optional extra detail"
    }

    Category must be one of: Food, Travel, Entertainment, Shopping, Healthcare, Education, Utilities, Subscriptions, Other.
    Date must be YYYY-MM-DD format. If day is unclear, use today.
    Amount must be a number, no currency symbols.
    No explanation, just raw JSON.
  `;

  return await askAI(prompt);
}

module.exports = { parseExpenseText };
