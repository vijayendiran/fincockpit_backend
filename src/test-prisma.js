const prisma = require('./config/prisma');

async function main() {
    try {
        const users = await prisma.user.findMany({ take: 1 });
        console.log('✅ Prisma connected successfully!');
        console.log('Found users:', users.length);
    } catch (error) {
        console.error('❌ Prisma connection failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
