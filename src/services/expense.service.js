const prisma = require('../config/prisma');

const getAllExpenses = async (userId) => {
    return await prisma.expense.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        include: {
            category: true
        }
    });
};

const getExpenseById = async (id, userId) => {
    return await prisma.expense.findFirst({
        where: { id, userId },
        include: {
            category: true
        }
    });
};

const createExpense = async (userId, data) => {
    return await prisma.expense.create({
        data: {
            ...data,
            userId
        }
    });
};

const updateExpense = async (id, userId, data) => {
    return await prisma.expense.update({
        where: { id, userId },
        data
    });
};

const deleteExpense = async (id, userId) => {
    return await prisma.expense.delete({
        where: { id, userId }
    });
};

module.exports = {
    getAllExpenses,
    getExpenseById,
    createExpense,
    updateExpense,
    deleteExpense
};
