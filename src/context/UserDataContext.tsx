'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { Product } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface UserDataContextType {
    wishlist: Product[];
    categoryScores: Record<string, number>;
    rejectedIds: string[];
    assignments: Record<string, string>; // productId -> person name
    setRejectedIds: (ids: string[] | ((prev: string[]) => string[])) => void;
    addToWishlist: (product: Product) => Promise<void>;
    removeFromWishlist: (id: string) => Promise<void>;
    clearWishlist: () => Promise<void>;
    updateCategoryScores: (newScores: Record<string, number>) => Promise<void>;
    assignItem: (productId: string, person: string) => void;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export function UserDataProvider({ children }: { children: ReactNode }) {
    const { data: session } = useSession();
    const [wishlist, setWishlist] = useLocalStorage<Product[]>('giftpulse-wishlist', []);
    const [categoryScores, setCategoryScores] = useLocalStorage<Record<string, number>>('giftpulse-scores', {});
    const [rejectedIds, setRejectedIds] = useLocalStorage<string[]>('giftpulse-rejected', []);
    const [assignments, setAssignments] = useLocalStorage<Record<string, string>>('giftpulse-assignments', {});
    
    const [isSynced, setIsSynced] = useState(false);

    // Sync on Load
    useEffect(() => {
        if (session?.user?.id && !isSynced) {
            fetch('/api/user/wishlist')
                .then(res => res.json())
                .then(dbWishlist => {
                    if (Array.isArray(dbWishlist)) {
                        setWishlist(prev => {
                            const combined = [...prev, ...dbWishlist];
                            const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
                            return unique;
                        });
                    }
                })
                .catch(err => console.error("Wishlist sync error", err));

            // Potentially sync assignments here too if we had a backend for it
            setIsSynced(true);
        }
    }, [session, isSynced, setWishlist]);

    const addToWishlist = async (product: Product) => {
        if (wishlist.some(p => p.id === product.id)) return;
        
        setWishlist(prev => [...prev, product]);

        if (session?.user?.id) {
            try {
                await fetch('/api/user/wishlist', {
                    method: 'POST',
                    body: JSON.stringify(product)
                });
            } catch (e) {
                console.error("Failed to save to DB", e);
            }
        }
    };

    const removeFromWishlist = async (id: string) => {
        setWishlist(prev => prev.filter(p => p.id !== id));
        
        // Also remove assignment if exists
        if (assignments[id]) {
            const newAssignments = { ...assignments };
            delete newAssignments[id];
            setAssignments(newAssignments);
        }

        if (session?.user?.id) {
            try {
                await fetch(`/api/user/wishlist?id=${id}`, { method: 'DELETE' });
            } catch (e) {
                console.error("Failed to delete from DB", e);
            }
        }
    };

    const clearWishlist = async () => {
        setWishlist([]);
        setAssignments({});

        if (session?.user?.id) {
            try {
                await fetch('/api/user/wishlist?clear=true', { method: 'DELETE' });
            } catch (e) {
                console.error("Failed to clear DB wishlist", e);
            }
        }
    };

    const updateCategoryScores = async (newScores: Record<string, number>) => {
        setCategoryScores(newScores);
        if (session?.user?.id) {
            try {
                await fetch('/api/user/preferences', {
                    method: 'POST',
                    body: JSON.stringify({ preferences: newScores })
                });
            } catch (e) {
                console.error("Failed to sync scores", e);
            }
        }
    };

    const assignItem = (productId: string, person: string) => {
        setAssignments(prev => ({
            ...prev,
            [productId]: person
        }));
    };

    return (
        <UserDataContext.Provider value={{
            wishlist,
            categoryScores,
            rejectedIds,
            assignments,
            setRejectedIds,
            addToWishlist,
            removeFromWishlist,
            clearWishlist,
            updateCategoryScores,
            assignItem
        }}>
            {children}
        </UserDataContext.Provider>
    );
}

export function useUserData() {
    const context = useContext(UserDataContext);
    if (context === undefined) {
        throw new Error('useUserData must be used within a UserDataProvider');
    }
    return context;
}
