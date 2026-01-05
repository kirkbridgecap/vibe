'use client';

import { SessionProvider } from "next-auth/react";
import { UserDataProvider } from "@/context/UserDataContext";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <UserDataProvider>
                {children}
            </UserDataProvider>
        </SessionProvider>
    );
}
