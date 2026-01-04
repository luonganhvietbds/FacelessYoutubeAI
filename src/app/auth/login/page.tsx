'use client';

// Videlix AI - Login Screen
// Full authentication with email verification check

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowRight, Loader2 } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { Button } from '@/components/ui/button';
import { signIn } from '@/lib/firebase/auth';
import { validateEmail, validatePassword } from '@/lib/firebase/authErrors';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const prefillEmail = searchParams.get('email') || '';

    const [email, setEmail] = useState(prefillEmail);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate inputs
        const emailError = validateEmail(email);
        if (emailError) {
            setError(emailError);
            return;
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        setLoading(true);

        try {
            const result = await signIn(email, password);

            if (!result.success) {
                if (result.requiresVerification) {
                    // Redirect to verification page
                    router.push(`/auth/verify?email=${encodeURIComponent(email)}`);
                    return;
                }
                setError(result.error || 'Email or Password Incorrect');
                return;
            }

            // Success - redirect to admin
            router.push('/admin');
        } catch (err) {
            setError('Email or Password Incorrect');
        } finally {
            setLoading(false);
        }
    };

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

            {/* Password Input */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm text-zinc-400">
                        Password
                    </label>
                    <Link
                        href={`/auth/reset${email ? `?email=${encodeURIComponent(email)}` : ''}`}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        Forgot password?
                    </Link>
                </div>
                <PasswordInput
                    id="password"
                    value={password}
                    onChange={setPassword}
                    placeholder="Enter your password"
                    disabled={loading}
                    autoComplete="current-password"
                />
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
                        Sign In
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                )}
            </Button>

            {/* Register Link */}
            <p className="text-center text-sm text-zinc-400">
                Don't have an account?{' '}
                <Link
                    href="/auth/register"
                    className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                >
                    Create one
                </Link>
            </p>
        </form>
    );
}

function LoginFallback() {
    return (
        <div className="space-y-5">
            <div className="h-12 bg-zinc-800/50 rounded-xl animate-pulse" />
            <div className="h-12 bg-zinc-800/50 rounded-xl animate-pulse" />
            <div className="h-12 bg-zinc-800/50 rounded-xl animate-pulse" />
        </div>
    );
}

export default function LoginPage() {
    return (
        <AuthLayout
            title="Welcome Back"
            subtitle="Sign in to your account to continue"
        >
            <Suspense fallback={<LoginFallback />}>
                <LoginForm />
            </Suspense>
        </AuthLayout>
    );
}
