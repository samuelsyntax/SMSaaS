
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking for admin users...');
    const superAdmin = await prisma.user.findUnique({
        where: { email: 'superadmin@sms.com' },
    });
    console.log('SuperAdmin:', superAdmin ? 'FOUND' : 'NOT FOUND');

    const schoolAdmin = await prisma.user.findUnique({
        where: { email: 'admin@demoschool.edu' },
    });
    console.log('SchoolAdmin:', schoolAdmin ? 'FOUND' : 'NOT FOUND');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
