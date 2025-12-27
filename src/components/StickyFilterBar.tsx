'use client';

import { FilterState } from '@/types';
import { User, Heart } from 'lucide-react';

interface StickyFilterBarProps {
    filters: FilterState;
    onFilterChange: (newFilters: Partial<FilterState>) => void;
    onProfileClick: () => void;
    wishlistCount: number;
}

export function StickyFilterBar({ filters, onFilterChange, onProfileClick, wishlistCount }: StickyFilterBarProps) {
    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 p-3">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                {/* Logo */}
                <div className="flex items-center gap-2 shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-br from-red-500 via-pink-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-pink-500/20 rotate-3">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="w-5 h-5 text-white"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M4 4l8 16L20 4" />
                        </svg>
                    </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                    {/* Price/Budget Filter */}
                    <select
                        value={filters.maxPrice === 10000 ? 'all' : filters.maxPrice <= 25 ? 'low' : filters.maxPrice <= 100 ? 'mid' : 'high'}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'low') onFilterChange({ minPrice: 0, maxPrice: 25 });
                            else if (val === 'mid') onFilterChange({ minPrice: 25, maxPrice: 100 });
                            else if (val === 'high') onFilterChange({ minPrice: 100, maxPrice: 10000 });
                            else onFilterChange({ minPrice: 0, maxPrice: 10000 });
                        }}
                        className="bg-zinc-900 border border-zinc-700 text-white text-xs rounded-full px-3 py-1.5 focus:ring-2 focus:ring-red-500 focus:outline-none appearance-none cursor-pointer hover:bg-zinc-800 transition-colors shrink-0 w-[80px] text-center"
                    >
                        <option value="all">Price</option>
                        <option value="low">Under $25</option>
                        <option value="mid">$25 - $100</option>
                        <option value="high">$100+</option>
                    </select>

                    {/* Rating Filter */}
                    <select
                        value={filters.minRating?.toString() || '0'}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            onFilterChange({ minRating: val, maxRating: 5.0 });
                        }}
                        className="bg-zinc-900 border border-zinc-700 text-white text-xs rounded-full px-3 py-1.5 focus:ring-2 focus:ring-red-500 focus:outline-none appearance-none cursor-pointer hover:bg-zinc-800 transition-colors shrink-0 w-[80px] text-center"
                    >
                        <option value="0">Rating</option>
                        <option value="3.5">3.5+</option>
                        <option value="4.0">4.0+</option>
                        <option value="4.2">4.2+</option>
                    </select>

                    {/* Reviews Filter */}
                    <select
                        value={filters.minReviews || 0}
                        onChange={(e) => onFilterChange({ minReviews: Number(e.target.value) })}
                        className="bg-zinc-900 border border-zinc-700 text-white text-xs rounded-full px-3 py-1.5 focus:ring-2 focus:ring-red-500 focus:outline-none appearance-none cursor-pointer hover:bg-zinc-800 transition-colors shrink-0 w-[80px] text-center"
                    >
                        <option value="0">Reviews</option>
                        <option value="100">100+</option>
                        <option value="1000">1k+</option>
                        <option value="5000">5k+</option>
                    </select>
                </div>

                {/* Profile/Wishlist Button */}
                <button
                    onClick={onProfileClick}
                    className="relative p-2 text-zinc-400 hover:text-white transition-colors shrink-0"
                >
                    <User size={24} />
                    {wishlistCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-zinc-950"></span>
                    )}
                </button>
            </div>
        </div>
    );
}
