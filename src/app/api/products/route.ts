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
    // Fetch a LARGE pool to allow the MAB simulator to work
    let allProducts: any[] = [];

    // Server-side filtering of rejected items to prevent loops
    const excludedIds: string[] = [];
    if (session?.user?.id) {
        try {
            const rejected = await prisma.rejectedItem.findMany({
                where: { userId: session.user.id },
                select: { productId: true }
            });
            rejected.forEach(r => excludedIds.push(r.productId));
        } catch (e) {
            console.error("Failed to fetch rejected items", e);
        }
    } else {
        // Guest: Parse excludeIds from params
        const excludeParam = searchParams.get('excludeIds');
        if (excludeParam) {
            excludeParam.split(',').forEach(id => excludedIds.push(id));
        }
    }

    try {
        allProducts = await prisma.product.findMany({
            where: {
                price: { gte: minPrice, lte: maxPrice },
                reviews: { gte: minReviews },
                rating: { gte: minRating, lte: maxRating },
                id: { notIn: excludedIds }
            },
            take: 250 // Large pool for simulation
        });
    } catch (e) {
        console.error("Failed to query catalog", e);
        return NextResponse.json({ error: 'Database Error' }, { status: 500 });
    }

    if (allProducts.length === 0) {
        return NextResponse.json([]);
    }

    // 3.5 FETCH FRIEND ACTIONS
    let friendLikesMap: Record<string, any[]> = {};
    if (session?.user?.id) {
        try {
            const friends = await prisma.friendship.findMany({
                where: { userId: session.user.id },
                include: { friend: { select: { id: true, name: true, image: true } } }
            });
            const friendIds = friends.map(f => f.friendId);
            if (friendIds.length > 0) {
                const friendWishlist = await prisma.wishlistItem.findMany({
                    where: { userId: { in: friendIds } },
                    include: { user: { select: { id: true, name: true, image: true } } }
                });
                friendWishlist.forEach(item => {
                    if (!friendLikesMap[item.productId]) friendLikesMap[item.productId] = [];
                    if (!friendLikesMap[item.productId].some(m => m.userId === item.userId)) {
                        friendLikesMap[item.productId].push({
                            userId: item.userId,
                            name: item.user.name,
                            image: item.user.image
                        });
                    }
                });
            }
        } catch (e) {
            console.error("Failed to fetch friend matches", e);
        }
    }

    // 4. PREPARE PREFERENCES (MAB STATS)
    let userStats: Record<string, { likes: number, dislikes: number }> = {};

    if (session?.user?.id) {
        try {
            const dbScores = await prisma.categoryScore.findMany({
                where: { userId: session.user.id }
            });
            dbScores.forEach((s: any) => {
                userStats[s.category] = { likes: s.likes || 0, dislikes: s.dislikes || 0 };
            });
        } catch (e) {
            console.error("Failed to fetch MAB stats from DB", e);
        }
    } else {
        // Guest: Parse from params (expecting JSON of { category: {likes, dislikes} })
        try {
            const prefParam = searchParams.get('preferences');
            if (prefParam) {
                userStats = JSON.parse(prefParam);
            }
        } catch (e) {
            console.warn("Failed to parse guest MAB stats", e);
        }
    }

    // 5. THOMPSON SAMPLING FEED CONSTRUCTION

    // Attach friend matches first
    const enrichedPool = allProducts.map(p => ({
        ...p,
        friendMatches: friendLikesMap[p.id] || []
    }));

    // Buckets
    const poolByCategory: Record<string, any[]> = {};
    CATEGORIES.forEach(c => poolByCategory[c.id] = []);
    enrichedPool.forEach(p => {
        if (poolByCategory[p.category]) poolByCategory[p.category].push(p);
    });

    // Shuffle buckets (or sort by rating/popularity to give best items first)
    Object.values(poolByCategory).forEach(bucket => {
        // Sort by Rating Descending + Random Noise to keep it fresh
        bucket.sort((a, b) => (b.rating + Math.random()) - (a.rating + Math.random()));
    });

    // Helper: Gamma Sampler for Beta Distribution
    const sampleBeta = (alpha: number, beta: number) => {
        const gamma = (k: number) => {
            let s = 0;
            for (let i = 0; i < k; i++) s -= Math.log(Math.random());
            return s;
        };
        const ga = gamma(Math.max(1, Math.floor(alpha))); // Ensure integer >= 1
        const gb = gamma(Math.max(1, Math.floor(beta)));
        return ga / (ga + gb);
    };

    const finalFeed: any[] = [];
    const feedSize = 50;

    for (let i = 0; i < feedSize; i++) {
        let selectedCategory = '';
        const isDiscoverySlot = (i % 5 === 0); // 20% slots

        // Capping: Max 2 of same category in last 5 items
        const isCapped = (cat: string) => {
            const recent = finalFeed.slice(Math.max(0, finalFeed.length - 4));
            return recent.filter(p => p.category === cat).length >= 2;
        };

        if (isDiscoverySlot) {
            // 80/20 Rule: Pick random available category that isn't capped
            // Filter categories that have items and aren't capped
            const candidates = CATEGORIES.filter(c => poolByCategory[c.id].length > 0 && !isCapped(c.id));
            if (candidates.length > 0) {
                selectedCategory = candidates[Math.floor(Math.random() * candidates.length)].id;
            }
        }

        if (!selectedCategory) {
            // Thompson Sampling
            let bestScore = -1;
            const candidates = CATEGORIES.filter(c => poolByCategory[c.id].length > 0 && !isCapped(c.id));

            // Shuffle candidates needed? No, max search handles it, but ties?
            // sampleBeta is continuous so ties unlikely.

            for (const cat of candidates) {
                const stats = userStats[cat.id] || { likes: 0, dislikes: 0 };

                // Alpha = likes + 1, Beta = dislikes + 1
                const score = sampleBeta(stats.likes + 1, stats.dislikes + 1);

                if (score > bestScore) {
                    bestScore = score;
                    selectedCategory = cat.id;
                }
            }
        }

        // Fallback (if all capped or exhausted)
        if (!selectedCategory) {
            const available = CATEGORIES.find(c => poolByCategory[c.id].length > 0);
            if (available) selectedCategory = available.id;
        }

        if (selectedCategory) {
            const product = poolByCategory[selectedCategory].shift();
            if (product) finalFeed.push(product);
        } else {
            break; // No more items
        }
    }

    return NextResponse.json(finalFeed);
}
