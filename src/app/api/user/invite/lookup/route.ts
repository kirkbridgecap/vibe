import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { inviteCode } = await request.json();

    if (!inviteCode || inviteCode.length < 6) {
        return NextResponse.json({ error: 'Invalid Code' }, { status: 400 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { inviteCode },
            select: {
                id: true,
                name: true,
                image: true,
                // Check if already friends or if I sent a request
                friends: { where: { friendId: session.user.id } },
                sentRequests: { where: { receiverId: session.user.id } }, // Did THEY send ME one?
                receivedRequests: { where: { receiverId: session.user.id } } // Did I send THEM one? Wait. 
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (user.id === session.user.id) {
            return NextResponse.json({ error: 'You cannot friend yourself' }, { status: 400 });
        }

        // Check connection status
        // 1. Is Friend?
        const isFriend = await prisma.friendship.findFirst({
            where: { userId: session.user.id, friendId: user.id }
        });

        // 2. Did I send THEM a request? (My sent, their received)
        const mySentRequest = await prisma.friendRequest.findFirst({
            where: { senderId: session.user.id, receiverId: user.id, status: 'PENDING' }
        });

        // 3. Did THEY send ME a request? (Their sent, my received)
        const theirSentRequest = await prisma.friendRequest.findFirst({
            where: { senderId: user.id, receiverId: session.user.id, status: 'PENDING' }
        });


        const result = {
            id: user.id,
            name: user.name,
            image: user.image,
            connectionStatus: isFriend ? 'FRIEND'
                : mySentRequest ? 'REQUEST_SENT'
                    : theirSentRequest ? 'REQUEST_RECEIVED'
                        : 'NONE'
        };

        return NextResponse.json(result);

    } catch (error) {
        console.error("Invite lookup failed", error);
        return NextResponse.json({ error: 'Lookup Failed' }, { status: 500 });
    }
}
