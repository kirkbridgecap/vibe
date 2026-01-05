'use client';

import { useState, useMemo } from 'react';
import { useUserData } from '@/context/UserDataContext';
import Image from 'next/image';
import { Search, ChevronDown, Filter, Share2, Tag, ShoppingBag, Trash2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from "next-auth/react";

export default function WishlistPage() {
    const { data: session } = useSession();
    const { wishlist, assignments, addToWishlist, removeFromWishlist, assignItem, clearWishlist, deleteAssignee } = useUserData();
    const [filterText, setFilterText] = useState('');
    const [personFilter, setPersonFilter] = useState<string>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [priceSort, setPriceSort] = useState<'asc' | 'desc' | null>(null);

    // Derive unique people from assignments
    const people = useMemo(() => {
        const set = new Set(Object.values(assignments));
        return Array.from(set).filter(Boolean).sort();
    }, [assignments]);

    // Derive unique categories from wishlist
    const categories = useMemo(() => {
        const set = new Set(wishlist.map(w => w.category));
        return Array.from(set).filter(Boolean).sort();
    }, [wishlist]);

    const filteredItems = useMemo(() => {
        let items = [...wishlist];

        if (filterText) {
            const lower = filterText.toLowerCase();
            items = items.filter(i =>
                i.title.toLowerCase().includes(lower)
            );
        }

        if (personFilter !== 'all') {
            if (personFilter === 'unassigned') {
                items = items.filter(i => !assignments[i.id]);
            } else {
                items = items.filter(i => assignments[i.id] === personFilter);
            }
        }

        if (categoryFilter !== 'all') {
            items = items.filter(i => i.category === categoryFilter);
        }

        if (priceSort) {
            items.sort((a, b) => {
                const pA = parseFloat(a.price.toString());
                const pB = parseFloat(b.price.toString());
                return priceSort === 'asc' ? pA - pB : pB - pA;
            });
        }

        return items;
    }, [wishlist, filterText, personFilter, categoryFilter, priceSort, assignments]);

    const totalPrice = filteredItems.reduce((sum, item) => sum + parseFloat(item.price.toString()), 0);

    const handleShare = async () => {
        if (personFilter === 'all' || personFilter === 'unassigned') {
            alert("Please select a person to share their list.");
            return;
        }

        if (!session?.user?.id) {
            alert("You need to be signed in to share.");
            return;
        }

        const url = `${window.location.origin}/u/${session.user.id}/${encodeURIComponent(personFilter)}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${personFilter}'s Wishlist`,
                    text: `Check out the gift ideas I found for ${personFilter} on Vibe!`,
                    url
                });
            } catch (e) {
                // Ignore abort errors
            }
        } else {
            try {
                await navigator.clipboard.writeText(url);
                alert(`Link for ${personFilter} copied to clipboard!`);
            } catch (e) {
                alert("Failed to copy link.");
            }
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 pb-32 pt-6 px-4">
            <header className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <ShoppingBag className="text-brand" />
                        Wishlist
                    </h1>
                    {wishlist.length > 0 && (
                        <button
                            onClick={() => {
                                if (confirm("Are you sure you want to clear your entire wishlist? This action cannot be undone.")) {
                                    clearWishlist();
                                }
                            }}
                            className="text-xs font-semibold text-red-500 hover:text-red-400 bg-red-500/10 px-3 py-1.5 rounded-full transition-colors"
                        >
                            Clear All
                        </button>
                    )}
                </div>

                <p className="text-zinc-400 text-sm mt-1">
                    {wishlist.length} items • Total value: ${totalPrice.toFixed(2)}
                </p>
            </header>

            {/* Controls */}
            <div className="space-y-4 mb-6 sticky top-0 bg-zinc-950/80 backdrop-blur-md z-40 py-2 border-b border-zinc-800/50">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search gifts..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 text-white placeholder-zinc-500"
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {/* Price Toggle */}
                    <button
                        onClick={() => setPriceSort(prev => prev === 'asc' ? 'desc' : (prev === 'desc' ? null : 'asc'))}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${priceSort ? 'bg-brand/10 border-brand text-brand' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                            }`}
                    >
                        <Filter size={12} />
                        Price {priceSort === 'asc' ? '↑' : (priceSort === 'desc' ? '↓' : '')}
                    </button>

                    {/* Lists Filters */}
                    <div className="flex items-center gap-2 pl-2 border-l border-zinc-800 ml-2">
                        <span className="text-xs font-semibold text-zinc-500 py-1.5 mobile-hide hidden sm:inline-block">Lists:</span>
                        <button
                            onClick={() => setPersonFilter('all')}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${personFilter === 'all' ? 'bg-white text-black border-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setPersonFilter('unassigned')}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${personFilter === 'unassigned' ? 'bg-white text-black border-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                                }`}
                        >
                            Unassigned
                        </button>
                    </div>
                    {people.map(person => (
                        <button
                            key={person}
                            onClick={() => setPersonFilter(person)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${personFilter === person ? 'bg-brand text-white border-brand' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                                }`}
                        >
                            {person}
                        </button>
                    ))}
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mt-2 items-center">
                    <span className="text-xs font-semibold text-zinc-500 py-1.5 pl-1">Categories:</span>
                    <button
                        onClick={() => setCategoryFilter('all')}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${categoryFilter === 'all' ? 'bg-white text-black border-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                            }`}
                    >
                        All
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${categoryFilter === cat ? 'bg-brand text-white border-brand' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                    {/* Share & Delete Buttons */}
                    {(personFilter !== 'all' && personFilter !== 'unassigned') && (
                        <div className="ml-auto flex items-center gap-2">
                            <button
                                onClick={handleShare}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap bg-zinc-800 border-zinc-700 text-brand hover:bg-zinc-700"
                            >
                                <Share2 size={12} />
                                Share
                            </button>
                            <button
                                onClick={() => {
                                    if (confirm(`Are you sure you want to delete the "${personFilter}" list? This will remove the tag from all items.`)) {
                                        deleteAssignee(personFilter);
                                        setPersonFilter('all');
                                    }
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20"
                                title="Delete List/Tag"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 gap-4">
                <AnimatePresence mode='popLayout'>
                    {filteredItems.map(item => (
                        <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-zinc-900 rounded-2xl p-3 flex gap-4 border border-zinc-800 relative group"
                        >
                            <div className="w-24 h-24 bg-white rounded-xl overflow-hidden shrink-0 relative">
                                <Image
                                    src={item.imageUrl}
                                    alt={item.title}
                                    fill
                                    className="object-contain p-2"
                                />
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                <div>
                                    <h3 className="font-semibold text-sm line-clamp-2 leading-tight mb-1 text-zinc-100">{item.title}</h3>
                                    <p className="text-brand font-bold text-lg">
                                        ${item.price}
                                        <span className="text-xs font-normal text-zinc-500 ml-2 bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700">
                                            {item.category}
                                        </span>
                                    </p>

                                    {/* Assignment Input */}
                                    <div className="flex items-center gap-2 mt-2">
                                        <Tag size={12} className="text-zinc-500" />
                                        <input
                                            type="text"
                                            placeholder="Tag list (e.g. Dad, Birthday)..."
                                            className="bg-transparent text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none border-b border-transparent focus:border-zinc-700 w-full"
                                            value={assignments[item.id] || ''}
                                            onChange={(e) => assignItem(item.id, e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 mt-3 justify-end">
                                    <a
                                        href={item.link}
                                        target="_blank"
                                        rel="noopener"
                                        className="flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-white transition-colors bg-zinc-800 px-3 py-1.5 rounded-lg"
                                    >
                                        <ExternalLink size={12} /> View
                                    </a>
                                    <button
                                        onClick={() => removeFromWishlist(item.id)}
                                        className="flex items-center gap-1 text-xs font-medium text-red-400/80 hover:text-red-400 transition-colors bg-red-400/10 px-3 py-1.5 rounded-lg"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {wishlist.length === 0 ? (
                <div className="flex flex-col items-center justify-center mt-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center">
                        <ShoppingBag size={32} className="text-zinc-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Your wishlist is empty</h3>
                        <p className="text-zinc-500 text-sm mt-1">Start swiping on the Discover page to add gifts!</p>
                    </div>
                </div>
            ) : filteredItems.length === 0 && (
                <div className="text-center text-zinc-500 mt-20">
                    <p>No items match your filters.</p>
                    <button
                        onClick={() => { setFilterText(''); setPersonFilter('all'); setCategoryFilter('all'); }}
                        className="text-brand text-sm mt-2 underline hover:text-brand-light transition-colors"
                    >
                        Clear all filters
                    </button>
                </div>
            )}
        </div>
    );
}
