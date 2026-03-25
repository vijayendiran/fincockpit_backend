const prisma = require('../config/prisma');

const getSummary = async (userId, startDate, endDate) => {
    const dateFilter = {};
    if (startDate || endDate) {
        dateFilter.date = {};
        if (startDate) dateFilter.date.gte = new Date(startDate);
        if (endDate) dateFilter.date.lte = new Date(endDate);
    }

    const incomes = await prisma.income.findMany({
        where: { userId, ...dateFilter }
    });

    const expenses = await prisma.expense.findMany({
        where: { userId, ...dateFilter }
    });

    const activeSubscriptions = await prisma.subscription.findMany({
        where: { userId, status: 'active' }
    });

    return {
        incomes,
        expenses,
        activeSubscriptions
    };
};

const getExpensesByCategory = async (userId, startDate, endDate) => {
    const dateFilter = {};
    if (startDate || endDate) {
        dateFilter.date = {};
        if (startDate) dateFilter.date.gte = new Date(startDate);
        if (endDate) dateFilter.date.lte = new Date(endDate);
    }

    // Prisma doesn't support complex aggregations like Mongo's $lookup directly in groupBy
    // So we fetch and then group, or use findMany with includes
    const expenses = await prisma.expense.findMany({
        where: {
            userId,
            ...dateFilter
        },
        include: {
            category: true
        }
    });

    // Manual grouping (can be replaced by raw queries if performance is an issue)
    const grouped = expenses.reduce((acc, exp) => {
        const catId = exp.categoryId;
        if (!acc[catId]) {
            acc[catId] = {
                _id: catId,
                categoryName: exp.category.name,
                categoryIcon: exp.category.icon,
                total: 0,
                count: 0
            };
        }
        acc[catId].total += exp.amount;
        acc[catId].count += 1;
        return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => b.total - a.total);
};

const getMonthlyTrend = async (userId, year) => {
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    const startDate = new Date(targetYear, 0, 1);
    const endDate = new Date(targetYear, 11, 31, 23, 59, 59);

    // Grouping by month is tricky in Prisma without raw queries for different DBs
    // For MongoDB, we'll fetch and group in JS or use raw
    const incomes = await prisma.income.findMany({
        where: {
            userId,
            date: { gte: startDate, lte: endDate }
        }
    });

    const expenses = await prisma.expense.findMany({
        where: {
            userId,
            date: { gte: startDate, lte: endDate }
        }
    });

    const groupData = (data) => {
        return data.reduce((acc, item) => {
            const month = new Date(item.date).getMonth() + 1;
            acc[month] = (acc[month] || 0) + item.amount;
            return acc;
        }, {});
    };

    return {
        monthlyIncome: groupData(incomes),
        monthlyExpenses: groupData(expenses)
    };
};

module.exports = {
    getSummary,
    getExpensesByCategory,
    getMonthlyTrend
};
