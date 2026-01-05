'use client';

// Videlix AI - Step 2: Outline Creation Panel

import { useState, useEffect } from 'react';
import { List, Sparkles, ArrowRight, ArrowLeft, GripVertical, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePipelineStore } from '@/lib/store/pipelineStore';
import { RegenerateButton } from '@/components/controls/RegenerateButton';
import { useAuth } from '@/hooks/useAuth';
import { generateContent } from '@/lib/services/generateService';
import { OutlineSection } from '@/types';

export function OutlineStep() {
    const {
        language,
        profileId,
        topic,
        ideas,
        selectedIdeaId,
        outline,
        setOutline,
        updateOutlineSection,
        isGenerating,
        setIsGenerating,
        setError,
        setCurrentStep
    } = usePipelineStore();

    const { user } = useAuth();
    const selectedIdea = ideas.find(i => i.id === selectedIdeaId);
    const [editingSection, setEditingSection] = useState<string | null>(null);

    const handleGenerate = async (modifier: string = 'default') => {
        if (!profileId || !selectedIdea) return;

        setIsGenerating(true);
        setError(null);

        try {
            const result = await generateContent<OutlineSection[]>({
                step: 'outline',
                profileId,
                language,
                topic,
                previousContent: { selectedIdea },
                modifier,
            });

            if (result.success && result.data) {
                setOutline(result.data);
            } else {
                setError(result.error || (language === 'vi' ? 'Có lỗi xảy ra' : 'An error occurred'));
            }
        } catch (error) {
            setError(language === 'vi' ? 'Không thể kết nối server' : 'Failed to connect to server');
        } finally {
            setIsGenerating(false);
        }
    };

    // Auto-generate on mount if no outline
    useEffect(() => {
        if (outline.length === 0 && selectedIdea && profileId) {
            handleGenerate();
        }
    }, []);

    const handlePointChange = (sectionId: string, pointIndex: number, value: string) => {
        const section = outline.find(s => s.id === sectionId);
        if (!section) return;

        const newPoints = [...section.points];
        newPoints[pointIndex] = value;
        updateOutlineSection(sectionId, { points: newPoints });
    };

    const handleAddPoint = (sectionId: string) => {
        const section = outline.find(s => s.id === sectionId);
        if (!section) return;

        updateOutlineSection(sectionId, {
            points: [...section.points, '']
        });
    };

    const handleRemovePoint = (sectionId: string, pointIndex: number) => {
        const section = outline.find(s => s.id === sectionId);
        if (!section) return;

        const newPoints = section.points.filter((_, i) => i !== pointIndex);
        updateOutlineSection(sectionId, { points: newPoints });
    };

    const handleProceed = () => {
        if (outline.length > 0) {
            setCurrentStep('script');
        }
    };

    const handleBack = () => {
        setCurrentStep('idea');
    };

    return (
        <div className="space-y-6">
            {/* Selected Idea Summary */}
            {selectedIdea && (
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                            <List className="w-4 h-4 text-blue-500" />
                            {language === 'vi' ? 'Ý tưởng đã chọn' : 'Selected Idea'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-white font-medium">{selectedIdea.title}</p>
                        <p className="text-sm text-zinc-400 mt-1">{selectedIdea.hook}</p>
                    </CardContent>
                </Card>
            )}

            {/* Generate / Regenerate Controls */}
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
                    {outline.length === 0 ? (
                        <Button
                            onClick={() => handleGenerate()}
                            disabled={isGenerating}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            {isGenerating
                                ? (language === 'vi' ? 'Đang tạo...' : 'Generating...')
                                : (language === 'vi' ? 'Tạo dàn ý' : 'Generate Outline')}
                        </Button>
                    ) : (
                        <RegenerateButton
                            onRegenerate={handleGenerate}
                            isLoading={isGenerating}
                        />
                    )}
                </div>
            </div>

            {/* Outline Sections */}
            {outline.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-zinc-400">
                        {language === 'vi' ? 'Dàn ý (có thể chỉnh sửa):' : 'Outline (editable):'}
                    </h3>

                    <div className="space-y-3">
                        {outline.map((section, sectionIndex) => (
                            <Card key={section.id} className="bg-zinc-900 border-zinc-800">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <GripVertical className="w-4 h-4 text-zinc-600" />
                                            <span className="w-6 h-6 rounded bg-zinc-700 flex items-center justify-center text-xs text-zinc-300">
                                                {sectionIndex + 1}
                                            </span>
                                            <input
                                                type="text"
                                                value={section.title}
                                                onChange={(e) => updateOutlineSection(section.id, { title: e.target.value })}
                                                className="bg-transparent border-none text-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1"
                                            />
                                        </div>
                                        {section.duration && (
                                            <span className="text-xs text-zinc-500">{section.duration}</span>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {section.points.map((point, pointIndex) => (
                                        <div key={pointIndex} className="flex items-start gap-2">
                                            <span className="text-zinc-600 mt-2">•</span>
                                            <Textarea
                                                value={point}
                                                onChange={(e) => handlePointChange(section.id, pointIndex, e.target.value)}
                                                className="flex-1 min-h-[40px] bg-zinc-800 border-zinc-700 text-zinc-300 text-sm resize-none"
                                                rows={1}
                                            />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemovePoint(section.id, pointIndex)}
                                                className="text-zinc-500 hover:text-red-400 p-1"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleAddPoint(section.id)}
                                        className="text-zinc-500 hover:text-blue-400 text-xs"
                                    >
                                        <Plus className="w-3 h-3 mr-1" />
                                        {language === 'vi' ? 'Thêm điểm' : 'Add point'}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Proceed Button */}
                    <div className="flex justify-end pt-4">
                        <Button
                            onClick={handleProceed}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {language === 'vi' ? 'Tiếp tục tạo Kịch bản' : 'Continue to Script'}
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
