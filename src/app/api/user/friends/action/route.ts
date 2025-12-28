import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, targetUserId, requestId } = await request.json();

    try {
        if (action === 'SEND_REQUEST') {
            if (!targetUserId) throw new Error("Missing targetUserId");

            // Check existence
            const existing = await prisma.friendRequest.findUnique({
                where: {
                    senderId_receiverId: { senderId: session.user.id, receiverId: targetUserId }
                }
            });
            if (existing) return NextResponse.json({ error: 'Request already exists' }, { status: 400 });

            await prisma.friendRequest.create({
                data: {
                    senderId: session.user.id,
                    receiverId: targetUserId,
                    status: 'PENDING'
                }
            });
            return NextResponse.json({ success: true, status: 'REQUEST_SENT' });
        }

        if (action === 'ACCEPT_REQUEST') {
            if (!requestId) throw new Error("Missing requestId");

            const req = await prisma.friendRequest.findUnique({ where: { id: requestId } });
            if (!req || req.receiverId !== session.user.id) {
                return NextResponse.json({ error: 'Invalid Request' }, { status: 403 });
            }

            // Transaction: Update Request -> Create Friendship (Bi-directional)
            await prisma.$transaction([
                prisma.friendRequest.update({
                    where: { id: requestId },
                    data: { status: 'ACCEPTED' }
                }),
                prisma.friendship.create({
                    data: { userId: req.senderId, friendId: req.receiverId }
                }),
                // Symmetry for easier querying? Or just one row?
                // Let's do symmetrical rows so "my friends" is always simple query on userId
                prisma.friendship.create({
                    data: { userId: req.receiverId, friendId: req.senderId }
                })
            ]);

            return NextResponse.json({ success: true, status: 'FRIEND' });
        }

        if (action === 'REJECT_REQUEST') {
            if (!requestId) throw new Error("Missing requestId");
            // Just delete it or mark rejected? Delete allows re-request later.
            await prisma.friendRequest.delete({
                where: { id: requestId }
            });
            return NextResponse.json({ success: true, status: 'NONE' });
        }

        return NextResponse.json({ error: 'Invalid Action' }, { status: 400 });

    } catch (error) {
        console.error("Friend action failed", error);
        return NextResponse.json({ error: 'Action Failed' }, { status: 500 });
    }
}
