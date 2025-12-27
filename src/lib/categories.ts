export interface Category {
    id: string;
    label: string;
    queries: string[]; // Multiple search queries for variety
}

export const CATEGORIES: Category[] = [
    { id: 'tech', label: 'Tech & Gadgets', queries: ['cool tech gadgets electronics', 'innovative smart home gadgets', 'funny office tech'] },
    { id: 'home', label: 'Home & Living', queries: ['unique home decor kitchen gadgets', 'cozy aesthetic room decor', 'smart kitchen appliances'] },
    { id: 'fashion', label: 'Style & Accessories', queries: ['trendy fashion accessories jewelry', 'minimalist watches sunglasses', 'unique leather goods'] },
    { id: 'wellness', label: 'Self Care', queries: ['wellness self care relaxation gifts', 'spa gift sets meditation', 'healthy lifestyle accessories'] },
    { id: 'hobbies', label: 'Hobbies & Games', queries: ['fun board games hobbies diy kits', 'unique collectibles gaming gears', 'outdoor adventure equipment'] },
    { id: 'workspace', label: 'Workspace', queries: ['aesthetic desk accessories office', 'ergonomic workspace upgrades', 'productivity tools and stationary'] },
    { id: 'outdoors', label: 'Outdoors', queries: ['camping gear outdoor essentials', 'portable travel gadgets', 'survival and exploration kits'] },
    { id: 'creative', label: 'Creative', queries: ['art supplies creative kits', 'music gear instruments', 'photography and vlog tools'] },
    { id: 'pets', label: 'Pets', queries: ['interesting pet gadgets toys', 'high tech pet accessories', 'unique pet lover gifts'] }
];
