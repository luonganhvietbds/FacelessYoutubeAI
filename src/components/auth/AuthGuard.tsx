'use client';

// Videlix AI - Auth Guard Component
// Protects routes requiring authentication

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { subscribeToVerifiedAuth, AuthUser } from '@/lib/firebase/auth';

interface AuthGuardProps {
    children: ReactNode;
    requireVerified?: boolean;
    requireAdmin?: boolean;
    fallbackPath?: string;
}

export function AuthGuard({
    children,
    requireVerified = true,
    requireAdmin = false,
    fallbackPath = '/auth/login'
}: AuthGuardProps) {
    const router = useRouter();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = subscribeToVerifiedAuth((authUser, requiresVerification) => {
            if (!authUser) {
                if (requiresVerification) {
                    // User logged in but not verified
                    router.push('/auth/verify');
                } else {
                    // No user logged in
                    router.push(fallbackPath);
                }
                return;
            }

            // Check email verification
            if (requireVerified && !authUser.emailVerified) {
                router.push('/auth/verify');
                return;
            }

            // Check admin requirement
            if (requireAdmin && !authUser.isAdmin) {
                router.push('/');
                return;
            }

            setUser(authUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router, requireVerified, requireAdmin, fallbackPath]);

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-zinc-500 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    // Not authorized
    if (!user) {
        return null;
    }

    // Authorized
    return <>{children}</>;
}
