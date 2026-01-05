import { NextResponse } from 'next/server';
import { CATEGORIES } from '@/lib/categories';
import { prisma } from "@/lib/prisma";

// Reusing the fetch logic (could clear this up by extracting to a lib later)
const CANOPY_API_HOST = 'rest.canopyapi.co';

async function fetchFromCanopyAPI(query: string, categoryId: string): Promise<any[] | null> {
    const key = process.env.CANOPY_API_KEY;
    if (!key) return null;

    // Fetch just 1 page for speed during bulk refresh
    const products: any[] = [];
    // Random page 1-3 to get variety
    const page = Math.floor(Math.random() * 3) + 1;
    const url = `https://${CANOPY_API_HOST}/api/amazon/search?searchTerm=${encodeURIComponent(query)}&page=${page}&domain=US`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'API-KEY': key,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error(`CanopyAPI Error: ${response.status}`);
            return null;
        }

        const data = await response.json();
        const rawProducts = data?.data?.amazonProductSearchResults?.productResults?.results;

        if (Array.isArray(rawProducts)) {
            rawProducts.forEach((item: any) => {
                const price = item.price?.value || 0;
                products.push({
                    id: item.asin,
                    title: item.title,
                    price: price,
                    currency: 'USD',
                    imageUrl: item.mainImageUrl,
                    link: item.url,
                    category: categoryId,
                    isBestSeller: item.isBestSeller || false,
                    rating: item.rating || 0,
                    reviews: item.ratingsTotal || 0
                });
            });
        }
    } catch (error) {
        console.error(`CanopyAPI Fetch Failed:`, error);
    }
    return products.length > 0 ? products : null;
}

export async function GET(request: Request) {
    // Basic protection - could be improved
    // const { searchParams } = new URL(request.url);
    // if (searchParams.get('key') !== process.env.ADMIN_KEY) ...

    try {
        console.log("Starting full catalog refresh...");

        // 1. Clear existing products
        console.log("Clearing Product table...");
        await prisma.product.deleteMany({});

        let totalImported = 0;

        // 2. Refresh each category
        for (const cat of CATEGORIES) {
            // Pick a random query
            const randomQuery = cat.queries[Math.floor(Math.random() * cat.queries.length)];
            console.log(`Refreshing [${cat.label}] with query: "${randomQuery}"`);

            const newProducts = await fetchFromCanopyAPI(randomQuery, cat.id);

            if (newProducts && newProducts.length > 0) {
                await prisma.product.createMany({
                    data: newProducts,
                    skipDuplicates: true,
                });
                totalImported += newProducts.length;
                console.log(`  -> Imported ${newProducts.length} items.`);
            } else {
                console.log(`  -> No items found.`);
            }

            // Brief pause to be nice to API
            await new Promise(r => setTimeout(r, 500));
        }

        return NextResponse.json({
            success: true,
            message: `Catalog refreshed. Cleared old data and imported ${totalImported} new items.`
        });

    } catch (error) {
        console.error("Refresh failed", error);
        return NextResponse.json({ error: 'Refresh Failed', details: String(error) }, { status: 500 });
    }
}
