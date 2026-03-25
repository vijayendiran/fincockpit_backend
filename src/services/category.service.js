const prisma = require('../config/prisma');

const getAllCategories = async (userId) => {
    return await prisma.category.findMany({
        where: { userId }
    });
};

const getCategoryById = async (id, userId) => {
    return await prisma.category.findFirst({
        where: { id, userId }
    });
};

const createCategory = async (userId, data) => {
    return await prisma.category.create({
        data: {
            ...data,
            userId
        }
    });
};

const updateCategory = async (id, userId, data) => {
    return await prisma.category.update({
        where: { id, userId },
        data
    });
};

const deleteCategory = async (id, userId) => {
    return await prisma.category.delete({
        where: { id, userId }
    });
};

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};
