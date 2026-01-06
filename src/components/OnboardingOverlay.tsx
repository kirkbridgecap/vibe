'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { X, Check, RotateCcw, Hand } from 'lucide-react';
import { useEffect, useState } from 'react';

export function OnboardingOverlay() {
    // We use a separate key for verification so it doesn't conflict with any existing "seen" flags if we had them
    const [hasSeenOnboarding, setHasSeenOnboarding] = useLocalStorage<boolean>('vibe-onboarding-seen-v1', false);
    const [isVisible, setIsVisible] = useState(false);

    // Delay showing to allow app to load
    useEffect(() => {
        if (!hasSeenOnboarding) {
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, [hasSeenOnboarding]);

    const handleClose = () => {
        setIsVisible(false);
        setHasSeenOnboarding(true);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-white"
                    onClick={handleClose}
                >
                    <div className="max-w-sm w-full space-y-12 pointer-events-none">

                        {/* Swipe Right */}
                        <motion.div
                            initial={{ x: -50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-center gap-4"
                        >
                            <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(34,197,94,0.5)]">
                                <Check size={32} strokeWidth={3} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-green-400">Swipe Right</h3>
                                <p className="text-zinc-300">to LIKE and save to wishlist</p>
                            </div>
                        </motion.div>

                        {/* Swipe Left */}
                        <motion.div
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="flex items-center gap-4 flex-row-reverse text-right"
                        >
                            <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                                <X size={32} strokeWidth={3} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-red-500">Swipe Left</h3>
                                <p className="text-zinc-300">to PASS on a product</p>
                            </div>
                        </motion.div>

                        {/* Undo */}
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="flex items-center gap-4 pt-8"
                        >
                            <div className="w-12 h-12 rounded-full bg-zinc-800 border border-yellow-500/50 flex items-center justify-center shrink-0 text-yellow-500">
                                <RotateCcw size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-yellow-500">Undo</h3>
                                <p className="text-zinc-400 text-sm">Mistakes happen. Go back one step.</p>
                            </div>
                        </motion.div>

                    </div>

                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                        className="mt-20 bg-white text-black font-bold py-3 px-12 rounded-full hover:scale-105 transition-transform"
                        onClick={handleClose}
                    >
                        Got it, let's Vibe!
                    </motion.button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
