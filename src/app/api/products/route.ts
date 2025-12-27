import { NextResponse } from 'next/server';
import { CATEGORIES } from '@/lib/categories';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// Configuration
const RAPIDAPI_HOST = 'real-time-amazon-data.p.rapidapi.com';
const DB_CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours (Used to determine "Staleness" for re-fetching)

// Helper: Fetch from RapidAPI
async function fetchFromRapidAPI(query: string, categoryId: string): Promise<any[] | null> {
    const key = process.env.RAPIDAPI_KEY;

    if (!key) {
        console.error('RAPIDAPI_KEY is not defined');
        return null;
    }

    // Fetch 2 pages for variety
    const products: any[] = [];

    for (const page of [1, 2]) {
        const url = `https://${RAPIDAPI_HOST}/search?query=${encodeURIComponent(query)}&page=${page}&country=US&sort_by=RELEVANCE&product_condition=NEW`;
        console.log(`Fetching from RapidAPI [${categoryId}] page ${page}: ${url}`);

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'x-rapidapi-key': key,
                    'x-rapidapi-host': RAPIDAPI_HOST,
                },
            });

            if (!response.ok) {
                console.error(`RapidAPI Error on page ${page}: ${response.status}`);
                continue;
            }

            const data = await response.json();
            const rawProducts = data?.data?.products;

            if (Array.isArray(rawProducts)) {
                rawProducts.forEach((item: any) => {
                    const priceStr = item.product_price || '$0';
                    const price = parseFloat(priceStr.replace(/[^0-9.]/g, ''));

                    products.push({
                        id: item.asin,
                        title: item.product_title,
                        price: isNaN(price) ? 0 : price,
                        currency: 'USD',
                        imageUrl: item.product_photo,
                        link: item.product_url,
                        category: categoryId,
                        isBestSeller: item.is_best_seller || false,
                        rating: parseFloat(item.product_star_rating || '0'),
                        reviews: item.product_num_ratings || 0
                    });
                });
            }
        } catch (error) {
            console.error(`RapidAPI Fetch Failed for page ${page}:`, error);
        }
    }

    return products.length > 0 ? products : null;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const minPrice = parseFloat(searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '10000');
    const minReviews = parseInt(searchParams.get('minReviews') || '0');
    const minRating = parseFloat(searchParams.get('minRating') || '0');
    const maxRating = parseFloat(searchParams.get('maxRating') || '5');

    // 1. Load User Preferences
    let userPreferences: Record<string, number> = {};
    const session = await getServerSession(authOptions);

    if (session?.user?.id) {
        try {
            const dbScores = await prisma.categoryScore.findMany({
                where: { userId: session.user.id }
            });
            dbScores.forEach((s: any) => {
                userPreferences[s.category] = s.score;
            });
        } catch (e) {
            console.error("Failed to fetch preferences from DB", e);
        }
    } else {
        try {
            const prefParam = searchParams.get('preferences');
            if (prefParam) {
                userPreferences = JSON.parse(prefParam);
            }
        } catch (e) {
            console.warn("Failed to parse preferences", e);
        }
    }

    // 2. CHECK & UPDATE CATALOG (The "Smart Bootstrap" Logic)
    const now = new Date();
    const shuffledCategories = [...CATEGORIES].sort(() => Math.random() - 0.5);
    let updatesInThisRequest = 0;

    for (const cat of shuffledCategories) {
        // Count items in DB for this category
        // If we have plenty (> 50), we consider it "Fresh enough" to avoid API calls
        // This effectively implements the "Fetch Once" logic since the table persists forever
        try {
            const count = await prisma.product.count({
                where: { category: cat.id }
            });

            // "Stale" if very few items (e.g. First time setup) 
            // OR if we wanted to enforce a time-based refresh, we could check updatedAt, 
            // but for now, simple count is safer for quota.
            const isStale = count < 50;

            if (isStale) {
                const randomQuery = cat.queries[Math.floor(Math.random() * cat.queries.length)];
                console.log(`Refreshing Catalog: ${cat.label} (Count: ${count})`);

                const newProducts = await fetchFromRapidAPI(randomQuery, cat.id);

                if (newProducts && newProducts.length > 0) {
                    // Upsert to Postgres
                    // createMany with skipDuplicates is the most efficient way to "Seed"
                    await prisma.product.createMany({
                        data: newProducts,
                        skipDuplicates: true,
                    });

                    updatesInThisRequest++;

                    // Limit updates per request to save quota
                    // If we have >= 3 populated categories in DB, stop fetching
                    const populatedCategories = await prisma.product.groupBy({
                        by: ['category'],
                    });

                    if (populatedCategories.length >= 3 && updatesInThisRequest >= 3) {
                        break;
                    }
                    if (updatesInThisRequest >= 3) {
                        break;
                    }
                }
            }
        } catch (e) {
            console.error("DB Catalog check failed", e);
        }
    }

    // 3. QUERY CATALOG
    // We fetch ALL candidates matching filters from the DB. 
    // PostgreSQL handles the filtering efficiently.
    let allProducts: any[] = [];
    try {
        allProducts = await prisma.product.findMany({
            where: {
                price: { gte: minPrice, lte: maxPrice },
                reviews: { gte: minReviews },
                rating: { gte: minRating, lte: maxRating }
            },
            take: 500 // Fetch a large candidate pool for the Spread Sort
        });
    } catch (e) {
        console.error("Failed to query catalog", e);
        return NextResponse.json({ error: 'Database Error' }, { status: 500 });
    }

    if (allProducts.length === 0) {
        return NextResponse.json({ error: 'No products available' }, { status: 404 });
    }

    // 4. WEIGHTED SCORING (In-Memory)
    const scoredProducts = allProducts.map(p => {
        const rawWeight = userPreferences[p.category] !== undefined ? userPreferences[p.category] : 1.0;
        const effectiveWeight = Math.log(rawWeight + Math.E);
        const score = effectiveWeight * (Math.random() + 0.5);
        return { product: p, score };
    });

    // Sort by score descending (Candidates List)
    scoredProducts.sort((a, b) => b.score - a.score);

    // 5. SPREAD SORT (Smart Interleaving)
    const finalProducts: any[] = [];
    let pool = [...scoredProducts];
    let lastCategory: string | null = null;

    while (pool.length > 0) {
        let selectedIndex = -1;
        const lookahead = Math.min(pool.length, 20); // Deep lookahead

        for (let i = 0; i < lookahead; i++) {
            if (pool[i].product.category !== lastCategory) {
                selectedIndex = i;
                break;
            }
        }

        if (selectedIndex === -1) selectedIndex = 0;

        const selected = pool[selectedIndex];
        finalProducts.push(selected.product);
        lastCategory = selected.product.category;

        pool.splice(selectedIndex, 1);
    }

    return NextResponse.json(finalProducts);
}
