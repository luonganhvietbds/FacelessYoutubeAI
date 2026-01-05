// Videlix AI - Zustand Store with LocalStorage Persistence

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
    PipelineState,
    Language,
    PipelineStep,
    VideoIdea,
    OutlineSection,
    ScriptContent,
    VideoMetadata,
    FactoryState,
    FactoryQueueItem,
    BatchProgress,
    getStepIndex
} from '@/types';

const generateSessionId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const initialFactoryState: FactoryState = {
    mode: 'single',
    isActive: false,
    queue: [],
    currentIndex: 0,
    cooldownRemaining: 0,
    isPaused: false,
};

const initialState = {
    sessionId: generateSessionId(),
    language: 'vi' as Language,
    profileId: null as string | null,
    topic: '',
    currentStep: 'idea' as PipelineStep,
    ideas: [] as VideoIdea[],
    selectedIdeaId: null as string | null,
    selectedIdeaIds: [] as string[],
    outline: [] as OutlineSection[],
    script: null as ScriptContent | null,
    metadata: null as VideoMetadata | null,
    factory: initialFactoryState,
    batchProgress: null as BatchProgress | null,
    isGenerating: false,
    error: null as string | null,
};

export const usePipelineStore = create<PipelineState>()(
    persist(
        (set, get) => ({
            ...initialState,

            setLanguage: (language: Language) => set({ language }),

            setProfile: (profileId: string) => set({ profileId }),

            setTopic: (topic: string) => set({ topic }),

            setCurrentStep: (currentStep: PipelineStep) => set({ currentStep }),

            setIdeas: (ideas: VideoIdea[]) => set({ ideas }),

            selectIdea: (ideaId: string) => set(state => ({
                selectedIdeaId: ideaId,
                ideas: state.ideas.map(idea => ({
                    ...idea,
                    selected: idea.id === ideaId
                }))
            })),

            toggleIdeaSelection: (ideaId: string) => set(state => {
                const isSelected = state.selectedIdeaIds.includes(ideaId);
                const newSelectedIds = isSelected
                    ? state.selectedIdeaIds.filter(id => id !== ideaId)
                    : [...state.selectedIdeaIds, ideaId];

                return {
                    selectedIdeaIds: newSelectedIds,
                    ideas: state.ideas.map(idea => ({
                        ...idea,
                        selected: newSelectedIds.includes(idea.id)
                    }))
                };
            }),

            setOutline: (outline: OutlineSection[]) => set({ outline }),

            updateOutlineSection: (id: string, updates: Partial<OutlineSection>) =>
                set(state => ({
                    outline: state.outline.map(section =>
                        section.id === id ? { ...section, ...updates } : section
                    )
                })),

            setScript: (script: ScriptContent) => set({ script }),

            updateScript: (updates: Partial<ScriptContent>) =>
                set(state => ({
                    script: state.script ? { ...state.script, ...updates } : null
                })),

            setMetadata: (metadata: VideoMetadata) => set({ metadata }),

            updateMetadata: (updates: Partial<VideoMetadata>) =>
                set(state => ({
                    metadata: state.metadata ? { ...state.metadata, ...updates } : null
                })),

            setIsGenerating: (isGenerating: boolean) => set({ isGenerating }),

            setError: (error: string | null) => set({ error }),

            setBatchProgress: (batchProgress: BatchProgress | null) => set({ batchProgress }),

            // Factory Mode Actions
            startFactoryMode: () => set(state => {
                const selectedIdeas = state.ideas.filter(idea =>
                    state.selectedIdeaIds.includes(idea.id)
                );

                const queue: FactoryQueueItem[] = selectedIdeas.map(idea => ({
                    ideaId: idea.id,
                    ideaTitle: idea.title,
                    status: 'waiting',
                    progress: 0,
                }));

                return {
                    factory: {
                        mode: 'factory',
                        isActive: true,
                        queue,
                        currentIndex: 0,
                        cooldownRemaining: 0,
                        isPaused: false,
                    }
                };
            }),

            stopFactoryMode: () => set({
                factory: initialFactoryState,
            }),

            pauseFactory: () => set(state => ({
                factory: {
                    ...state.factory,
                    isPaused: true,
                }
            })),

            resumeFactory: () => set(state => ({
                factory: {
                    ...state.factory,
                    isPaused: false,
                }
            })),

            updateFactoryItem: (ideaId: string, update: Partial<FactoryQueueItem>) =>
                set(state => ({
                    factory: {
                        ...state.factory,
                        queue: state.factory.queue.map(item =>
                            item.ideaId === ideaId ? { ...item, ...update } : item
                        )
                    }
                })),

            setCooldown: (seconds: number) => set(state => ({
                factory: {
                    ...state.factory,
                    cooldownRemaining: seconds,
                }
            })),

            resetPipeline: () => set({
                ...initialState,
                sessionId: generateSessionId(),
                language: get().language, // Keep language preference
            }),

            canProceedToStep: (step: PipelineStep): boolean => {
                const state = get();
                const targetIndex = getStepIndex(step);

                // Can always go back
                if (targetIndex <= getStepIndex(state.currentStep)) return true;

                // Check prerequisites
                switch (step) {
                    case 'idea':
                        return state.profileId !== null && state.topic.trim() !== '';
                    case 'outline':
                        return state.selectedIdeaId !== null || state.selectedIdeaIds.length > 0;
                    case 'script':
                        return state.outline.length > 0;
                    case 'metadata':
                        return state.script !== null;
                    default:
                        return false;
                }
            },
        }),
        {
            name: 'videlix-pipeline-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                sessionId: state.sessionId,
                language: state.language,
                profileId: state.profileId,
                topic: state.topic,
                currentStep: state.currentStep,
                ideas: state.ideas,
                selectedIdeaId: state.selectedIdeaId,
                selectedIdeaIds: state.selectedIdeaIds,
                outline: state.outline,
                script: state.script,
                metadata: state.metadata,
                // Don't persist factory state - always start fresh
            }),
        }
    )
);
