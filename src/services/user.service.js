const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

const createUser = async (userData) => {
    const { name, email, password } = userData;

    // Hash password (previously handled by Mongoose pre-save hook)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    return await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword
        }
    });
};

const findUserByEmail = async (email, includePassword = false) => {
    // If includePassword is false, we just return the user (default behavior)
    // If true, we still get it because Prisma includes all fields by default unless select is used
    return await prisma.user.findUnique({
        where: { email }
    });
};

const findUserById = async (id) => {
    return await prisma.user.findUnique({
        where: { id }
    });
};

const updateUser = async (id, updateData) => {
    return await prisma.user.update({
        where: { id },
        data: updateData
    });
};

module.exports = {
    createUser,
    findUserByEmail,
    findUserById,
    updateUser
};
