'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Heart } from 'lucide-react';
import { useUserData } from '@/context/UserDataContext';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function BottomNav() {
    const pathname = usePathname();
    const { wishlist } = useUserData();

    // Hide on public share pages
    if (pathname.startsWith('/u/')) return null;

    const navItems = [
        {
            name: 'Discover',
            href: '/',
            icon: Home
        },
        {
            name: 'Wishlist',
            href: '/wishlist',
            icon: Heart,
            badge: wishlist.length
        },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-6 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent pointer-events-none">
            <nav className="pointer-events-auto max-w-md mx-auto bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50 rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-around h-16 relative">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "relative flex flex-col items-center justify-center w-full h-full transition-colors",
                                    isActive ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-pill"
                                        className="absolute inset-0 bg-zinc-800/50"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}

                                <div className="relative z-10 flex flex-col items-center gap-1">
                                    <div className="relative">
                                        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                        {item.badge !== undefined && item.badge > 0 && (
                                            <span className="absolute -top-1 -right-2 bg-brand text-[10px] text-white font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border-2 border-zinc-900">
                                                {item.badge}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-medium">{item.name}</span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
