import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { CATEGORIES } from '@/lib/categories';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// Types
interface Product {
    id: string;
    title: string;
    price: number;
    currency: string;
    imageUrl: string;
    link: string;
    category: string;
    isBestSeller: boolean;
    rating?: number;
    reviews?: number;
}

interface CacheData {
    [categoryId: string]: {
        timestamp: number;
        data: Product[];
    };
}

// Configuration
const RAPIDAPI_HOST = 'real-time-amazon-data.p.rapidapi.com';
const CACHE_FILE_PATH = path.join(process.cwd(), 'data', 'amazon_cache.json');
const CACHE_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours
const MAX_ITEMS_PER_CATEGORY = 200;

async function fetchFromRapidAPI(query: string, categoryId: string): Promise<Product[] | null> {
    const key = process.env.RAPIDAPI_KEY;

    if (!key) {
        console.error('RAPIDAPI_KEY is not defined');
        return null;
    }

    // We'll fetch 2 pages for better variety
    const products: Product[] = [];

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

function getCache(): CacheData {
    try {
        if (fs.existsSync(CACHE_FILE_PATH)) {
            const fileContent = fs.readFileSync(CACHE_FILE_PATH, 'utf-8');
            return JSON.parse(fileContent);
        }
    } catch (e) {
        console.warn("Failed to read cache", e);
    }
    return {};
}

function saveCache(cache: CacheData) {
    try {
        const dir = path.dirname(CACHE_FILE_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(cache, null, 2));
    } catch (e) {
        console.error("Failed to save cache", e);
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const minPrice = parseFloat(searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '10000');
    const minReviews = parseInt(searchParams.get('minReviews') || '0');
    const minRating = parseFloat(searchParams.get('minRating') || '0');
    const maxRating = parseFloat(searchParams.get('maxRating') || '5');

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

    let cache = getCache();
    let hasUpdated = false;
    const now = Date.now();

    const shuffledCategories = [...CATEGORIES].sort(() => Math.random() - 0.5);

    let updatesInThisRequest = 0;

    for (const cat of shuffledCategories) {
        const cachedCat = cache[cat.id];
        const isStale = !cachedCat || (now - cachedCat.timestamp > CACHE_DURATION_MS);

        if (isStale) {
            // Pick a random query from the available ones for this category
            const randomQuery = cat.queries[Math.floor(Math.random() * cat.queries.length)];
            console.log(`Refreshing category: ${cat.label} with query "${randomQuery}"`);

            const newProducts = await fetchFromRapidAPI(randomQuery, cat.id);

            if (newProducts) {
                // MERGE STRATEGY: Combine new products with old ones and deduplicate
                const existingData = cachedCat?.data || [];
                const combined = [...newProducts, ...existingData];

                // Deduplicate by ASIN
                const uniqueMap = new Map();
                combined.forEach(p => uniqueMap.set(p.id, p));

                let uniqueProducts = Array.from(uniqueMap.values());

                // Shuffle unique products so they don't always appear in the same order in the cache
                uniqueProducts = uniqueProducts.sort(() => Math.random() - 0.5);

                // Cap the size
                if (uniqueProducts.length > MAX_ITEMS_PER_CATEGORY) {
                    uniqueProducts = uniqueProducts.slice(0, MAX_ITEMS_PER_CATEGORY);
                }

                cache[cat.id] = {
                    timestamp: now,
                    data: uniqueProducts
                };
                hasUpdated = true;
                updatesInThisRequest++;

                // SMART LIMITER:
                // If we have very few active categories (Cold Start), keep fetching to populate the feed.
                // If we have a healthy cache (>= 3 active categories), stop to save API quota.
                const activeCategoriesCount = Object.values(cache).filter(c => c && (now - c.timestamp < CACHE_DURATION_MS)).length;

                if (activeCategoriesCount >= 3) {
                    break;
                }

                // Hard safety limit: Never fetch more than 3 categories in a single user request
                if (updatesInThisRequest >= 3) {
                    break;
                }
            }
        }
    }

    if (hasUpdated) {
        saveCache(cache);
    }

    // 2. AGGREGATE PRODUCTS
    let allProducts: Product[] = [];
    Object.values(cache).forEach(catEntry => {
        if (catEntry && catEntry.data) {
            allProducts = [...allProducts, ...catEntry.data];
        }
    });

    if (allProducts.length === 0) {
        return NextResponse.json({ error: 'No products available' }, { status: 404 });
    }

    // 3. FILTERING & RECOMMENDATION ENGINE
    const filteredProducts = allProducts.filter((p: Product) => {
        const matchesPrice = p.price >= minPrice && p.price <= maxPrice;
        const matchesReviews = (p.reviews ?? 0) >= minReviews;
        const matchesRating = (p.rating ?? 0) >= minRating && (p.rating ?? 5) <= maxRating;
        return matchesPrice && matchesReviews && matchesRating;
    });

    // 4. WEIGHTED SHUFFLE
    // Assign a score to each product based on user preferences + random noise
    // Score = (UserWeightForCategory || 1.0) * RandomFactor
    const scoredProducts = filteredProducts.map(p => {
        const rawWeight = userPreferences[p.category] !== undefined ? userPreferences[p.category] : 1.0;
        // Dampen the weight impact using Logarithm to prevent runaway domination
        // e.g. Weight 20 becomes ~4.0, Weight 1 remains ~1.7
        const effectiveWeight = Math.log(rawWeight + Math.E);

        const score = effectiveWeight * (Math.random() + 0.5);
        return { product: p, score };
    });

    // Sort by personalized score first to create candidates list
    scoredProducts.sort((a, b) => b.score - a.score);

    // 5. SPREAD SORT (SMART INTERLEAVING)
    // Greedy algorithm to prevent category clumping
    const finalProducts: Product[] = [];
    let pool = [...scoredProducts];
    let lastCategory: string | null = null;

    while (pool.length > 0) {
        let selectedIndex = -1;

        // Try to find the highest-scoring item that isn't the same category as the last one
        // Increased lookahead to 20 to break through larger clumps
        const lookahead = Math.min(pool.length, 20);

        for (let i = 0; i < lookahead; i++) {
            if (pool[i].product.category !== lastCategory) {
                selectedIndex = i;
                break;
            }
        }

        // Fallback: If all top items are the same category, just pick the top one
        if (selectedIndex === -1) {
            selectedIndex = 0;
        }

        const selected = pool[selectedIndex];
        finalProducts.push(selected.product);
        lastCategory = selected.product.category;

        // Remove from pool
        pool.splice(selectedIndex, 1);
    }

    return NextResponse.json(finalProducts);
}
