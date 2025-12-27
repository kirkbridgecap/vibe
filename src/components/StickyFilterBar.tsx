'use client';

import { FilterState } from '@/types';
import { Filter } from 'lucide-react';

interface StickyFilterBarProps {
    filters: FilterState;
    onFilterChange: (newFilters: Partial<FilterState>) => void;
}

export function StickyFilterBar({ filters, onFilterChange }: StickyFilterBarProps) {
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
                    <span className="text-xl font-black tracking-tighter text-white uppercase italic hidden sm:block">
                        Vibe
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {/* Price/Budget Filter (Simplified for UI) */}
                    <select
                        value={filters.maxPrice === 10000 ? 'all' : filters.maxPrice <= 25 ? 'low' : filters.maxPrice <= 100 ? 'mid' : 'high'}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'low') onFilterChange({ minPrice: 0, maxPrice: 25 });
                            else if (val === 'mid') onFilterChange({ minPrice: 25, maxPrice: 100 });
                            else if (val === 'high') onFilterChange({ minPrice: 100, maxPrice: 10000 });
                            else onFilterChange({ minPrice: 0, maxPrice: 10000 });
                        }}
                        className="bg-zinc-900 border border-zinc-700 text-white text-sm rounded-full px-4 py-2 focus:ring-2 focus:ring-brand focus:outline-none appearance-none cursor-pointer hover:bg-zinc-800 transition-colors"
                    >
                        <option value="all">Any Price</option>
                        <option value="low">Under $25</option>
                        <option value="mid">$25 - $100</option>
                        <option value="high">$100+</option>
                    </select>

                    <button className="p-2 text-zinc-400 hover:text-white transition-colors">
                        <Filter size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
