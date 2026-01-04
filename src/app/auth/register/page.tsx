'use client';

// Videlix AI - Registration Screen
// User signup with email verification

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, User, ArrowRight, Loader2, Camera } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { Button } from '@/components/ui/button';
import { signUp } from '@/lib/firebase/auth';
import {
    validateEmail,
    validatePassword,
    validatePasswordMatch
} from '@/lib/firebase/authErrors';

export default function RegisterPage() {
    const router = useRouter();

    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setPhotoPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate display name
        if (!displayName.trim()) {
            setError('Please enter your name');
            return;
        }

        // Validate email
        const emailError = validateEmail(email);
        if (emailError) {
            setError(emailError);
            return;
        }

        // Validate password
        const passwordError = validatePassword(password);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        // Validate password match
        const matchError = validatePasswordMatch(password, confirmPassword);
        if (matchError) {
            setError(matchError);
            return;
        }

        setLoading(true);

        try {
            const result = await signUp(email, password, displayName);

            if (!result.success) {
                if (result.emailExists) {
                    setError('User already exists. Sign in?');
                    // Redirect to login after delay
                    setTimeout(() => {
                        router.push(`/auth/login?email=${encodeURIComponent(email)}`);
                    }, 2000);
                    return;
                }
                setError(result.error || 'Registration failed');
                return;
            }

            // Success - redirect to verification
            router.push(`/auth/verify?email=${encodeURIComponent(email)}`);
        } catch (err) {
            setError('Something went wrong. Please try again');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Create Account"
            subtitle="Join Videlix AI and start creating"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Error Message */}
                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Profile Photo Upload (UI only) */}
                <div className="flex justify-center">
                    <label className="cursor-pointer group">
                        <div className="relative w-20 h-20 rounded-full bg-zinc-800 border-2 border-dashed border-zinc-700 group-hover:border-blue-500 transition-colors overflow-hidden">
                            {photoPreview ? (
                                <img
                                    src={photoPreview}
                                    alt="Profile preview"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Camera className="w-6 h-6 text-zinc-500 group-hover:text-blue-400 transition-colors" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="text-xs text-white">Upload</span>
                            </div>
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            className="hidden"
                        />
                    </label>
                </div>

                {/* Display Name */}
                <div className="space-y-2">
                    <label htmlFor="name" className="text-sm text-zinc-400">
                        Full Name
                    </label>
                    <div className="relative">
                        <input
                            id="name"
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="John Doe"
                            disabled={loading}
                            autoComplete="name"
                            className="w-full px-4 py-3 pl-11 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 disabled:opacity-50 transition-all duration-200"
                        />
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    </div>
                </div>

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
                    <label htmlFor="password" className="text-sm text-zinc-400">
                        Password
                    </label>
                    <PasswordInput
                        id="password"
                        value={password}
                        onChange={setPassword}
                        placeholder="At least 6 characters"
                        disabled={loading}
                        autoComplete="new-password"
                    />
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm text-zinc-400">
                        Confirm Password
                    </label>
                    <PasswordInput
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        placeholder="Repeat your password"
                        disabled={loading}
                        autoComplete="new-password"
                    />
                </div>

                {/* Submit Button */}
                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/25"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            Create Account
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                    )}
                </Button>

                {/* Login Link */}
                <p className="text-center text-sm text-zinc-400">
                    Already have an account?{' '}
                    <Link
                        href="/auth/login"
                        className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                    >
                        Sign in
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
}
