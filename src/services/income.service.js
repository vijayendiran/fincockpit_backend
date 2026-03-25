const prisma = require('../config/prisma');

const getAllIncomes = async (userId) => {
    return await prisma.income.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        include: {
            category: true
        }
    });
};

const getIncomeById = async (id, userId) => {
    return await prisma.income.findFirst({
        where: { id, userId },
        include: {
            category: true
        }
    });
};

const createIncome = async (userId, data) => {
    return await prisma.income.create({
        data: {
            ...data,
            userId
        }
    });
};

const updateIncome = async (id, userId, data) => {
    return await prisma.income.update({
        where: { id, userId },
        data
    });
};

const deleteIncome = async (id, userId) => {
    return await prisma.income.delete({
        where: { id, userId }
    });
};

module.exports = {
    getAllIncomes,
    getIncomeById,
    createIncome,
    updateIncome,
    deleteIncome
};
