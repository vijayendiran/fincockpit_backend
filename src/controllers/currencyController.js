const currencyService = require('../services/currency.service');

const getCurrencyRates = async (req, res, next) => {
    try {
        const { base = 'INR' } = req.query;

        if (!currencyService.SUPPORTED_CURRENCIES.includes(base)) {
            return res.status(400).json({ error: `Unsupported base currency: ${base}` });
        }

        const rates = await currencyService.getRates(base);
        res.status(200).json({
            status: 'success',
            data: {
                base,
                rates,
                currencies: currencyService.SUPPORTED_CURRENCIES
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCurrencyRates
};
