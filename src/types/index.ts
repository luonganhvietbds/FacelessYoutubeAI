// Videlix AI - TypeScript Type Definitions

export type Language = 'en' | 'vi';

export type PipelineStep = 'idea' | 'outline' | 'script' | 'metadata';

export interface BilingualText {
  en: string;
  vi: string;
}

export interface PromptProfile {
  id: string;
  name: BilingualText;
  description: BilingualText;
  icon: string;
  category: string;
  prompts: {
    idea: BilingualText;
    outline: BilingualText;
    script: BilingualText;
    metadata: BilingualText;
  };
}

export interface VideoIdea {
  id: string;
  title: string;
  hook: string;
  angle: string;
  selected: boolean;
}

export interface OutlineSection {
  id: string;
  title: string;
  points: string[];
  duration?: string;
}

export interface ScriptContent {
  intro: string;
  sections: {
    heading: string;
    content: string;
    visualNotes?: string;
  }[];
  outro: string;
  callToAction: string;
}

export interface VideoMetadata {
  title: string;
  description: string;
  tags: string[];
  thumbnailPrompt: string;
  estimatedDuration: string;
}

export interface PipelineState {
  // Session
  sessionId: string;
  language: Language;
  profileId: string | null;
  topic: string;
  
  // Current Step
  currentStep: PipelineStep;
  
  // Step Data
  ideas: VideoIdea[];
  selectedIdeaId: string | null;
  outline: OutlineSection[];
  script: ScriptContent | null;
  metadata: VideoMetadata | null;
  
  // UI State
  isGenerating: boolean;
  error: string | null;
  
  // Actions
  setLanguage: (lang: Language) => void;
  setProfile: (profileId: string) => void;
  setTopic: (topic: string) => void;
  setCurrentStep: (step: PipelineStep) => void;
  setIdeas: (ideas: VideoIdea[]) => void;
  selectIdea: (ideaId: string) => void;
  setOutline: (outline: OutlineSection[]) => void;
  updateOutlineSection: (id: string, section: Partial<OutlineSection>) => void;
  setScript: (script: ScriptContent) => void;
  updateScript: (script: Partial<ScriptContent>) => void;
  setMetadata: (metadata: VideoMetadata) => void;
  updateMetadata: (metadata: Partial<VideoMetadata>) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setError: (error: string | null) => void;
  resetPipeline: () => void;
  canProceedToStep: (step: PipelineStep) => boolean;
}

export interface GenerateRequest {
  step: PipelineStep;
  profileId: string;
  language: Language;
  topic: string;
  previousContent?: {
    selectedIdea?: VideoIdea;
    outline?: OutlineSection[];
    script?: ScriptContent;
  };
  modifier?: 'shorter' | 'longer' | 'funnier' | 'professional' | 'default';
}

export interface GenerateResponse {
  success: boolean;
  data?: VideoIdea[] | OutlineSection[] | ScriptContent | VideoMetadata;
  error?: string;
}

// Step configuration
export const PIPELINE_STEPS: { id: PipelineStep; name: BilingualText; icon: string }[] = [
  { id: 'idea', name: { en: 'Ideas', vi: 'Ý tưởng' }, icon: 'Lightbulb' },
  { id: 'outline', name: { en: 'Outline', vi: 'Dàn ý' }, icon: 'List' },
  { id: 'script', name: { en: 'Script', vi: 'Kịch bản' }, icon: 'FileText' },
  { id: 'metadata', name: { en: 'Metadata', vi: 'Metadata' }, icon: 'Tags' },
];

export const STEP_ORDER: PipelineStep[] = ['idea', 'outline', 'script', 'metadata'];

export function getStepIndex(step: PipelineStep): number {
  return STEP_ORDER.indexOf(step);
}

export function getNextStep(step: PipelineStep): PipelineStep | null {
  const index = getStepIndex(step);
  return index < STEP_ORDER.length - 1 ? STEP_ORDER[index + 1] : null;
}

export function getPreviousStep(step: PipelineStep): PipelineStep | null {
  const index = getStepIndex(step);
  return index > 0 ? STEP_ORDER[index - 1] : null;
}
