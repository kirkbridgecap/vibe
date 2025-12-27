'use client';

import { Product } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Trash2, ShoppingBag, LogOut } from 'lucide-react';
import Image from 'next/image';
import { signIn, signOut, useSession } from "next-auth/react";

interface WishlistDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    wishlist: Product[];
    onRemove: (id: string) => void;
    onClear: () => void;
}

export function WishlistDrawer({ isOpen, onClose, wishlist, onRemove, onClear }: WishlistDrawerProps) {
    const { data: session } = useSession();
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
                            <div className="flex items-center gap-2">
                                {wishlist.length > 0 && (
                                    <button
                                        onClick={() => {
                                            if (confirm('Are you sure you want to remove all items?')) {
                                                onClear();
                                            }
                                        }}
                                        className="text-xs font-semibold text-red-500 hover:text-red-400 transition-colors px-3 py-1 bg-red-500/10 rounded-full"
                                    >
                                        Clear All
                                    </button>
                                )}
                                <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
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
                        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
                            {session ? (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-zinc-700 overflow-hidden relative">
                                            {session.user?.image && (
                                                <Image src={session.user.image} alt="Profile" fill className="object-cover" />
                                            )}
                                        </div>
                                        <div className="text-sm">
                                            <p className="font-medium text-white">{session.user?.name}</p>
                                            <p className="text-xs text-zinc-500">Synced</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => signOut()}
                                        className="text-zinc-400 hover:text-white transition-colors"
                                    >
                                        <LogOut size={18} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => signIn('google')}
                                    className="w-full bg-white text-black font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors"
                                >
                                    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                                        <path
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            fill="#4285F4"
                                        />
                                        <path
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            fill="#34A853"
                                        />
                                        <path
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                            fill="#FBBC05"
                                        />
                                        <path
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            fill="#EA4335"
                                        />
                                    </svg>
                                    Sign in with Google
                                </button>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
