
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

// Configuration
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'real-time-amazon-data.p.rapidapi.com';

if (!RAPIDAPI_KEY) {
    throw new Error('RAPIDAPI_KEY is not defined in environment variables');
}
const CACHE_FILE_PATH = path.join(process.cwd(), 'data', 'amazon_cache.json');
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

async function fetchFromRapidAPI(query: string = 'interesting high-rated gifts', page: string = '1') {
    // Using Search endpoint for better variety and more reliable results
    const url = `https://${RAPIDAPI_HOST}/search?query=${encodeURIComponent(query)}&page=${page}&country=US&sort_by=RELEVANCE&product_condition=NEW`;

    console.log(`Fetching from RapidAPI Search: ${url}`);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'x-rapidapi-key': RAPIDAPI_KEY as string,
                'x-rapidapi-host': RAPIDAPI_HOST,
            },
        });

        if (!response.ok) {
            throw new Error(`RapidAPI Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('RapidAPI Fetch Failed:', error);
        return null;
    }
}

function getCache() {
    try {
        if (fs.existsSync(CACHE_FILE_PATH)) {
            const fileContent = fs.readFileSync(CACHE_FILE_PATH, 'utf-8');
            const cache = JSON.parse(fileContent);
            const now = Date.now();
            if (now - cache.timestamp < CACHE_DURATION_MS && cache.data && cache.data.length > 0) {
                return cache.data;
            }
        }
    } catch (e) {
        console.warn("Failed to read cache", e);
    }
    return null;
}

function saveCache(data: any) {
    try {
        const dir = path.dirname(CACHE_FILE_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const cache = {
            timestamp: Date.now(),
            data: data
        };
        fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(cache, null, 2));
    } catch (e) {
        console.error("Failed to save cache", e);
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const minPrice = parseFloat(searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '10000');

    let products = getCache();

    if (!products) {
        console.log("Cache miss or stale. Fetching fresh data...");
        const apiData = await fetchFromRapidAPI();

        // The Search endpoint returns data.products
        const rawProducts = apiData?.data?.products;

        if (Array.isArray(rawProducts) && rawProducts.length > 0) {
            // Transform Data
            products = rawProducts.map((item: any) => {
                const priceStr = item.product_price || '$0';
                const price = parseFloat(priceStr.replace(/[^0-9.]/g, ''));

                return {
                    id: item.asin,
                    title: item.product_title,
                    price: isNaN(price) ? 0 : price,
                    currency: 'USD',
                    imageUrl: item.product_photo,
                    link: item.product_url,
                    category: 'Gifts',
                    isBestSeller: item.is_best_seller || false,
                    rating: parseFloat(item.product_star_rating || '0'),
                    reviews: item.product_num_ratings || 0
                };
            });

            saveCache(products);
        } else {
            console.error("No products found in Search API response.");
            return NextResponse.json({ error: 'No products found' }, { status: 404 });
        }
    }

    // Client-side filtering
    const filteredProducts = products.filter((p: Product) => {
        return p.price >= minPrice && p.price <= maxPrice;
    });

    return NextResponse.json(filteredProducts);
}
