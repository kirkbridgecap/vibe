'use client';

import { Product } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Trash2, ShoppingBag } from 'lucide-react';
import Image from 'next/image';

interface WishlistDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    wishlist: Product[];
    onRemove: (id: string) => void;
}

export function WishlistDrawer({ isOpen, onClose, wishlist, onRemove }: WishlistDrawerProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-full max-w-md bg-zinc-900 border-l border-zinc-800 shadow-2xl z-50 flex flex-col"
                    >
                        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <ShoppingBag className="text-brand" />
                                Wishlist ({wishlist.length})
                            </h2>
                            <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {wishlist.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-center space-y-4">
                                    <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center">
                                        <ShoppingBag size={32} />
                                    </div>
                                    <p>Your wishlist is empty.<br />Start swiping to find gifts!</p>
                                </div>
                            ) : (
                                wishlist.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="bg-zinc-800/50 rounded-xl p-3 flex gap-4 border border-zinc-700/50 group"
                                    >
                                        <div className="relative w-20 h-20 bg-white rounded-lg overflow-hidden shrink-0">
                                            <Image
                                                src={item.imageUrl}
                                                alt={item.title}
                                                fill
                                                className="object-contain p-2"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                                            <div>
                                                <h3 className="font-semibold text-sm line-clamp-2 leading-tight mb-1">{item.title}</h3>
                                                <p className="text-brand font-bold text-sm">
                                                    {item.currency === 'USD' ? '$' : ''}{item.price}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <a
                                                    href={item.link}
                                                    target="_blank"
                                                    rel="noopener"
                                                    className="text-xs flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
                                                >
                                                    <ExternalLink size={12} /> Amazon
                                                </a>
                                                <button
                                                    onClick={() => onRemove(item.id)}
                                                    className="text-xs flex items-center gap-1 text-red-400/80 hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 size={12} /> Remove
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
