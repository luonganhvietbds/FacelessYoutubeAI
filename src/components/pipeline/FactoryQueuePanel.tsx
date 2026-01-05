'use client';

// Videlix AI - Factory Queue Panel
// Displays queue status, progress bars, and countdown timers

import { usePipelineStore } from '@/lib/store/pipelineStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Factory, Pause, Play, X, Check, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FactoryQueuePanel() {
    const {
        language,
        factory,
        pauseFactory,
        resumeFactory,
        stopFactoryMode,
        batchProgress,
    } = usePipelineStore();

    if (factory.mode !== 'factory') return null;

    const formatTime = (ms: number): string => {
        const seconds = Math.ceil(ms / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'complete':
                return <Check className="w-4 h-4 text-green-400" />;
            case 'processing':
                return <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />;
            case 'cooling':
                return <Clock className="w-4 h-4 text-yellow-400" />;
            case 'error':
                return <X className="w-4 h-4 text-red-400" />;
            default:
                return <div className="w-4 h-4 rounded-full border-2 border-zinc-600" />;
        }
    };

    const getStatusText = (status: string): string => {
        const isVi = language === 'vi';
        switch (status) {
            case 'complete':
                return isVi ? 'Hoàn thành' : 'Complete';
            case 'processing':
                return isVi ? 'Đang xử lý...' : 'Processing...';
            case 'cooling':
                return isVi ? 'Đang chờ...' : 'Cooling down...';
            case 'error':
                return isVi ? 'Lỗi' : 'Error';
            default:
                return isVi ? 'Chờ' : 'Waiting';
        }
    };

    const completedCount = factory.queue.filter(i => i.status === 'complete').length;
    const totalCount = factory.queue.length;

    return (
        <Card className="bg-orange-950/30 border-orange-500/30 mb-6">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-orange-300 flex items-center gap-2">
                        <Factory className="w-4 h-4" />
                        {language === 'vi' ? 'Factory Mode' : 'Factory Mode'}
                        <Badge className="bg-orange-500/20 text-orange-400">
                            {completedCount}/{totalCount}
                        </Badge>
                    </CardTitle>

                    <div className="flex items-center gap-2">
                        {factory.isActive && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={factory.isPaused ? resumeFactory : pauseFactory}
                                className="text-orange-400 hover:text-orange-300"
                            >
                                {factory.isPaused ? (
                                    <>
                                        <Play className="w-4 h-4 mr-1" />
                                        {language === 'vi' ? 'Tiếp tục' : 'Resume'}
                                    </>
                                ) : (
                                    <>
                                        <Pause className="w-4 h-4 mr-1" />
                                        {language === 'vi' ? 'Tạm dừng' : 'Pause'}
                                    </>
                                )}
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={stopFactoryMode}
                            className="text-red-400 hover:text-red-300"
                        >
                            <X className="w-4 h-4 mr-1" />
                            {language === 'vi' ? 'Dừng' : 'Stop'}
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                {/* Cooldown Timer */}
                {factory.cooldownRemaining > 0 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-yellow-300 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                {language === 'vi' ? 'Thời gian chờ giữa các ý tưởng' : 'Cooldown between ideas'}
                            </span>
                            <span className="text-yellow-400 font-mono">
                                {formatTime(factory.cooldownRemaining)}
                            </span>
                        </div>
                        <Progress
                            value={(1 - factory.cooldownRemaining / 30000) * 100}
                            className="h-1 mt-2 bg-yellow-900"
                        />
                    </div>
                )}

                {/* Batch Progress */}
                {batchProgress && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                        <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-blue-300">
                                {language === 'vi' ? 'Xử lý batch' : 'Batch Processing'}
                            </span>
                            <span className="text-blue-400">
                                {batchProgress.itemsProcessed}/{batchProgress.totalItems}
                            </span>
                        </div>
                        <Progress
                            value={(batchProgress.itemsProcessed / batchProgress.totalItems) * 100}
                            className="h-2 bg-blue-900"
                        />
                        {batchProgress.isDelaying && (
                            <p className="text-xs text-blue-400 mt-1">
                                {language === 'vi'
                                    ? `Đợi 2s trước batch tiếp theo...`
                                    : `Waiting 2s before next batch...`}
                            </p>
                        )}
                    </div>
                )}

                {/* Queue Items */}
                <div className="space-y-2">
                    {factory.queue.map((item, index) => (
                        <div
                            key={item.ideaId}
                            className={cn(
                                "flex items-center gap-3 p-2 rounded-lg transition-all",
                                item.status === 'processing' && "bg-orange-500/10",
                                item.status === 'complete' && "bg-green-500/10",
                                item.status === 'error' && "bg-red-500/10"
                            )}
                        >
                            {/* Status Icon */}
                            <div className="flex-shrink-0">
                                {getStatusIcon(item.status)}
                            </div>

                            {/* Idea Info */}
                            <div className="flex-1 min-w-0">
                                <p className={cn(
                                    "text-sm font-medium truncate",
                                    item.status === 'complete' && "text-green-400",
                                    item.status === 'processing' && "text-orange-400",
                                    item.status === 'error' && "text-red-400",
                                    item.status === 'waiting' && "text-zinc-400"
                                )}>
                                    #{index + 1} {item.ideaTitle}
                                </p>
                                <p className="text-xs text-zinc-500">
                                    {getStatusText(item.status)}
                                    {item.currentStep && item.status === 'processing' &&
                                        ` - ${item.currentStep}`}
                                </p>
                            </div>

                            {/* Progress */}
                            {item.status === 'processing' && (
                                <div className="w-20">
                                    <Progress value={item.progress} className="h-1" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
