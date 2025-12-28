import { motion } from 'framer-motion';
import { X, MessageCircle, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';

interface MatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    matches: { name: string; image?: string; userId: string }[];
    productImage: string;
}

export function MatchModal({ isOpen, onClose, matches, productImage }: MatchModalProps) {
    useEffect(() => {
        // Auto-close after 4 seconds if user doesn't interact, 
        // but maybe better to let them bask in the glory?
        // Let's keep it manual for now to encourage "Messaging".
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="relative bg-zinc-900 border border-yellow-500/50 w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl shadow-yellow-500/20 overflow-hidden"
            >
                {/* Background glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-yellow-500/20 rounded-full blur-3xl pointer-events-none" />

                <h2 className="text-3xl font-black text-white italic tracking-tighter mb-1 relative z-10">
                    IT'S A <span className="text-yellow-500">VIBE!</span>
                </h2>
                <p className="text-zinc-400 text-sm mb-6 relative z-10">You and {matches[0].name} have great taste.</p>

                {/* Avatars */}
                <div className="flex items-center justify-center gap-4 mb-6 relative z-10">
                    <div className="w-20 h-20 rounded-full border-4 border-zinc-900 overflow-hidden shadow-xl">
                        {/* Current User Placeholder - we don't have current user image easily available in this component without drilling, 
                 but we can use a generic YOU or just show the Friend + Product. 
                 Let's show Friend + Product for now. */}
                        <img src={productImage} alt="Product" className="w-full h-full object-cover" />
                    </div>
                    <div className="text-yellow-500">
                        <ArrowRight size={24} />
                    </div>
                    <div className="w-20 h-20 rounded-full border-4 border-yellow-500 overflow-hidden shadow-xl shadow-yellow-500/20">
                        {matches[0].image ? (
                            <img src={matches[0].image} alt={matches[0].name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-xl font-bold text-zinc-500">
                                {matches[0].name[0]}
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-3 relative z-10">
                    <button
                        className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                        onClick={() => alert("Messaging coming soon!")}
                    >
                        <MessageCircle size={20} />
                        Send Message
                    </button>
                    <button
                        className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors"
                        onClick={onClose}
                    >
                        Keep Swiping
                    </button>
                </div>

            </motion.div>
        </div>
    );
}
