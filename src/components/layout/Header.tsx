'use client';

// Videlix AI - Header Component

import Link from 'next/link';
import { Languages, Moon, RotateCcw, Shield, LogIn, LogOut, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePipelineStore } from '@/lib/store/pipelineStore';
import { useAuth } from '@/hooks/useAuth';

export function Header() {
    const { language, setLanguage, resetPipeline } = usePipelineStore();
    const { user, loading, signOut } = useAuth();

    const toggleLanguage = () => {
        setLanguage(language === 'vi' ? 'en' : 'vi');
    };

    return (
        <header className="h-16 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
                <Link href="/" className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">V</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold text-white">Videlix AI</h1>
                        <p className="text-xs text-zinc-500 hidden sm:block">
                            {language === 'vi'
                                ? 'Từ ý tưởng đến kịch bản trong 4 bước'
                                : 'From idea to script in 4 steps'}
                        </p>
                    </div>
                </Link>
            </div>

            <div className="flex items-center gap-2">
                {/* Language Toggle */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleLanguage}
                    className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                    <Languages className="w-4 h-4 mr-2" />
                    {language === 'vi' ? 'VI' : 'EN'}
                </Button>

                {/* Reset Pipeline */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetPipeline}
                    className="hidden sm:flex text-zinc-400 hover:text-red-400 hover:bg-zinc-800"
                >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {language === 'vi' ? 'Bắt đầu lại' : 'Reset'}
                </Button>

                <div className="w-px h-6 bg-zinc-800 mx-2" />

                {/* Auth Controls */}
                {loading ? (
                    <div className="w-8 h-8 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
                    </div>
                ) : user ? (
                    <>
                        {/* Admin Link - Only for admins */}
                        {user.isAdmin && (
                            <Link href="/admin">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-zinc-400 hover:text-blue-400 hover:bg-zinc-800"
                                >
                                    <Shield className="w-4 h-4 mr-2" />
                                    Admin
                                </Button>
                            </Link>
                        )}

                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-lg border border-zinc-800">
                            <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <User className="w-3 h-3 text-blue-400" />
                            </div>
                            <span className="text-xs text-zinc-300 max-w-[100px] truncate">
                                {user.displayName || user.email?.split('@')[0]}
                            </span>
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => signOut()}
                            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                            title="Sign out"
                        >
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </>
                ) : (
                    <>
                        <Link href="/auth/login">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                            >
                                {language === 'vi' ? 'Đăng nhập' : 'Sign In'}
                            </Button>
                        </Link>
                        <Link href="/auth/register">
                            <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-500 text-white border-0"
                            >
                                <LogIn className="w-4 h-4 mr-2" />
                                {language === 'vi' ? 'Đăng ký' : 'Sign Up'}
                            </Button>
                        </Link>
                    </>
                )}

                {/* Dark mode indicator */}
                <div className="hidden sm:flex items-center gap-1 text-zinc-500 text-xs ml-2">
                    <Moon className="w-3 h-3" />
                </div>
            </div>
        </header>
    );
}
