import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Product } from '@/types';

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const wishlistItems = await prisma.wishlistItem.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' }
        });

        // Map back to Product type
        const products: Product[] = wishlistItems.map(item => ({
            id: item.productId,
            title: item.title,
            price: item.price,
            currency: item.currency,
            imageUrl: item.imageUrl,
            link: item.link,
            category: item.category,
            isBestSeller: item.isBestSeller,
            rating: item.rating || undefined,
            reviews: item.reviews || undefined,
        }));

        return NextResponse.json(products);
    } catch (error) {
        console.error("Failed to fetch wishlist", error);
        return NextResponse.json({ error: 'Database Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const product: Product = await request.json();

        // Upsert to avoid duplicates
        // Note: We use composite key or just simple create/fail?
        // Our schema has @@unique([userId, productId])

        const savedItem = await prisma.wishlistItem.upsert({
            where: {
                userId_productId: {
                    userId: session.user.id,
                    productId: product.id
                }
            },
            update: {}, // No updates needed if exists
            create: {
                userId: session.user.id,
                productId: product.id,
                title: product.title,
                price: product.price,
                currency: product.currency,
                imageUrl: product.imageUrl,
                link: product.link,
                category: product.category,
                isBestSeller: product.isBestSeller,
                rating: product.rating,
                reviews: product.reviews
            }
        });

        return NextResponse.json({ success: true, item: savedItem });
    } catch (error) {
        console.error("Failed to save wishlist item", error);
        return NextResponse.json({ error: 'Database Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');
    const isClear = searchParams.get('clear') === 'true';

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!productId && !isClear) {
        return NextResponse.json({ error: 'Missing ID or clear flag' }, { status: 400 });
    }

    try {
        if (isClear) {
            // Bulk Delete
            await prisma.wishlistItem.deleteMany({
                where: {
                    userId: session.user.id
                }
            });
        } else if (productId) {
            // Single Delete
            await prisma.wishlistItem.delete({
                where: {
                    userId_productId: {
                        userId: session.user.id,
                        productId: productId
                    }
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        // If id doesn't exist, prisma throws. We can ignore or return 404.
        console.error("Delete failed", error);
        return NextResponse.json({ success: true });
    }
}
