export interface Product {
    id: string;
    title: string;
    price: number;
    currency: string;
    imageUrl: string;
    link: string;
    rating?: number;
    reviews?: number;
    category: string;
    isBestSeller?: boolean;
}

export interface FilterState {
    minPrice: number;
    maxPrice: number;
    category?: string;
    minReviews?: number;
    minRating?: number;
    maxRating?: number;
}
