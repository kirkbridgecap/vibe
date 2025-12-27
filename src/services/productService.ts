import { Product, FilterState } from '@/types';

const MOCK_PRODUCTS: Product[] = [
    {
        id: '1',
        title: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
        price: 348.00,
        currency: 'USD',
        imageUrl: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=800',
        link: 'https://amazon.com',
        rating: 4.8,
        reviews: 12500,
        category: 'Tech',
        isBestSeller: true,
    },
    {
        id: '2',
        title: 'Chemex Pour-Over Glass Coffeemaker',
        price: 48.95,
        currency: 'USD',
        imageUrl: 'https://images.unsplash.com/photo-1544062630-d38af6212176?auto=format&fit=crop&q=80&w=800',
        link: 'https://amazon.com',
        category: 'Home',
    },
    {
        id: '3',
        title: 'Kindle Paperwhite (16 GB)',
        price: 149.99,
        currency: 'USD',
        imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
        link: 'https://amazon.com',
        category: 'Tech',
        isBestSeller: true,
    },
    {
        id: '4',
        title: 'Aesop Resurrection Aromatique Hand Balm',
        price: 33.00,
        currency: 'USD',
        imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=800',
        link: 'https://amazon.com',
        category: 'Lifestyle',
    },
    {
        id: '5',
        title: 'Fujifilm Instax Mini 12 Instant Camera',
        price: 79.95,
        currency: 'USD',
        imageUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&q=80&w=800',
        link: 'https://amazon.com',
        category: 'Tech',
    },
    {
        id: '6',
        title: 'Le Creuset Enameled Cast Iron Signature Round Dutch Oven',
        price: 419.95,
        currency: 'USD',
        imageUrl: 'https://images.unsplash.com/photo-1585646197361-bd314db0b808?auto=format&fit=crop&q=80&w=800',
        link: 'https://amazon.com',
        category: 'Home',
    },
    {
        id: '7',
        title: 'Apple AirTag 4 Pack',
        price: 89.00,
        currency: 'USD',
        imageUrl: 'https://images.unsplash.com/photo-1633512217997-8c38adbc165b?auto=format&fit=crop&q=80&w=800',
        link: 'https://amazon.com',
        category: 'Tech',
        isBestSeller: true,
    },
    {
        id: '8',
        title: 'Stanley Quencher H2.0 FlowState Tumbler',
        price: 45.00,
        currency: 'USD',
        imageUrl: 'https://images.unsplash.com/photo-1688649061803-a2614b62d37c?auto=format&fit=crop&q=80&w=800',
        link: 'https://amazon.com',
        category: 'Lifestyle',
        isBestSeller: true,
    }
];

export async function fetchProducts(filters: FilterState): Promise<Product[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    let filtered = [...MOCK_PRODUCTS];

    // Price filter
    filtered = filtered.filter(p => p.price >= filters.minPrice && p.price <= filters.maxPrice);

    // Gender/Category mock logic (just randomization for demo if not strict)
    // For now, return shuffled to simulate discovery
    return filtered.sort(() => Math.random() - 0.5);
}
