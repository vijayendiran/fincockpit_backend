const prisma = require("../config/prisma");

const FRANKFURTER_URL = "https://api.frankfurter.app";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const SUPPORTED_CURRENCIES = [
  "INR", "USD", "EUR", "GBP", "JPY", "AED", "SGD", "AUD", "CAD"
];

// Main function — always call this, never fetch directly
async function getRates(base = "INR") {
  try {
    // 1. Check MongoDB cache first
    const cached = await prisma.exchangeRate.findUnique({ where: { base } });

    const isFresh =
      cached &&
      (Date.now() - new Date(cached.fetchedAt).getTime() < CACHE_TTL_MS);

    if (isFresh) {
      return cached.rates;
    }

    // 2. Cache is stale or missing — fetch fresh rates
    const res = await fetch(`${FRANKFURTER_URL}/latest?from=${base}`);
    if (!res.ok) throw new Error(`Frankfurter API error: ${res.status}`);

    const data = await res.json();
    const rates = data.rates || {};

    // Always include the base currency itself as 1
    rates[base] = 1;

    // 3. Upsert into MongoDB cache
    const updatedRate = await prisma.exchangeRate.upsert({
      where: { base },
      update: { rates, fetchedAt: new Date() },
      create: { base, rates },
    });

    return updatedRate.rates;
  } catch (err) {
    console.error("Currency update failed, checking for stale cache:", err.message);
    
    // 4. If API fails, return stale cache rather than crashing
    try {
      const cached = await prisma.exchangeRate.findUnique({ where: { base } });
      if (cached) {
        console.warn("Frankfurter API failed, using stale cache");
        return cached.rates;
      }
    } catch (dbErr) {
      console.error("Failed to query stale cache:", dbErr.message);
    }
    // 5. If everything fails, return 1:1 format to prevent crashing frontend
    console.warn(`Falling back to 1:1 dummy exchange for ${base}`);
    return { [base]: 1 };
  }
}

// Convert an amount from one currency to another
function convertAmount(
  amount,
  fromCurrency,
  toCurrency,
  rates
) {
  if (fromCurrency === toCurrency) return amount;

  // Rates are all relative to the base (INR by default)
  // To convert: amount ÷ rates[from] × rates[to]
  const inBase = amount / (rates[fromCurrency] || 1);
  const converted = inBase * (rates[toCurrency] || 1);

  return Math.round(converted * 100) / 100; // round to 2 decimal places
}

module.exports = {
  getRates,
  convertAmount,
  SUPPORTED_CURRENCIES
};
