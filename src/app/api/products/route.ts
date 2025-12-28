import { NextResponse } from 'next/server';
import { CATEGORIES } from '@/lib/categories';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// Configuration
const CANOPY_API_HOST = 'rest.canopyapi.co';
const DB_CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// Helper: Fetch from CanopyAPI
async function fetchFromCanopyAPI(query: string, categoryId: string): Promise<any[] | null> {
    const key = process.env.CANOPY_API_KEY;

    if (!key) {
        console.error('CANOPY_API_KEY is not defined');
        return null;
    }
    console.log(`Using CANOPY_API_KEY: ${key.substring(0, 4)}...`);

    // Fetch 2 pages for variety
    const products: any[] = [];

    for (const page of [1, 2]) {
        // Canopy API url structure
        const url = `https://${CANOPY_API_HOST}/api/amazon/search?searchTerm=${encodeURIComponent(query)}&page=${page}&domain=US`;
        console.log(`Fetching from CanopyAPI [${categoryId}] page ${page}: ${url}`);

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'API-KEY': key,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                console.error(`CanopyAPI Error on page ${page}: ${response.status}`);
                continue;
            }

            const data = await response.json();
            // Data path based on verified response: data.data.amazonProductSearchResults.productResults.results
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
            console.error(`CanopyAPI Fetch Failed for page ${page}:`, error);
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

    // 1.5 GET PARAMS FOR REFILL
    const refreshCatId = searchParams.get('refreshCategory');

    // 2. CHECK & UPDATE CATALOG (The "Smart Bootstrap" Logic)
    const now = new Date();
    const shuffledCategories = [...CATEGORIES].sort(() => Math.random() - 0.5);
    let updatesInThisRequest = 0;

    for (const cat of shuffledCategories) {
        try {
            const count = await prisma.product.count({
                where: { category: cat.id }
            });

            // LOGIC:
            // 1. Global Baseline: Ensure at least 50 items exist for variety
            // 2. On-Demand Refill: If frontend specifically asked for more of this category
            const isStale = count < 50;
            const forceRefresh = refreshCatId === cat.id;

            if (isStale || forceRefresh) {
                const randomQuery = cat.queries[Math.floor(Math.random() * cat.queries.length)];
                console.log(`Refreshing Catalog [${cat.label}]: BaselineCheck=${isStale}, ForceRefresh=${forceRefresh}, CurrentCount=${count}`);

                const newProducts = await fetchFromCanopyAPI(randomQuery, cat.id);

                if (newProducts && newProducts.length > 0) {
                    await prisma.product.createMany({
                        data: newProducts,
                        skipDuplicates: true,
                    });

                    updatesInThisRequest++;

                    // Limit API usage inside a single user request
                    if (updatesInThisRequest >= 2) break;
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
        // Return empty array instead of 404 object to be safe for frontend
        return NextResponse.json([]);
    }

    // 3.5 FETCH FRIEND ACTIONS (The "Vibe Match" Logic)
    // We do this efficiently by fetching all friend likes in one go and mapping them.
    let friendLikesMap: Record<string, any[]> = {};

    if (session?.user?.id) {
        try {
            // Get my friends
            const friends = await prisma.friendship.findMany({
                where: { userId: session.user.id },
                include: { friend: { select: { id: true, name: true, image: true } } }
            });
            const friendIds = friends.map(f => f.friendId);

            if (friendIds.length > 0) {
                // Get all items friends have liked that are in our candidate pool (optimization: strictly we could filter by pool IDs but finding all is usually fine)
                const friendWishlist = await prisma.wishlistItem.findMany({
                    where: { userId: { in: friendIds } },
                    include: { user: { select: { id: true, name: true, image: true } } }
                });

                // Group by Product ID
                friendWishlist.forEach(item => {
                    if (!friendLikesMap[item.productId]) {
                        friendLikesMap[item.productId] = [];
                    }
                    // Avoid duplicates if friend swipe multiple times (unlikely but good safety)
                    if (!friendLikesMap[item.productId].some(m => m.userId === item.userId)) {
                        friendLikesMap[item.productId].push({
                            userId: item.userId,
                            name: item.user.name,
                            image: item.user.image
                        });
                    }
                });
                console.log(`[VibeMatch] Found ${Object.keys(friendLikesMap).length} products with friend likes.`);
            }
        } catch (e) {
            console.error("Failed to fetch friend matches", e);
        }
    }

    // 4. WEIGHTED SCORING (In-Memory)
    const scoredProducts = allProducts.map(p => {
        const rawWeight = userPreferences[p.category] !== undefined ? userPreferences[p.category] : 1.0;
        const effectiveWeight = Math.log(rawWeight + Math.E);
        const score = effectiveWeight * (Math.random() + 0.5);

        // Attach Friend Matches
        const matches = friendLikesMap[p.id] || [];
        if (matches.length > 0) console.log(`[VibeMatch] Product ${p.id} has ${matches.length} matches.`);

        const enrichedProduct = { ...p, friendMatches: matches };

        return { product: enrichedProduct, score };
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
