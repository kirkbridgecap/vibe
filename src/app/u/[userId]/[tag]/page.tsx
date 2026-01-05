import { prisma } from "@/lib/prisma";
import { Product } from "@/types";
import Image from "next/image";
import { ExternalLink } from "lucide-react";

interface Props {
    params: Promise<{
        userId: string;
        tag: string;
    }>;
}

async function getSharedItems(userId: string, tag: string) {
    const items = await prisma.wishlistItem.findMany({
        where: {
            userId,
            assignee: decodeURIComponent(tag)
        }
    });

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, image: true }
    });

    return { items, user };
}

export default async function SharedWishlistPage({ params }: Props) {
    const { userId, tag } = await params;
    const decodedTag = decodeURIComponent(tag);
    const { items, user } = await getSharedItems(userId, decodedTag);

    if (!user) {
        return (
            <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
                <p>User not found.</p>
            </div>
        );
    }

    const totalPrice = items.reduce((sum, item) => sum + item.price, 0);

    return (
        <div className="h-[100dvh] overflow-y-auto bg-zinc-950 text-white p-6 pb-20 w-full flex flex-col items-center">
            <div className="w-full max-w-2xl">
                <header className="mb-8 flex flex-col items-center text-center space-y-4 pt-10">
                    <div className="w-20 h-20 rounded-full bg-zinc-800 overflow-hidden relative border-4 border-zinc-900 shadow-xl">
                        {user.image ? (
                            <Image src={user.image} alt={user.name || 'User'} fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl font-bold bg-gradient-to-br from-brand to-purple-600">
                                {user.name?.[0] || 'V'}
                            </div>
                        )}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold mb-2">
                            {decodedTag}&apos;s Wishlist
                        </h1>
                        <p className="text-zinc-400">
                            Curated by {user.name} • {items.length} items • ${totalPrice.toFixed(2)}
                        </p>
                    </div>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {items.length === 0 ? (
                        <div className="col-span-full text-center text-zinc-500 py-12 bg-zinc-900/50 rounded-2xl border border-zinc-800 border-dashed">
                            <p>No items found in this list yet.</p>
                        </div>
                    ) : (
                        items.map(item => (
                            <div key={item.id} className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-colors group">
                                <div className="aspect-square bg-white relative p-4">
                                    <Image
                                        src={item.imageUrl}
                                        alt={item.title}
                                        fill
                                        className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                                <div className="p-4">
                                    <h3 className="font-medium text-sm line-clamp-2 mb-2 h-10">{item.title}</h3>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-brand font-bold">${item.price}</span>
                                        <a
                                            href={item.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs bg-white text-black px-3 py-1.5 rounded-full font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-1"
                                        >
                                            View <ExternalLink size={10} />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <footer className="mt-12 text-center text-zinc-600 text-sm pb-10">
                    <p>Made with Vibe</p>
                </footer>
            </div>
        </div>
    );
}
