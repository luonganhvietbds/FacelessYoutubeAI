'use client';

// Videlix AI - Auth Layout Component
// Shared layout for authentication screens

import { ReactNode } from 'react';
import Link from 'next/link';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4">
            {/* Background Pattern */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-blue-500/5 to-emerald-500/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-purple-500/5 to-blue-500/5 rounded-full blur-3xl" />
            </div>

            {/* Auth Card */}
            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
                            <span className="text-white font-bold text-2xl">V</span>
                        </div>
                        <h1 className="text-xl font-bold text-white">Videlix AI</h1>
                    </Link>
                </div>

                {/* Card */}
                <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 shadow-2xl">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-semibold text-white">{title}</h2>
                        {subtitle && (
                            <p className="text-zinc-400 mt-2 text-sm">{subtitle}</p>
                        )}
                    </div>

                    {/* Content */}
                    {children}
                </div>

                {/* Footer */}
                <p className="text-center text-zinc-600 text-xs mt-6">
                    © 2026 Videlix AI. All rights reserved.
                </p>
            </div>
        </div>
    );
}
