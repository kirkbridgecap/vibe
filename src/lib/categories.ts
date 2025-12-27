export interface Category {
    id: string;
    label: string;
    query: string; // Search query for Amazon API
}

export const CATEGORIES: Category[] = [
    { id: 'tech', label: 'Tech & Gadgets', query: 'cool tech gadgets electronics' },
    { id: 'home', label: 'Home & Living', query: 'unique home decor kitchen gadgets' },
    { id: 'fashion', label: 'Style & Accessories', query: 'trendy fashion accessories jewelry' },
    { id: 'wellness', label: 'Self Care', query: 'wellness self care relaxation gifts' },
    { id: 'hobbies', label: 'Hobbies & Games', query: 'fun board games hobbies diy kits' },
    { id: 'workspace', label: 'Workspace', query: 'aesthetic desk accessories office' },
];
