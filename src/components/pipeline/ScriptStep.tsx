'use client';

// Videlix AI - Step 3: Script Writing Panel

import { useState, useEffect } from 'react';
import { FileText, Sparkles, ArrowRight, ArrowLeft, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePipelineStore } from '@/lib/store/pipelineStore';
import { RegenerateButton } from '@/components/controls/RegenerateButton';
import { useAuth } from '@/hooks/useAuth';
import { generateContent } from '@/lib/services/generateService';
import { ScriptContent } from '@/types';

export function ScriptStep() {
    const {
        language,
        profileId,
        topic,
        outline,
        script,
        setScript,
        updateScript,
        isGenerating,
        setIsGenerating,
        setError,
        setCurrentStep
    } = usePipelineStore();

    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('preview');

    const handleGenerate = async (modifier: string = 'default') => {
        if (!profileId || outline.length === 0) return;

        setIsGenerating(true);
        setError(null);

        try {
            const result = await generateContent<ScriptContent>({
                step: 'script',
                profileId,
                language,
                topic,
                previousContent: { outline },
                modifier,
            }, user?.uid);

            if (result.success && result.data) {
                setScript(result.data);
            } else {
                setError(result.error || (language === 'vi' ? 'Có lỗi xảy ra' : 'An error occurred'));
            }
        } catch (error) {
            setError(language === 'vi' ? 'Không thể kết nối server' : 'Failed to connect to server');
        } finally {
            setIsGenerating(false);
        }
    };

    // Auto-generate on mount if no script
    useEffect(() => {
        if (!script && outline.length > 0 && profileId) {
            handleGenerate();
        }
    }, []);

    const handleProceed = () => {
        if (script) {
            setCurrentStep('metadata');
        }
    };

    const handleBack = () => {
        setCurrentStep('outline');
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
                    {!script ? (
                        <Button
                            onClick={() => handleGenerate()}
                            disabled={isGenerating}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            {isGenerating
                                ? (language === 'vi' ? 'Đang tạo...' : 'Generating...')
                                : (language === 'vi' ? 'Tạo kịch bản' : 'Generate Script')}
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
            {isGenerating && !script && (
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="py-12 text-center">
                        <div className="w-12 h-12 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto mb-4" />
                        <p className="text-zinc-400">
                            {language === 'vi'
                                ? 'Đang viết kịch bản chi tiết...'
                                : 'Writing detailed script...'}
                        </p>
                        <p className="text-xs text-zinc-500 mt-2">
                            {language === 'vi'
                                ? 'Quá trình này có thể mất 30-60 giây'
                                : 'This may take 30-60 seconds'}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Script Content */}
            {script && (
                <div className="space-y-4">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="bg-zinc-800 border-zinc-700">
                            <TabsTrigger value="preview" className="data-[state=active]:bg-zinc-700">
                                {language === 'vi' ? 'Xem trước' : 'Preview'}
                            </TabsTrigger>
                            <TabsTrigger value="edit" className="data-[state=active]:bg-zinc-700">
                                <Edit3 className="w-3 h-3 mr-1" />
                                {language === 'vi' ? 'Chỉnh sửa' : 'Edit'}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="preview" className="mt-4">
                            <ScrollArea className="h-[500px]">
                                <Card className="bg-zinc-900 border-zinc-800">
                                    <CardContent className="p-6 space-y-6">
                                        {/* Intro */}
                                        <div>
                                            <h3 className="text-sm font-medium text-blue-400 mb-2">
                                                {language === 'vi' ? 'MỞ ĐẦU' : 'INTRO'}
                                            </h3>
                                            <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                                {script.intro}
                                            </p>
                                        </div>

                                        {/* Sections */}
                                        {script.sections.map((section, index) => (
                                            <div key={index} className="border-t border-zinc-800 pt-6">
                                                <h3 className="text-sm font-medium text-emerald-400 mb-2">
                                                    {section.heading}
                                                </h3>
                                                <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                                    {section.content}
                                                </p>
                                                {section.visualNotes && (
                                                    <p className="text-xs text-zinc-500 mt-2 italic">
                                                        📹 {section.visualNotes}
                                                    </p>
                                                )}
                                            </div>
                                        ))}

                                        {/* Outro */}
                                        <div className="border-t border-zinc-800 pt-6">
                                            <h3 className="text-sm font-medium text-purple-400 mb-2">
                                                {language === 'vi' ? 'KẾT THÚC' : 'OUTRO'}
                                            </h3>
                                            <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                                {script.outro}
                                            </p>
                                        </div>

                                        {/* Call to Action */}
                                        <div className="bg-zinc-800 rounded-lg p-4">
                                            <h3 className="text-sm font-medium text-yellow-400 mb-2">
                                                {language === 'vi' ? 'KÊU GỌI HÀNH ĐỘNG' : 'CALL TO ACTION'}
                                            </h3>
                                            <p className="text-zinc-300">
                                                {script.callToAction}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </ScrollArea>
                        </TabsContent>

                        <TabsContent value="edit" className="mt-4">
                            <Card className="bg-zinc-900 border-zinc-800">
                                <CardContent className="p-6 space-y-6">
                                    {/* Intro Edit */}
                                    <div>
                                        <label className="text-sm font-medium text-blue-400 block mb-2">
                                            {language === 'vi' ? 'MỞ ĐẦU' : 'INTRO'}
                                        </label>
                                        <Textarea
                                            value={script.intro}
                                            onChange={(e) => updateScript({ intro: e.target.value })}
                                            className="min-h-[100px] bg-zinc-800 border-zinc-700 text-zinc-300"
                                        />
                                    </div>

                                    {/* Sections Edit */}
                                    {script.sections.map((section, index) => (
                                        <div key={index} className="border-t border-zinc-800 pt-6">
                                            <input
                                                type="text"
                                                value={section.heading}
                                                onChange={(e) => {
                                                    const newSections = [...script.sections];
                                                    newSections[index] = { ...section, heading: e.target.value };
                                                    updateScript({ sections: newSections });
                                                }}
                                                className="text-sm font-medium text-emerald-400 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded px-1 mb-2 w-full"
                                            />
                                            <Textarea
                                                value={section.content}
                                                onChange={(e) => {
                                                    const newSections = [...script.sections];
                                                    newSections[index] = { ...section, content: e.target.value };
                                                    updateScript({ sections: newSections });
                                                }}
                                                className="min-h-[120px] bg-zinc-800 border-zinc-700 text-zinc-300"
                                            />
                                        </div>
                                    ))}

                                    {/* Outro Edit */}
                                    <div className="border-t border-zinc-800 pt-6">
                                        <label className="text-sm font-medium text-purple-400 block mb-2">
                                            {language === 'vi' ? 'KẾT THÚC' : 'OUTRO'}
                                        </label>
                                        <Textarea
                                            value={script.outro}
                                            onChange={(e) => updateScript({ outro: e.target.value })}
                                            className="min-h-[80px] bg-zinc-800 border-zinc-700 text-zinc-300"
                                        />
                                    </div>

                                    {/* CTA Edit */}
                                    <div className="border-t border-zinc-800 pt-6">
                                        <label className="text-sm font-medium text-yellow-400 block mb-2">
                                            {language === 'vi' ? 'KÊU GỌI HÀNH ĐỘNG' : 'CALL TO ACTION'}
                                        </label>
                                        <Textarea
                                            value={script.callToAction}
                                            onChange={(e) => updateScript({ callToAction: e.target.value })}
                                            className="min-h-[60px] bg-zinc-800 border-zinc-700 text-zinc-300"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    {/* Proceed Button */}
                    <div className="flex justify-end pt-4">
                        <Button
                            onClick={handleProceed}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {language === 'vi' ? 'Tiếp tục tạo Metadata' : 'Continue to Metadata'}
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
