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

        const assignments: Record<string, string> = {};

        const products: Product[] = wishlistItems.map(item => {
            if (item.assignee) {
                assignments[item.productId] = item.assignee;
            }
            return {
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
            };
        });

        return NextResponse.json({ products, assignments });
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
        const body = await request.json();
        const product: Product = body.product || body;
        const assignee: string | undefined = body.assignee;

        const savedItem = await prisma.wishlistItem.upsert({
            where: {
                userId_productId: {
                    userId: session.user.id,
                    productId: product.id
                }
            },
            update: assignee !== undefined ? { assignee } : {},
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
                reviews: product.reviews,
                assignee: assignee
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
    const tag = searchParams.get('tag');

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!productId && !isClear && !tag) {
        return NextResponse.json({ error: 'Missing ID, tag, or clear flag' }, { status: 400 });
    }

    try {
        if (isClear) {
            // Bulk Delete
            await prisma.wishlistItem.deleteMany({
                where: {
                    userId: session.user.id
                }
            });
        } else if (tag) {
            // Unassign Tag
            await prisma.wishlistItem.updateMany({
                where: {
                    userId: session.user.id,
                    assignee: tag
                },
                data: { assignee: null }
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
