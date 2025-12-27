'use client';

import { Product } from '@/types';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { ExternalLink, Check, X } from 'lucide-react';
import Image from 'next/image';

interface SwipeCardProps {
    product: Product;
    onSwipe: (direction: 'left' | 'right') => void;
    style?: any;
    drag?: boolean;
    custom?: 'left' | 'right' | null;
}

const variants = {
    enter: { scale: 0.95, y: 0, opacity: 0 },
    center: { scale: 1, y: 0, opacity: 1, x: 0, rotate: 0 },
    exit: (custom?: 'left' | 'right' | null) => ({
        x: custom === 'right' ? 300 : custom === 'left' ? -300 : 0,
        opacity: 0,
        rotate: custom === 'right' ? 20 : custom === 'left' ? -20 : 0,
        transition: { duration: 0.2 }
    })
};

export function SwipeCard({ product, onSwipe, style, drag = true, custom }: SwipeCardProps) {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-10, 10]);
    const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);

    // Color overlays for feedback
    const likeOpacity = useTransform(x, [0, 150], [0, 1]);
    const nopeOpacity = useTransform(x, [-150, 0], [1, 0]);

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.x > 100) {
            onSwipe('right');
        } else if (info.offset.x < -100) {
            onSwipe('left');
        }
    };

    return (
        <motion.div
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            custom={custom}
            style={{ x, rotate, opacity, ...style }}
            drag={drag ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            className={`absolute top-0 left-0 w-full h-full bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-zinc-800 origin-bottom select-none cursor-grab active:cursor-grabbing`}
        >
            {/* Image Section */}
            <div className="relative h-[50%] w-full bg-white">
                <Image
                    src={product.imageUrl}
                    alt={product.title}
                    fill
                    className="object-contain p-8"
                    draggable={false}
                />

                {/* LIKE Overlay */}
                <motion.div
                    style={{ opacity: likeOpacity }}
                    className="absolute top-8 left-8 bg-green-500 rounded-full p-4 shadow-lg -rotate-12 z-10"
                >
                    <Check size={48} className="text-white" strokeWidth={4} />
                </motion.div>

                {/* NOPE Overlay */}
                <motion.div
                    style={{ opacity: nopeOpacity }}
                    className="absolute top-8 right-8 bg-red-500 rounded-full p-4 shadow-lg rotate-12 z-10"
                >
                    <X size={48} className="text-white" strokeWidth={4} />
                </motion.div>
            </div>

            {/* Content Section */}
            <div className="h-[50%] p-5 pt-3 flex flex-col bg-zinc-900">
                <div className="flex-1 overflow-y-auto pr-1 mb-2 custom-scrollbar">
                    <div className="flex justify-between items-start gap-2 mb-2">
                        <h2 className={`font-bold text-white leading-tight ${product.title.length > 80 ? 'text-sm' : product.title.length > 50 ? 'text-base' : 'text-xl'}`}>
                            {product.title}
                        </h2>
                        <span className="text-green-400 font-semibold whitespace-nowrap">
                            {product.currency === 'USD' ? '$' : ''}{product.price}
                        </span>
                    </div>
                    <div className="flex gap-2 mb-4">
                        <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-400 uppercase tracking-wider font-semibold">
                            {product.category}
                        </span>
                        {product.isBestSeller && (
                            <span className="text-xs bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded uppercase tracking-wider font-semibold">
                                Best Seller
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mb-4 text-xs text-zinc-400">
                        {product.rating && (
                            <div className="flex items-center gap-1 text-yellow-500">
                                <span>★</span>
                                <span className="font-medium text-white">{product.rating}</span>
                            </div>
                        )}
                        {product.reviews && product.reviews > 0 && (
                            <>
                                <span>•</span>
                                <span>{product.reviews.toLocaleString()} reviews</span>
                            </>
                        )}
                    </div>
                </div>

                <a
                    href={product.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-zinc-100 hover:bg-white text-black font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors mt-auto shrink-0"
                    onPointerDown={(e) => e.stopPropagation()} // Prevent drag when clicking button
                >
                    View on Amazon <ExternalLink size={18} />
                </a>
            </div>
        </motion.div>
    );
}
