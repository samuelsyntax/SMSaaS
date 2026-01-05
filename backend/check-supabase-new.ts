
import { PrismaClient } from '@prisma/client';

// Attempting to use the local password 'Samuelsun' with the NEW host
const url = 'postgresql://postgres.nxhvsnkhrydmohzcytgz:Samuelsun@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url,
        },
    },
});

async function main() {
    console.log('Testing connection to Supabase (New Host)...');
    try {
        await prisma.$connect();
        console.log('✅ Connection successful!');
    } catch (e: any) {
        console.log('❌ Connection failed.');
        if (e.message.includes('authentication failed')) {
            console.log('Reason: Authentication failed (Password incorrect)');
        } else {
            console.log('Reason:', e.message.split('\n')[0]);
            console.log(e.message);
        }
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
