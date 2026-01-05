
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('--- START DEBUG ---');
    try {
        const superAdmin = await prisma.user.findUnique({
            where: { email: 'superadmin@sms.com' },
        });

        if (superAdmin) {
            console.log(`User found: ${superAdmin.email}`);
            console.log(`isActive: ${superAdmin.isActive}`);
            console.log(`deletedAt: ${superAdmin.deletedAt}`);
            const isValid = await bcrypt.compare('admin123', superAdmin.password);
            console.log(`PASSWORD CHECK: ${isValid ? 'VALID' : 'INVALID'}`);
        } else {
            console.log('User superadmin@sms.com NOT FOUND');
        }

        const schoolAdmin = await prisma.user.findUnique({
            where: { email: 'admin@demoschool.edu' },
        });

        if (schoolAdmin) {
            console.log(`User found: ${schoolAdmin.email}`);
            const isValid = await bcrypt.compare('admin123', schoolAdmin.password);
            console.log(`PASSWORD CHECK: ${isValid ? 'VALID' : 'INVALID'}`);
        } else {
            console.log('User admin@demoschool.edu NOT FOUND');
        }

    } catch (e) {
        console.error('ERROR:', e);
    }
    console.log('--- END DEBUG ---');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
