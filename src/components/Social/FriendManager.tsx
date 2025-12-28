"use client";

import React, { useState } from 'react';
import { Search, UserPlus, Check, X, User, Copy } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';

interface UserResult {
    id: string;
    name: string;
    image?: string;
    connectionStatus: 'FRIEND' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'NONE';
}

export function FriendManager() {
    const { profile } = useProfile();
    const [inviteCode, setInviteCode] = useState('');
    const [result, setResult] = useState<UserResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteCode.trim() || inviteCode.length < 6) return;

        setLoading(true);
        setError('');
        setResult(null);
        try {
            const res = await fetch('/api/user/invite/lookup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inviteCode })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Lookup failed');
            setResult(data);
        } catch (err: any) {
            setError(err.message || 'Failed to find user');
            setResult(null);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (targetId: string, action: 'SEND_REQUEST' | 'ACCEPT_REQUEST' | 'REJECT_REQUEST', requestId?: string) => {
        try {
            const res = await fetch('/api/user/friends/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, targetUserId: targetId, requestId })
            });

            if (res.ok) {
                // Optimistic update
                const statusMap = {
                    'SEND_REQUEST': 'REQUEST_SENT',
                    'ACCEPT_REQUEST': 'FRIEND',
                    'REJECT_REQUEST': 'NONE'
                };

                if (result && result.id === targetId) {
                    setResult({ ...result, connectionStatus: statusMap[action] as any });
                }

                // Force refresh via window reload or context (simple refresh for now)
                window.location.reload();
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="w-full bg-zinc-900 rounded-xl space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <UserPlus size={20} className="text-brand" />
                Find Friends
            </h3>

            {profile?.inviteCode && (
                <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700/50 mb-6">
                    <p className="text-xs text-zinc-400 uppercase tracking-widest mb-2 font-semibold">Your Invite Code</p>
                    <div className="flex items-center justify-between bg-black/40 p-3 rounded-md border border-zinc-800">
                        <span className="text-xl font-mono font-bold text-white tracking-widest">{profile.inviteCode}</span>
                        <button
                            onClick={() => navigator.clipboard.writeText(profile.inviteCode!)}
                            className="text-zinc-400 hover:text-white transition-colors"
                            title="Copy to clipboard"
                        >
                            <Copy size={18} />
                        </button>
                    </div>
                    <p className="text-xs text-zinc-500 mt-2">Share this code with friends so they can add you.</p>
                </div>
            )}

            {/* Pending Requests Section */}
            {profile?.receivedRequests && profile.receivedRequests.length > 0 && (
                <div className="mb-6">
                    <h4 className="text-sm font-semibold text-yellow-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Check size={16} /> Pending Requests ({profile.receivedRequests.length})
                    </h4>
                    <div className="space-y-2">
                        {profile.receivedRequests.map(req => (
                            <div key={req.id} className="p-3 bg-zinc-800/80 rounded-lg flex items-center justify-between border border-yellow-500/20">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-zinc-700 overflow-hidden">
                                        {req.sender.image ? (
                                            <img src={req.sender.image} alt={req.sender.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={20} className="text-zinc-400 m-auto mt-2.5" />
                                        )}
                                    </div>
                                    <div>
                                        <span className="text-white font-medium block">{req.sender.name}</span>
                                        <span className="text-xs text-zinc-500">Sent you an invite</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleAction(req.sender.id, 'ACCEPT_REQUEST', req.id)}
                                        className="p-2 bg-green-500 text-white rounded-full hover:bg-green-400 transition-colors"
                                        title="Accept"
                                    >
                                        <Check size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleAction(req.sender.id, 'REJECT_REQUEST', req.id)}
                                        className="p-2 bg-zinc-700 text-zinc-400 rounded-full hover:bg-zinc-600 transition-colors"
                                        title="Reject"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="h-px bg-zinc-800 my-4" />
                </div>
            )}

            <div className="h-px bg-zinc-800 my-4" />

            <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-2">Add a Friend</h4>

            <form onSubmit={handleLookup} className="relative flex gap-2">
                <div className="relative flex-1">
                    <input
                        type="text"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        placeholder="Enter Code (e.g. KEV-8X)"
                        className="w-full bg-zinc-800 text-white px-4 py-3 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50 font-mono tracking-widest uppercase"
                        maxLength={10}
                    />
                    <Search className="absolute left-3 top-3.5 text-zinc-400" size={18} />
                </div>
                <button
                    type="submit"
                    disabled={loading || inviteCode.length < 3}
                    className="bg-brand text-black font-bold px-4 rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Find
                </button>
            </form>

            {loading && <div className="text-center text-zinc-500 text-sm">Searching directory...</div>}
            {error && <div className="text-center text-red-400 text-sm bg-red-400/10 py-2 rounded-lg border border-red-400/20">{error}</div>}

            {result && (
                <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 flex items-center justify-between mb-6 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden">
                            {result.image ? (
                                <img src={result.image} alt={result.name} className="w-full h-full object-cover" />
                            ) : (
                                <User size={20} className="text-zinc-400" />
                            )}
                        </div>
                        <div>
                            <span className="text-white font-medium block">{result.name}</span>
                            <span className="text-xs text-zinc-500 font-mono">CODE MATCHED</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {result.connectionStatus === 'NONE' && (
                            <button
                                onClick={() => handleAction(result.id, 'SEND_REQUEST')}
                                className="px-4 py-2 bg-brand text-black text-xs font-bold rounded-full hover:brightness-110 transition-all shadow-lg shadow-brand/20"
                            >
                                Send Request
                            </button>
                        )}
                        {result.connectionStatus === 'REQUEST_SENT' && (
                            <span className="text-zinc-500 text-xs font-mono px-2 py-2 bg-zinc-800 rounded-full">Request Sent</span>
                        )}
                        {result.connectionStatus === 'FRIEND' && (
                            <span className="text-green-400 text-xs font-bold px-2 flex items-center gap-1">
                                <Check size={14} /> Friends
                            </span>
                        )}
                        {result.connectionStatus === 'REQUEST_RECEIVED' && (
                            <button
                                onClick={() => handleAction(result.id, 'ACCEPT_REQUEST')}
                                className="px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-full hover:bg-green-400 transition-colors"
                            >
                                Accept
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="h-px bg-zinc-800 my-4" />

            {/* Friends List */}
            <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-3">My Friends ({profile?.friends?.length || 0})</h4>
            {profile?.friends && profile.friends.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {profile.friends.map(f => (
                        <div key={f.friend.id} className="flex items-center gap-3 p-2 hover:bg-zinc-800/50 rounded-lg transition-colors group">
                            <div className="w-8 h-8 rounded-full bg-zinc-700 overflow-hidden">
                                {f.friend.image ? (
                                    <img src={f.friend.image} alt={f.friend.name} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={16} className="text-zinc-400 m-auto mt-2" />
                                )}
                            </div>
                            <span className="text-zinc-300 text-sm font-medium">{f.friend.name}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-zinc-600 text-xs italic">No friends yet. Add some above!</p>
            )}
        </div>
    );
}
