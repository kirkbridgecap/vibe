import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { category, action } = body;

        if (!category || !action) {
            return NextResponse.json({ error: 'Missing category or action' }, { status: 400 });
        }

        if (action === 'like') {
            await prisma.categoryScore.upsert({
                where: {
                    userId_category: {
                        userId: session.user.id,
                        category: category
                    }
                },
                update: { likes: { increment: 1 } },
                create: {
                    userId: session.user.id,
                    category: category,
                    score: 1.0,
                    likes: 1,
                    dislikes: 0
                }
            });
        } else if (action === 'dislike') {
            await prisma.categoryScore.upsert({
                where: {
                    userId_category: {
                        userId: session.user.id,
                        category: category
                    }
                },
                update: { dislikes: { increment: 1 } },
                create: {
                    userId: session.user.id,
                    category: category,
                    score: 1.0,
                    likes: 0,
                    dislikes: 1
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to sync preferences", error);
        return NextResponse.json({ error: 'Database Error' }, { status: 500 });
    }
}
