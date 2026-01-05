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

// ============================================
// CONTENT TYPES - Flexible for any profile
// ============================================

export interface VideoIdea {
  id: string;
  title: string;
  hook: string;
  angle: string;
  selected: boolean;
  // Raw content for complex profiles
  rawContent?: string;
}

export interface OutlineSection {
  id: string;
  title: string;
  points: string[];
  duration?: string;
}

// Scene structure for documentary-style content (19 fields)
export type FeasibilityLevel = 'Easy' | 'Medium' | 'Hard' | 'Very Hard';
export type SceneBlock = 'I' | 'II' | 'III' | 'IV' | 'V';

export interface Scene {
  sceneNumber: number;
  block: SceneBlock;
  psychologicalObjective: string;
  narrativeFunction: string;
  sceneDescription: string;
  context: string;
  subject: string;
  emotionalState: string;
  motion: string;
  camera: string;
  lighting: string;
  visualSymbolism: string;
  audioEffect: string;
  voiceOver: string;
  feasibilityLevel: FeasibilityLevel;
  feasibilityNote: string;
  suggestion?: string;
  imagePrompt: string;
  videoPrompt: string;
}

// Script content - supports both simple and complex formats
export interface ScriptContent {
  // Simple format (legacy)
  intro?: string;
  sections?: {
    heading: string;
    content: string;
    visualNotes?: string;
  }[];
  outro?: string;
  callToAction?: string;
  // Complex format (scenes)
  scenes?: Scene[];
  // Raw content for any format
  rawContent?: string;
}

export interface VideoMetadata {
  title: string | string[];  // Can be array for multiple options
  description: string;
  tags: string[];
  thumbnailPrompt: string | string[];  // Can be array for multiple
  estimatedDuration?: string;
}

// ============================================
// FACTORY MODE TYPES
// ============================================

export type FactoryItemStatus = 'waiting' | 'processing' | 'cooling' | 'complete' | 'error';

export interface FactoryQueueItem {
  ideaId: string;
  ideaTitle: string;
  status: FactoryItemStatus;
  progress: number;  // 0-100
  currentStep?: PipelineStep;
  result?: {
    outline: OutlineSection[] | string;
    script: ScriptContent | string;
    metadata: VideoMetadata | string;
  };
  error?: string;
}

export interface FactoryState {
  mode: 'single' | 'factory';
  isActive: boolean;
  queue: FactoryQueueItem[];
  currentIndex: number;
  cooldownRemaining: number;  // seconds
  isPaused: boolean;
}

// ============================================
// BATCH PROCESSING TYPES
// ============================================

export interface BatchProgress {
  step: PipelineStep;
  currentBatch: number;
  totalBatches: number;
  itemsProcessed: number;
  totalItems: number;
  isDelaying: boolean;
  delayRemaining: number;  // ms
}

// ============================================
// RATE LIMIT CONSTANTS
// ============================================

export const RATE_LIMITS = {
  BATCH_SIZE: 5,            // scenes per batch
  BATCH_DELAY: 2000,        // ms between batches
  FACTORY_COOLDOWN: 30000,  // ms between ideas
  RETRY_DELAY: 5000,        // ms on rate limit error
  MAX_RETRIES: 3,
} as const;

// ============================================
// PIPELINE STATE
// ============================================

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
  selectedIdeaIds: string[];  // For factory mode (multi-select)
  outline: OutlineSection[];
  script: ScriptContent | null;
  metadata: VideoMetadata | null;

  // Factory Mode
  factory: FactoryState;

  // Batch Progress
  batchProgress: BatchProgress | null;

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
  toggleIdeaSelection: (ideaId: string) => void;  // For multi-select
  setOutline: (outline: OutlineSection[]) => void;
  updateOutlineSection: (id: string, section: Partial<OutlineSection>) => void;
  setScript: (script: ScriptContent) => void;
  updateScript: (script: Partial<ScriptContent>) => void;
  setMetadata: (metadata: VideoMetadata) => void;
  updateMetadata: (metadata: Partial<VideoMetadata>) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setError: (error: string | null) => void;
  setBatchProgress: (progress: BatchProgress | null) => void;

  // Factory Actions
  startFactoryMode: () => void;
  stopFactoryMode: () => void;
  pauseFactory: () => void;
  resumeFactory: () => void;
  updateFactoryItem: (ideaId: string, update: Partial<FactoryQueueItem>) => void;
  setCooldown: (seconds: number) => void;

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
  batchIndex?: number;  // For batch processing
  batchSize?: number;
}

export interface GenerateResponse {
  success: boolean;
  data?: VideoIdea[] | OutlineSection[] | ScriptContent | VideoMetadata | string;
  error?: string;
  isBatch?: boolean;
  batchIndex?: number;
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

// Scene field keys for export filtering
export const SCENE_FIELDS = [
  'sceneNumber',
  'block',
  'psychologicalObjective',
  'narrativeFunction',
  'sceneDescription',
  'context',
  'subject',
  'emotionalState',
  'motion',
  'camera',
  'lighting',
  'visualSymbolism',
  'audioEffect',
  'voiceOver',
  'feasibilityLevel',
  'feasibilityNote',
  'suggestion',
  'imagePrompt',
  'videoPrompt',
] as const;

export type SceneFieldKey = typeof SCENE_FIELDS[number];
