'use client';

// Videlix AI - Header Component

import Link from 'next/link';
import { Languages, Moon, RotateCcw, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePipelineStore } from '@/lib/store/pipelineStore';

export function Header() {
    const { language, setLanguage, resetPipeline } = usePipelineStore();

    const toggleLanguage = () => {
        setLanguage(language === 'vi' ? 'en' : 'vi');
    };

    return (
        <header className="h-16 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">V</span>
                </div>
                <div>
                    <h1 className="text-lg font-semibold text-white">Videlix AI</h1>
                    <p className="text-xs text-zinc-500">
                        {language === 'vi'
                            ? 'Từ ý tưởng đến kịch bản trong 4 bước'
                            : 'From idea to script in 4 steps'}
                    </p>
                </div>
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
                    className="text-zinc-400 hover:text-red-400 hover:bg-zinc-800"
                >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {language === 'vi' ? 'Bắt đầu lại' : 'Reset'}
                </Button>

                {/* Admin Link */}
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

                {/* Dark mode indicator */}
                <div className="flex items-center gap-1 text-zinc-500 text-xs">
                    <Moon className="w-3 h-3" />
                    <span>Dark</span>
                </div>
            </div>
        </header>
    );
}
