'use client';

// Videlix AI - Step 1: Idea Generation Panel

import { useState } from 'react';
import { Lightbulb, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePipelineStore } from '@/lib/store/pipelineStore';
import { RegenerateButton } from '@/components/controls/RegenerateButton';
import { useAuth } from '@/hooks/useAuth';
import { generateContent } from '@/lib/services/generateService';
import { VideoIdea } from '@/types';

export function IdeaStep() {
    const {
        language,
        profileId,
        topic,
        setTopic,
        ideas,
        setIdeas,
        selectedIdeaId,
        selectIdea,
        isGenerating,
        setIsGenerating,
        setError,
        setCurrentStep
    } = usePipelineStore();

    const { user } = useAuth();
    const [localTopic, setLocalTopic] = useState(topic);

    const handleGenerate = async (modifier: string = 'default') => {
        if (!profileId) {
            setError(language === 'vi'
                ? 'Vui lòng chọn phong cách video trước'
                : 'Please select a video style first');
            return;
        }

        if (!localTopic.trim()) {
            setError(language === 'vi'
                ? 'Vui lòng nhập chủ đề'
                : 'Please enter a topic');
            return;
        }

        setTopic(localTopic);
        setIsGenerating(true);
        setError(null);

        try {
            const result = await generateContent<VideoIdea[]>({
                step: 'idea',
                profileId,
                language,
                topic: localTopic,
                modifier,
            }, user?.uid);

            if (result.success && result.data) {
                setIdeas(result.data);
            } else {
                setError(result.error || (language === 'vi' ? 'Có lỗi xảy ra' : 'An error occurred'));
            }
        } catch (error) {
            setError(language === 'vi' ? 'Không thể kết nối server' : 'Failed to connect to server');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleProceed = () => {
        if (selectedIdeaId) {
            setCurrentStep('outline');
        }
    };

    return (
        <div className="space-y-6">
            {/* Topic Input */}
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-500" />
                        {language === 'vi' ? 'Chủ đề Video' : 'Video Topic'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea
                        value={localTopic}
                        onChange={(e) => setLocalTopic(e.target.value)}
                        placeholder={language === 'vi'
                            ? 'Nhập chủ đề hoặc từ khóa của video...\nVí dụ: "Cách tiết kiệm tiền cho sinh viên"'
                            : 'Enter your video topic or keyword...\nExample: "How to save money as a student"'}
                        className="min-h-[100px] bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 resize-none"
                    />

                    <div className="flex items-center justify-between">
                        <Button
                            onClick={() => handleGenerate()}
                            disabled={isGenerating || !localTopic.trim() || !profileId}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            {isGenerating
                                ? (language === 'vi' ? 'Đang tạo...' : 'Generating...')
                                : (language === 'vi' ? 'Tạo 5 ý tưởng' : 'Generate 5 Ideas')}
                        </Button>

                        {ideas.length > 0 && (
                            <RegenerateButton
                                onRegenerate={handleGenerate}
                                isLoading={isGenerating}
                                disabled={!profileId || !localTopic.trim()}
                            />
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Ideas List */}
            {ideas.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-zinc-400">
                        {language === 'vi' ? 'Chọn một ý tưởng:' : 'Select an idea:'}
                    </h3>

                    <div className="grid gap-3">
                        {ideas.map((idea, index) => (
                            <button
                                key={idea.id}
                                onClick={() => selectIdea(idea.id)}
                                className={cn(
                                    "w-full text-left p-4 rounded-lg border transition-all duration-200",
                                    selectedIdeaId === idea.id
                                        ? "border-blue-500 bg-blue-500/10"
                                        : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-medium text-sm",
                                        selectedIdeaId === idea.id
                                            ? "bg-blue-500 text-white"
                                            : "bg-zinc-700 text-zinc-400"
                                    )}>
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className={cn(
                                            "font-medium",
                                            selectedIdeaId === idea.id ? "text-blue-400" : "text-white"
                                        )}>
                                            {idea.title}
                                        </h4>
                                        <p className="text-sm text-zinc-400 mt-1">
                                            <span className="text-zinc-500">Hook: </span>{idea.hook}
                                        </p>
                                        <p className="text-sm text-zinc-500 mt-1">
                                            <span className="text-zinc-600">{language === 'vi' ? 'Góc nhìn' : 'Angle'}: </span>{idea.angle}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Proceed Button */}
                    {selectedIdeaId && (
                        <div className="flex justify-end pt-4">
                            <Button
                                onClick={handleProceed}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                {language === 'vi' ? 'Tiếp tục tạo Dàn ý' : 'Continue to Outline'}
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
