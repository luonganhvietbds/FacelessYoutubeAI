'use client';

// Videlix AI - Email Verification Screen
// Display verification status and resend option

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, RefreshCw, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import {
    getCurrentUser
} from '@/lib/firebase/auth';
import { sendEmailVerification } from 'firebase/auth';

function VerifyForm() {
    const searchParams = useSearchParams();
    const emailParam = searchParams.get('email') || '';

    const [email] = useState(emailParam);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');
    const [cooldown, setCooldown] = useState(0);

    // Cooldown timer
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const handleResend = async () => {
        if (cooldown > 0) return;

        setError('');
        setSending(true);
        setSent(false);

        try {
            const currentUser = getCurrentUser();

            if (currentUser) {
                await sendEmailVerification(currentUser);
                setSent(true);
                setCooldown(60);
            } else {
                setError('Please sign in to resend verification email');
            }
        } catch (err) {
            console.error('Resend error:', err);
            setError('Failed to send verification email. Please try again.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Mail className="w-10 h-10 text-blue-400" />
                </div>
            </div>

            {/* Message */}
            <div className="text-center space-y-2">
                <p className="text-zinc-300">
                    We've sent a verification email to:
                </p>
                <p className="text-white font-medium bg-zinc-800/50 px-4 py-2 rounded-lg inline-block">
                    {email || 'your email address'}
                </p>
                <p className="text-zinc-400 text-sm">
                    Click the link in the email to verify your account.
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
                    {error}
                </div>
            )}

            {/* Success Message */}
            {sent && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm text-center flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Verification email sent!
                </div>
            )}

            {/* Resend Button */}
            <Button
                onClick={handleResend}
                disabled={sending || cooldown > 0}
                variant="outline"
                className="w-full py-3 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
                {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                )}
                {cooldown > 0
                    ? `Resend in ${cooldown}s`
                    : 'Resend Verification Email'
                }
            </Button>

            {/* Tips */}
            <div className="bg-zinc-800/30 rounded-xl p-4 space-y-2">
                <p className="text-xs text-zinc-400 font-medium">Didn't receive the email?</p>
                <ul className="text-xs text-zinc-500 space-y-1">
                    <li>• Check your spam or junk folder</li>
                    <li>• Make sure {email || 'your email'} is correct</li>
                    <li>• Wait a few minutes and try resending</li>
                </ul>
            </div>

            {/* Back to Login */}
            <Link href="/auth/login">
                <Button
                    variant="ghost"
                    className="w-full text-zinc-400 hover:text-white"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Login
                </Button>
            </Link>
        </div>
    );
}

function VerifyFallback() {
    return (
        <div className="space-y-6">
            <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-zinc-800/50 animate-pulse" />
            </div>
            <div className="h-12 bg-zinc-800/50 rounded-xl animate-pulse" />
            <div className="h-12 bg-zinc-800/50 rounded-xl animate-pulse" />
        </div>
    );
}

export default function VerifyPage() {
    return (
        <AuthLayout
            title="Verify Your Email"
            subtitle="One last step to get started"
        >
            <Suspense fallback={<VerifyFallback />}>
                <VerifyForm />
            </Suspense>
        </AuthLayout>
    );
}
