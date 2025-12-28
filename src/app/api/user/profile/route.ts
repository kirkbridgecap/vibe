import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

function generateInviteCode() {
    // 6 character alphanumeric, simple
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Format: ABC-123 ish (but actually just 6 chars, let's do 3-3 with dash for readability in UI, but storage as 6 or 7?)
    // Let's store pure 6 chars, format in UI.
    return code;
}

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        let user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, name: true, image: true, email: true, inviteCode: true }
        });

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Lazy generation of Invite Code
        if (!user.inviteCode) {
            let unique = false;
            let newCode = '';

            // Retry loop for uniqueness
            while (!unique) {
                newCode = generateInviteCode();
                const existing = await prisma.user.findUnique({ where: { inviteCode: newCode } });
                if (!existing) unique = true;
            }

            user = await prisma.user.update({
                where: { id: session.user.id },
                data: { inviteCode: newCode },
                select: {
                    id: true,
                    name: true,
                    image: true,
                    email: true,
                    inviteCode: true,
                    receivedRequests: {
                        where: { status: 'PENDING' },
                        select: {
                            id: true,
                            sender: {
                                select: { id: true, name: true, image: true }
                            }
                        }
                    },
                    friends: {
                        select: {
                            friend: {
                                select: { id: true, name: true, image: true }
                            }
                        }
                    }
                }
            });
        } else {
            // Re-fetch with relations if we didn't update just now
            user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: {
                    id: true,
                    name: true,
                    image: true,
                    email: true,
                    inviteCode: true,
                    receivedRequests: {
                        where: { status: 'PENDING' },
                        select: {
                            id: true,
                            sender: {
                                select: { id: true, name: true, image: true }
                            }
                        }
                    },
                    friends: {
                        select: {
                            friend: {
                                select: { id: true, name: true, image: true }
                            }
                        }
                    }
                }
            });
        }

        return NextResponse.json(user);

    } catch (error) {
        console.error("Profile fetch failed", error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
