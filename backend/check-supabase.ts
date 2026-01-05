
import { PrismaClient } from '@prisma/client';

// Attempting to use the local password 'Samuelsun'
const url = 'postgresql://postgres:Samuelsun@db.nxhvsnkhrydmohzcytgz.supabase.co:5432/postgres';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url,
        },
    },
});

async function main() {
    console.log('Testing connection to Supabase...');
    try {
        await prisma.$connect();
        console.log('✅ Connection successful!');
    } catch (e: any) {
        console.log('❌ Connection failed.');
        // Only log necessary error info to avoid noise
        if (e.message.includes('authentication failed')) {
            console.log('Reason: Authentication failed (Password incorrect)');
        } else {
            console.log('Reason:', e.message.split('\n')[0]);
        }
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
