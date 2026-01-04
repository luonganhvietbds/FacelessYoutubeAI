'use client';

// Videlix AI - Forgot Password Screen
// Password reset via email

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowLeft, Loader2, CheckCircle2, Send } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { resetPassword } from '@/lib/firebase/auth';
import { validateEmail } from '@/lib/firebase/authErrors';

function ResetForm() {
    const searchParams = useSearchParams();
    const prefillEmail = searchParams.get('email') || '';

    const [email, setEmail] = useState(prefillEmail);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const emailError = validateEmail(email);
        if (emailError) {
            setError(emailError);
            return;
        }

        setLoading(true);

        try {
            await resetPassword(email);
            setSent(true);
        } catch (err) {
            setSent(true);
        } finally {
            setLoading(false);
        }
    };

    // Success state
    if (sent) {
        return (
            <div className="space-y-6">
                {/* Icon */}
                <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    </div>
                </div>

                {/* Message */}
                <div className="text-center space-y-2">
                    <p className="text-zinc-300">
                        We've sent a password reset link to:
                    </p>
                    <p className="text-white font-medium bg-zinc-800/50 px-4 py-2 rounded-lg inline-block">
                        {email}
                    </p>
                    <p className="text-zinc-400 text-sm">
                        Click the link in the email to reset your password.
                    </p>
                </div>

                {/* Tips */}
                <div className="bg-zinc-800/30 rounded-xl p-4 space-y-2">
                    <p className="text-xs text-zinc-400 font-medium">Didn't receive the email?</p>
                    <ul className="text-xs text-zinc-500 space-y-1">
                        <li>• Check your spam or junk folder</li>
                        <li>• Make sure {email} is correct</li>
                        <li>• The link expires in 1 hour</li>
                    </ul>
                </div>

                {/* Back to Login */}
                <Link href="/auth/login">
                    <Button
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium rounded-xl transition-all duration-200"
                    >
                        Back to Sign In
                    </Button>
                </Link>
            </div>
        );
    }

    // Form state
    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Email Input */}
            <div className="space-y-2">
                <label htmlFor="email" className="text-sm text-zinc-400">
                    Email Address
                </label>
                <div className="relative">
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        disabled={loading}
                        autoComplete="email"
                        className="w-full px-4 py-3 pl-11 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 disabled:opacity-50 transition-all duration-200"
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                </div>
            </div>

            {/* Submit Button */}
            <Button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25"
            >
                {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Reset Link
                    </>
                )}
            </Button>

            {/* Back to Login */}
            <Link href="/auth/login">
                <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-zinc-400 hover:text-white"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Login
                </Button>
            </Link>
        </form>
    );
}

function ResetFallback() {
    return (
        <div className="space-y-5">
            <div className="h-12 bg-zinc-800/50 rounded-xl animate-pulse" />
            <div className="h-12 bg-zinc-800/50 rounded-xl animate-pulse" />
            <div className="h-12 bg-zinc-800/50 rounded-xl animate-pulse" />
        </div>
    );
}

export default function ResetPage() {
    return (
        <AuthLayout
            title="Reset Password"
            subtitle="Enter your email to receive a reset link"
        >
            <Suspense fallback={<ResetFallback />}>
                <ResetForm />
            </Suspense>
        </AuthLayout>
    );
}
