import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface UserProfile {
    id: string;
    name: string;
    email: string;
    image?: string;
    inviteCode?: string;
    receivedRequests?: { id: string; sender: { id: string; name: string; image?: string } }[];
    friends?: { friend: { id: string; name: string; image?: string } }[];
}

export function useProfile() {
    const { data: session } = useSession();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (session?.user?.id && !profile) {
            setLoading(true);
            fetch('/api/user/profile')
                .then(res => res.json())
                .then(data => {
                    if (!data.error) setProfile(data);
                })
                .catch(err => console.error("Profile sync error", err))
                .finally(() => setLoading(false));
        }
    }, [session, profile]);

    return { profile, loading };
}
