'use client';

// Videlix AI - Main Application Page

import { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { usePipelineStore } from '@/lib/store/pipelineStore';
import { Header } from '@/components/layout/Header';
import { StepIndicator } from '@/components/pipeline/StepIndicator';
import { ProfileSelector } from '@/components/controls/ProfileSelector';
import { IdeaStep } from '@/components/pipeline/IdeaStep';
import { OutlineStep } from '@/components/pipeline/OutlineStep';
import { ScriptStep } from '@/components/pipeline/ScriptStep';
import { MetadataStep } from '@/components/pipeline/MetadataStep';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export default function Home() {
  const { currentStep, error, setError, language } = usePipelineStore();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'idea':
        return <IdeaStep />;
      case 'outline':
        return <OutlineStep />;
      case 'script':
        return <ScriptStep />;
      case 'metadata':
        return <MetadataStep />;
      default:
        return <IdeaStep />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <Header />

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border-b border-red-500/30 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step Indicator */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 px-6">
        <StepIndicator />
      </div>

      {/* Main Content - 2 Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Controls */}
        <aside className="w-80 border-r border-zinc-800 bg-zinc-900/30 flex flex-col">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-6">
              {/* Profile Selector */}
              <ProfileSelector />

              <Separator className="bg-zinc-800" />

              {/* Step Info */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-zinc-300">
                  {language === 'vi' ? 'Bước hiện tại' : 'Current Step'}
                </h3>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-400">
                    {currentStep === 'idea' && (
                      language === 'vi'
                        ? 'Nhập chủ đề và tạo 5 ý tưởng video. Chọn ý tưởng tốt nhất để tiếp tục.'
                        : 'Enter a topic and generate 5 video ideas. Select the best one to continue.'
                    )}
                    {currentStep === 'outline' && (
                      language === 'vi'
                        ? 'Xem và chỉnh sửa dàn ý cho video. Thêm hoặc xóa các điểm theo ý muốn.'
                        : 'Review and edit the video outline. Add or remove points as needed.'
                    )}
                    {currentStep === 'script' && (
                      language === 'vi'
                        ? 'Xem kịch bản chi tiết. Chuyển sang tab Chỉnh sửa để sửa nội dung.'
                        : 'Review the detailed script. Switch to Edit tab to modify content.'
                    )}
                    {currentStep === 'metadata' && (
                      language === 'vi'
                        ? 'Hoàn thiện tiêu đề, mô tả và tags. Sao chép để sử dụng trên YouTube.'
                        : 'Finalize title, description and tags. Copy to use on YouTube.'
                    )}
                  </p>
                </div>
              </div>

              <Separator className="bg-zinc-800" />

              {/* Tips */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-zinc-300">
                  {language === 'vi' ? 'Mẹo' : 'Tips'}
                </h3>
                <div className="text-xs text-zinc-500 space-y-2">
                  <p>💡 {language === 'vi'
                    ? 'Sử dụng nút "Tạo lại" với các tùy chọn để tinh chỉnh kết quả'
                    : 'Use "Regenerate" with options to fine-tune results'}
                  </p>
                  <p>💾 {language === 'vi'
                    ? 'Tiến trình được tự động lưu vào trình duyệt'
                    : 'Progress is automatically saved to browser'}
                  </p>
                  <p>🌐 {language === 'vi'
                    ? 'Chuyển đổi ngôn ngữ bất cứ lúc nào'
                    : 'Switch language anytime'}
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>
        </aside>

        {/* Right Panel - Output Area */}
        <main className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 max-w-4xl mx-auto">
              {renderCurrentStep()}
            </div>
          </ScrollArea>
        </main>
      </div>
    </div>
  );
}
