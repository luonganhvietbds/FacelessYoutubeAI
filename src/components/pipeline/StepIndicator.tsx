'use client';

// Videlix AI - Step Indicator Component

import { Check, Lightbulb, List, FileText, Tags } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePipelineStore } from '@/lib/store/pipelineStore';
import { PipelineStep, PIPELINE_STEPS, getStepIndex } from '@/types';

const iconMap = {
    Lightbulb,
    List,
    FileText,
    Tags,
};

export function StepIndicator() {
    const { currentStep, language, canProceedToStep, setCurrentStep } = usePipelineStore();
    const currentIndex = getStepIndex(currentStep);

    const handleStepClick = (step: PipelineStep) => {
        if (canProceedToStep(step)) {
            setCurrentStep(step);
        }
    };

    return (
        <div className="flex items-center justify-between w-full max-w-2xl mx-auto py-4">
            {PIPELINE_STEPS.map((step, index) => {
                const Icon = iconMap[step.icon as keyof typeof iconMap];
                const isCompleted = index < currentIndex;
                const isCurrent = index === currentIndex;
                const isClickable = canProceedToStep(step.id);

                return (
                    <div key={step.id} className="flex items-center">
                        {/* Step Circle */}
                        <button
                            onClick={() => handleStepClick(step.id)}
                            disabled={!isClickable}
                            className={cn(
                                "flex flex-col items-center gap-2 transition-all duration-300",
                                isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                            )}
                        >
                            <div
                                className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                                    isCompleted && "bg-emerald-500/20 border-2 border-emerald-500",
                                    isCurrent && "bg-blue-500/20 border-2 border-blue-500 ring-4 ring-blue-500/20",
                                    !isCompleted && !isCurrent && "bg-zinc-800 border-2 border-zinc-700"
                                )}
                            >
                                {isCompleted ? (
                                    <Check className="w-5 h-5 text-emerald-500" />
                                ) : (
                                    <Icon className={cn(
                                        "w-5 h-5",
                                        isCurrent ? "text-blue-500" : "text-zinc-500"
                                    )} />
                                )}
                            </div>

                            {/* Step Name */}
                            <span className={cn(
                                "text-xs font-medium",
                                isCompleted && "text-emerald-500",
                                isCurrent && "text-blue-500",
                                !isCompleted && !isCurrent && "text-zinc-500"
                            )}>
                                {step.name[language]}
                            </span>
                        </button>

                        {/* Connector Line */}
                        {index < PIPELINE_STEPS.length - 1 && (
                            <div
                                className={cn(
                                    "w-16 sm:w-24 h-0.5 mx-2 transition-all duration-300",
                                    index < currentIndex ? "bg-emerald-500" : "bg-zinc-700"
                                )}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
