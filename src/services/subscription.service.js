const prisma = require('../config/prisma');

const calculateNextBillingDate = (startDate, billingCycle) => {
    const start = new Date(startDate || Date.now());
    const nextDate = new Date(start);

    if (billingCycle === 'weekly') {
        nextDate.setDate(nextDate.getDate() + 7);
    } else if (billingCycle === 'monthly') {
        nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (billingCycle === 'yearly') {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
    }

    return nextDate;
};

const getAllSubscriptions = async (userId) => {
    return await prisma.subscription.findMany({
        where: { userId },
        include: {
            category: true
        }
    });
};

const getSubscriptionById = async (id, userId) => {
    return await prisma.subscription.findFirst({
        where: { id, userId },
        include: {
            category: true
        }
    });
};

const createSubscription = async (userId, data) => {
    const nextBillingDate = calculateNextBillingDate(data.startDate, data.billingCycle);

    // Format data for Prisma
    const formattedData = {
        ...data,
        userId,
        nextBillingDate,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        categoryId: data.categoryId && data.categoryId !== "" ? data.categoryId : null
    };

    return await prisma.subscription.create({
        data: formattedData
    });
};

const updateSubscription = async (id, userId, data) => {
    // If billing cycle or start date changes, recalculate next billing date
    let updateData = { ...data };
    // Recalculate next billing date if needed
    if (data.startDate || data.billingCycle) {
        const current = await prisma.subscription.findFirst({ where: { id, userId } });
        const startDate = data.startDate ? new Date(data.startDate) : current.startDate;
        const billingCycle = data.billingCycle || current.billingCycle;
        updateData.nextBillingDate = calculateNextBillingDate(startDate, billingCycle);
    }

    // Ensure types are correct for Prisma
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.categoryId === "") updateData.categoryId = null;

    return await prisma.subscription.update({
        where: { id, userId },
        data: updateData
    });
};

const deleteSubscription = async (id, userId) => {
    return await prisma.subscription.delete({
        where: { id, userId }
    });
};

module.exports = {
    getAllSubscriptions,
    getSubscriptionById,
    createSubscription,
    updateSubscription,
    deleteSubscription
};
