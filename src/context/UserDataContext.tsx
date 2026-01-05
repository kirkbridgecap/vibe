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
    deleteAssignee: (person: string) => Promise<void>;
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
                .then(data => {
                    // Handle new response format { products, assignments }
                    const products = Array.isArray(data) ? data : data.products;
                    const dbAssignments = data.assignments || {};

                    if (Array.isArray(products)) {
                        setWishlist(prev => {
                            const combined = [...prev, ...products];
                            const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
                            return unique;
                        });
                    }

                    if (dbAssignments) {
                        setAssignments(prev => ({ ...prev, ...dbAssignments }));
                    }
                })
                .catch(err => console.error("Wishlist sync error", err));

            setIsSynced(true);
        }
    }, [session, isSynced, setWishlist, setAssignments]);

    const addToWishlist = async (product: Product) => {
        if (wishlist.some(p => p.id === product.id)) return;

        setWishlist(prev => [...prev, product]);

        if (session?.user?.id) {
            try {
                // Send just product, API handles missing assignee (no update)
                await fetch('/api/user/wishlist', {
                    method: 'POST',
                    body: JSON.stringify({ product })
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

    const assignItem = async (productId: string, person: string) => {
        setAssignments(prev => ({
            ...prev,
            [productId]: person
        }));

        if (session?.user?.id) {
            const product = wishlist.find(p => p.id === productId);
            if (product) {
                try {
                    await fetch('/api/user/wishlist', {
                        method: 'POST',
                        body: JSON.stringify({ product, assignee: person })
                    });
                } catch (e) {
                    console.error("Failed to assign item", e);
                }
            }
        }
    };

    const deleteAssignee = async (person: string) => {
        // Remove assignment from local state
        setAssignments(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(key => {
                if (next[key] === person) {
                    delete next[key];
                }
            });
            return next;
        });

        if (session?.user?.id) {
            try {
                await fetch(`/api/user/wishlist?tag=${encodeURIComponent(person)}`, {
                    method: 'DELETE'
                });
            } catch (e) {
                console.error("Failed to delete tag", e);
            }
        }
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
            assignItem,
            deleteAssignee
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
