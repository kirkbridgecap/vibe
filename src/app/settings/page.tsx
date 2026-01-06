'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, LogOut, User as UserIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function SettingsPage() {
    const { data: session } = useSession();
    const router = useRouter();

    if (!session) {
        return (
            <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold">Sign In Required</h1>
                    <p className="text-zinc-400">You must be signed in to access settings.</p>
                    <Link
                        href="/"
                        className="inline-block bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-zinc-200 transition-colors"
                    >
                        Go Home
                    </Link>
                </div>
            </div>
        );
    }

    const handleDeleteAccount = async () => {
        if (!confirm("Are you ABSOLUTELY sure? This action cannot be undone. This will permanently delete your account, wishlist, and all data.")) {
            return;
        }

        try {
            const res = await fetch('/api/user/delete', { method: 'DELETE' });

            if (res.ok) {
                await signOut({ callbackUrl: '/' });
            } else {
                const data = await res.json();
                alert(data.error || "Failed to delete account");
            }
        } catch (error) {
            console.error("Delete account error:", error);
            alert("An unexpected error occurred.");
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-4 pb-24">
            {/* Header */}
            <header className="flex items-center gap-4 mb-8 pt-2">
                <Link href="/" className="p-2 -ml-2 hover:bg-zinc-900 rounded-full transition-colors text-zinc-400 hover:text-white">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="text-xl font-bold">Settings</h1>
            </header>

            <div className="max-w-md mx-auto space-y-8">
                {/* Profile Section */}
                <section className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-zinc-800 overflow-hidden relative border-2 border-zinc-700">
                            {session.user?.image ? (
                                <Image src={session.user.image} alt={session.user.name || 'User'} fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xl font-bold text-zinc-500">
                                    <UserIcon size={24} />
                                </div>
                            )}
                        </div>
                        <div>
                            <h2 className="font-bold text-lg">{session.user?.name}</h2>
                            <p className="text-sm text-zinc-500">{session.user?.email}</p>
                        </div>
                    </div>
                </section>

                {/* Account Actions */}
                <section className="space-y-4">
                    <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider px-2">Account</h3>

                    <button
                        onClick={() => signOut()}
                        className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl p-4 flex items-center gap-3 transition-colors text-zinc-200"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </section>

                {/* Danger Zone */}
                <section className="space-y-4 pt-8">
                    <h3 className="text-sm font-semibold text-red-500 uppercase tracking-wider px-2">Danger Zone</h3>

                    <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 space-y-4">
                        <div>
                            <h4 className="font-bold text-red-500 mb-1">Delete Account</h4>
                            <p className="text-sm text-zinc-400 leading-relaxed">
                                Permanently remove your Personal data, Wishlist, and Friend connections. This action is not reversible.
                            </p>
                        </div>
                        <button
                            onClick={handleDeleteAccount}
                            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            <Trash2 size={18} />
                            Delete My Account
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}
