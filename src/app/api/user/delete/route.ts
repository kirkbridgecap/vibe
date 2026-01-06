import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: Request) {
    // 1. Check Auth (Must check for null session AND null user.id)
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const userId = session.user.id;

        // 2. Delete User
        // Because of 'onDelete: Cascade' in Schema, this single call removes:
        // - Accounts, Sessions
        // - WishlistItems
        // - CategoryScores, RejectedItems
        // - Friendships, FriendRequests
        await prisma.user.delete({
            where: { id: userId }
        });

        console.log(`[AUDIT] User ${userId} deleted their account.`);

        return NextResponse.json({ success: true, message: "Account deleted successfully." });
    } catch (error) {
        console.error("Failed to delete user account:", error);
        return NextResponse.json(
            { error: 'Database error occurred while deleting account.' },
            { status: 500 }
        );
    }
}
