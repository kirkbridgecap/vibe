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
        const { preferences } = await request.json(); // Expected: Record<string, number>

        if (!preferences) {
            return NextResponse.json({ error: 'Missing preferences' }, { status: 400 });
        }

        const updates = Object.entries(preferences).map(([category, score]) => {
            return prisma.categoryScore.upsert({
                where: {
                    userId_category: {
                        userId: session.user.id,
                        category: category
                    }
                },
                update: { score: Number(score) },
                create: {
                    userId: session.user.id,
                    category: category,
                    score: Number(score)
                }
            });
        });

        await prisma.$transaction(updates);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to sync preferences", error);
        return NextResponse.json({ error: 'Database Error' }, { status: 500 });
    }
}
