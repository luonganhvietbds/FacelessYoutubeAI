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
    getStepIndex
} from '@/types';

const generateSessionId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const initialState = {
    sessionId: generateSessionId(),
    language: 'vi' as Language,
    profileId: null as string | null,
    topic: '',
    currentStep: 'idea' as PipelineStep,
    ideas: [] as VideoIdea[],
    selectedIdeaId: null as string | null,
    outline: [] as OutlineSection[],
    script: null as ScriptContent | null,
    metadata: null as VideoMetadata | null,
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
                        return state.selectedIdeaId !== null;
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
                outline: state.outline,
                script: state.script,
                metadata: state.metadata,
            }),
        }
    )
);
