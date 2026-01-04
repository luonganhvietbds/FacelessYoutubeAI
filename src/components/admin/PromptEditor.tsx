'use client';

// Videlix AI - Profile Editor Component

import { useState } from 'react';
import { Save, RotateCcw, Eye, Code, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FirebaseProfile } from '@/lib/firebase/database';

interface PromptEditorProps {
    profile: FirebaseProfile;
    onChange: (updates: Partial<FirebaseProfile>) => void;
    onSave: () => void;
    saving: boolean;
}

const STEPS = ['idea', 'outline', 'script', 'metadata'] as const;
type Step = typeof STEPS[number];

const STEP_LABELS = {
    idea: { en: 'Idea Generation', vi: 'Tạo Ý Tưởng' },
    outline: { en: 'Outline', vi: 'Dàn Ý' },
    script: { en: 'Script', vi: 'Kịch Bản' },
    metadata: { en: 'Metadata', vi: 'Metadata' },
};

// Template variable detection
const TEMPLATE_VARS = ['{{TOPIC}}', '{{NUM_IDEAS}}', '{{STYLE}}', '{{DURATION}}', '{{TONE}}'];

function highlightVariables(text: string): string {
    let result = text;
    TEMPLATE_VARS.forEach(v => {
        result = result.replace(new RegExp(v.replace(/[{}]/g, '\\$&'), 'g'),
            `<span class="text-blue-400 font-mono">${v}</span>`);
    });
    return result;
}

function countChars(text: string): { chars: number; words: number; lines: number } {
    return {
        chars: text.length,
        words: text.split(/\s+/).filter(Boolean).length,
        lines: text.split('\n').length,
    };
}

export function PromptEditor({ profile, onChange, onSave, saving }: PromptEditorProps) {
    const [activeStep, setActiveStep] = useState<Step>('idea');
    const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');

    const handlePromptChange = (step: Step, lang: 'en' | 'vi', value: string) => {
        onChange({
            prompts: {
                ...profile.prompts,
                [step]: {
                    ...profile.prompts[step],
                    [lang]: value,
                },
            },
        });
    };

    const currentPrompt = profile.prompts[activeStep];
    const enStats = countChars(currentPrompt.en);
    const viStats = countChars(currentPrompt.vi);

    return (
        <div className="space-y-4">
            {/* Step Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {STEPS.map((step) => (
                    <Button
                        key={step}
                        variant={activeStep === step ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveStep(step)}
                        className={cn(
                            activeStep === step
                                ? 'bg-blue-600'
                                : 'border-zinc-700 text-zinc-400 hover:text-white'
                        )}
                    >
                        {STEP_LABELS[step].vi}
                    </Button>
                ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        variant={viewMode === 'edit' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('edit')}
                        className={viewMode === 'edit' ? 'bg-zinc-700' : ''}
                    >
                        <Code className="w-4 h-4 mr-1" />
                        Edit
                    </Button>
                    <Button
                        variant={viewMode === 'preview' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('preview')}
                        className={viewMode === 'preview' ? 'bg-zinc-700' : ''}
                    >
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                    </Button>
                </div>
                <Button
                    onClick={onSave}
                    disabled={saving}
                    className="bg-emerald-600 hover:bg-emerald-700"
                >
                    {saving ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                        <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                </Button>
            </div>

            {/* Dual Language Editor */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* English */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="py-3 border-b border-zinc-800">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                                🇬🇧 English
                            </CardTitle>
                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                                <span>{enStats.chars} chars</span>
                                <span>•</span>
                                <span>{enStats.words} words</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {viewMode === 'edit' ? (
                            <Textarea
                                value={currentPrompt.en}
                                onChange={(e) => handlePromptChange(activeStep, 'en', e.target.value)}
                                className="min-h-[400px] bg-transparent border-0 rounded-none text-zinc-300 font-mono text-sm resize-none focus:ring-0"
                                placeholder="Enter English system prompt..."
                            />
                        ) : (
                            <div
                                className="p-4 min-h-[400px] text-zinc-300 text-sm whitespace-pre-wrap"
                                dangerouslySetInnerHTML={{ __html: highlightVariables(currentPrompt.en) }}
                            />
                        )}
                    </CardContent>
                </Card>

                {/* Vietnamese */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="py-3 border-b border-zinc-800">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                                🇻🇳 Tiếng Việt
                            </CardTitle>
                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                                <span>{viStats.chars} chars</span>
                                <span>•</span>
                                <span>{viStats.words} words</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {viewMode === 'edit' ? (
                            <Textarea
                                value={currentPrompt.vi}
                                onChange={(e) => handlePromptChange(activeStep, 'vi', e.target.value)}
                                className="min-h-[400px] bg-transparent border-0 rounded-none text-zinc-300 font-mono text-sm resize-none focus:ring-0"
                                placeholder="Nhập system prompt tiếng Việt..."
                            />
                        ) : (
                            <div
                                className="p-4 min-h-[400px] text-zinc-300 text-sm whitespace-pre-wrap"
                                dangerouslySetInnerHTML={{ __html: highlightVariables(currentPrompt.vi) }}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Template Variables Reference */}
            <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-zinc-500">Available variables:</span>
                        {TEMPLATE_VARS.map((v) => (
                            <Badge key={v} variant="secondary" className="bg-zinc-800 text-blue-400 font-mono text-xs">
                                {v}
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
