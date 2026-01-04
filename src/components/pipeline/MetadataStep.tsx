'use client';

// Videlix AI - Step 4: Metadata & Thumbnail Panel

import { useState, useEffect } from 'react';
import { Tags, Sparkles, ArrowLeft, Copy, Check, Download, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePipelineStore } from '@/lib/store/pipelineStore';
import { RegenerateButton } from '@/components/controls/RegenerateButton';
import { useAuth } from '@/hooks/useAuth';
import { generateContent } from '@/lib/services/generateService';
import { VideoMetadata } from '@/types';

export function MetadataStep() {
    const {
        language,
        profileId,
        topic,
        script,
        metadata,
        setMetadata,
        updateMetadata,
        isGenerating,
        setIsGenerating,
        setError,
        setCurrentStep,
        resetPipeline
    } = usePipelineStore();

    const { user } = useAuth();
    const [copied, setCopied] = useState<string | null>(null);

    const handleGenerate = async (modifier: string = 'default') => {
        if (!profileId || !script) return;

        setIsGenerating(true);
        setError(null);

        try {
            const result = await generateContent<VideoMetadata>({
                step: 'metadata',
                profileId,
                language,
                topic,
                previousContent: { script },
                modifier,
            }, user?.uid);

            if (result.success && result.data) {
                setMetadata(result.data);
            } else {
                setError(result.error || (language === 'vi' ? 'Có lỗi xảy ra' : 'An error occurred'));
            }
        } catch (error) {
            setError(language === 'vi' ? 'Không thể kết nối server' : 'Failed to connect to server');
        } finally {
            setIsGenerating(false);
        }
    };

    // Auto-generate on mount if no metadata
    useEffect(() => {
        if (!metadata && script && profileId) {
            handleGenerate();
        }
    }, []);

    const handleCopy = async (text: string, field: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(field);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleBack = () => {
        setCurrentStep('script');
    };

    const handleExport = () => {
        if (!metadata || !script) return;

        const exportData = {
            title: metadata.title,
            description: metadata.description,
            tags: metadata.tags,
            thumbnailPrompt: metadata.thumbnailPrompt,
            estimatedDuration: metadata.estimatedDuration,
            script: {
                intro: script.intro,
                sections: script.sections,
                outro: script.outro,
                callToAction: script.callToAction,
            }
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `videlix-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex items-center justify-between">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBack}
                    className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {language === 'vi' ? 'Quay lại' : 'Back'}
                </Button>

                <div className="flex items-center gap-2">
                    {!metadata ? (
                        <Button
                            onClick={() => handleGenerate()}
                            disabled={isGenerating}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            {isGenerating
                                ? (language === 'vi' ? 'Đang tạo...' : 'Generating...')
                                : (language === 'vi' ? 'Tạo metadata' : 'Generate Metadata')}
                        </Button>
                    ) : (
                        <RegenerateButton
                            onRegenerate={handleGenerate}
                            isLoading={isGenerating}
                        />
                    )}
                </div>
            </div>

            {/* Loading State */}
            {isGenerating && !metadata && (
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="py-12 text-center">
                        <div className="w-12 h-12 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto mb-4" />
                        <p className="text-zinc-400">
                            {language === 'vi'
                                ? 'Đang tạo metadata và SEO...'
                                : 'Generating metadata and SEO...'}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Metadata Content */}
            {metadata && (
                <div className="space-y-4">
                    {/* Title */}
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-zinc-300">
                                    {language === 'vi' ? 'Tiêu đề Video' : 'Video Title'}
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopy(metadata.title, 'title')}
                                    className="text-zinc-400 hover:text-white"
                                >
                                    {copied === 'title' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <input
                                type="text"
                                value={metadata.title}
                                onChange={(e) => updateMetadata({ title: e.target.value })}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-zinc-500 mt-1">
                                {metadata.title.length}/60 {language === 'vi' ? 'ký tự' : 'characters'}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Description */}
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-zinc-300">
                                    {language === 'vi' ? 'Mô tả' : 'Description'}
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopy(metadata.description, 'description')}
                                    className="text-zinc-400 hover:text-white"
                                >
                                    {copied === 'description' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={metadata.description}
                                onChange={(e) => updateMetadata({ description: e.target.value })}
                                className="min-h-[120px] bg-zinc-800 border-zinc-700 text-zinc-300"
                            />
                        </CardContent>
                    </Card>

                    {/* Tags */}
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-zinc-300">
                                    Tags
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopy(metadata.tags.join(', '), 'tags')}
                                    className="text-zinc-400 hover:text-white"
                                >
                                    {copied === 'tags' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {metadata.tags.map((tag, index) => (
                                    <Badge
                                        key={index}
                                        variant="secondary"
                                        className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                                    >
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Thumbnail Prompt */}
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-zinc-300">
                                    {language === 'vi' ? 'Prompt tạo Thumbnail' : 'Thumbnail Prompt'}
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopy(metadata.thumbnailPrompt, 'thumbnail')}
                                    className="text-zinc-400 hover:text-white"
                                >
                                    {copied === 'thumbnail' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={metadata.thumbnailPrompt}
                                onChange={(e) => updateMetadata({ thumbnailPrompt: e.target.value })}
                                className="min-h-[80px] bg-zinc-800 border-zinc-700 text-zinc-300"
                            />
                            <p className="text-xs text-zinc-500 mt-2">
                                {language === 'vi'
                                    ? '💡 Sử dụng prompt này với Midjourney, DALL-E hoặc công cụ AI tạo hình ảnh'
                                    : '💡 Use this prompt with Midjourney, DALL-E or other AI image generators'}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Duration */}
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardContent className="py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-zinc-400">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-sm">
                                        {language === 'vi' ? 'Thời lượng ước tính' : 'Estimated Duration'}
                                    </span>
                                </div>
                                <span className="text-white font-medium">{metadata.estimatedDuration}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Completion Actions */}
                    <Card className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border-emerald-500/30">
                        <CardContent className="py-6">
                            <div className="text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                                    <Check className="w-8 h-8 text-emerald-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-white">
                                        {language === 'vi' ? 'Hoàn thành!' : 'Complete!'}
                                    </h3>
                                    <p className="text-sm text-zinc-400 mt-1">
                                        {language === 'vi'
                                            ? 'Bạn đã hoàn thành quy trình 4 bước. Xuất kịch bản hoặc bắt đầu dự án mới.'
                                            : 'You have completed the 4-step pipeline. Export your script or start a new project.'}
                                    </p>
                                </div>
                                <div className="flex items-center justify-center gap-3">
                                    <Button
                                        onClick={handleExport}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        {language === 'vi' ? 'Xuất JSON' : 'Export JSON'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={resetPipeline}
                                        className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                                    >
                                        {language === 'vi' ? 'Dự án mới' : 'New Project'}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
