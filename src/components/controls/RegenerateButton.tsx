'use client';

// Videlix AI - Regenerate Button with Options

import { useState } from 'react';
import { RefreshCw, ChevronDown, Minus, Plus, Laugh, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { usePipelineStore } from '@/lib/store/pipelineStore';

type Modifier = 'default' | 'shorter' | 'longer' | 'funnier' | 'professional';

interface RegenerateButtonProps {
    onRegenerate: (modifier: Modifier) => void;
    isLoading?: boolean;
    disabled?: boolean;
}

export function RegenerateButton({ onRegenerate, isLoading, disabled }: RegenerateButtonProps) {
    const { language } = usePipelineStore();
    const [showOptions, setShowOptions] = useState(false);

    const options: { id: Modifier; icon: typeof Minus; label: { en: string; vi: string } }[] = [
        { id: 'shorter', icon: Minus, label: { en: 'Shorter', vi: 'Ngắn hơn' } },
        { id: 'longer', icon: Plus, label: { en: 'Longer', vi: 'Dài hơn' } },
        { id: 'funnier', icon: Laugh, label: { en: 'Funnier', vi: 'Hài hước hơn' } },
        { id: 'professional', icon: Briefcase, label: { en: 'Professional', vi: 'Chuyên nghiệp' } },
    ];

    const handleRegenerate = (modifier: Modifier = 'default') => {
        onRegenerate(modifier);
        setShowOptions(false);
    };

    return (
        <div className="relative">
            <div className="flex items-center gap-1">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRegenerate('default')}
                    disabled={disabled || isLoading}
                    className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                >
                    <RefreshCw className={cn(
                        "w-4 h-4 mr-2",
                        isLoading && "animate-spin"
                    )} />
                    {language === 'vi' ? 'Tạo lại' : 'Regenerate'}
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowOptions(!showOptions)}
                    disabled={disabled || isLoading}
                    className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2"
                >
                    <ChevronDown className={cn(
                        "w-4 h-4 transition-transform",
                        showOptions && "rotate-180"
                    )} />
                </Button>
            </div>

            {showOptions && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-10 overflow-hidden">
                    {options.map(option => {
                        const Icon = option.icon;
                        return (
                            <button
                                key={option.id}
                                onClick={() => handleRegenerate(option.id)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
                            >
                                <Icon className="w-4 h-4 text-zinc-500" />
                                {option.label[language]}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
