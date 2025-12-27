import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- Checking Product Table ---');

        // 1. Total Count
        const count = await prisma.product.count();
        console.log(`Total Products in DB: ${count}`);

        // 2. Breakdown by Category
        const byCategory = await prisma.product.groupBy({
            by: ['category'],
            _count: {
                id: true,
            },
        });

        console.log('\n--- Breakdown by Category ---');
        if (byCategory.length === 0) {
            console.log('No categories found.');
        } else {
            byCategory.forEach(c => {
                console.log(`${c.category}: ${c._count.id} products`);
            });
        }

        // 3. Sample Product
        if (count > 0) {
            const sample = await prisma.product.findFirst();
            console.log('\n--- Sample Product ---');
            console.log(JSON.stringify(sample, null, 2));
        }

    } catch (e) {
        console.error('Error querying DB:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
