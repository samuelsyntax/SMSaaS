import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor() {
        super({
            log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        });
    }

    async onModuleInit() {
        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }

    /**
     * Soft delete extension - finds records excluding soft-deleted ones
     */
    excludeDeleted<T extends { deletedAt: Date | null }>(data: T[]): T[] {
        return data.filter((item) => item.deletedAt === null);
    }

    /**
     * Generate a unique ID with prefix (e.g., STU-2024-0001)
     */
    generatePrefixedId(prefix: string, sequence: number, year?: number): string {
        const currentYear = year || new Date().getFullYear();
        const paddedSequence = sequence.toString().padStart(4, '0');
        return `${prefix}-${currentYear}-${paddedSequence}`;
    }
}
