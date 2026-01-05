// Videlix AI - Export Utilities
// Functions for exporting content in various formats

import { Scene, ScriptContent, VideoMetadata, SCENE_FIELDS, SceneFieldKey } from '@/types';

/**
 * Download content as a file
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Export script as JSON
 */
export function exportScriptAsJSON(script: ScriptContent, filename: string = 'script.json') {
    const content = JSON.stringify(script, null, 2);
    downloadFile(content, filename, 'application/json');
}

/**
 * Export metadata as JSON
 */
export function exportMetadataAsJSON(metadata: VideoMetadata, filename: string = 'metadata.json') {
    const content = JSON.stringify(metadata, null, 2);
    downloadFile(content, filename, 'application/json');
}

/**
 * Format scene as Markdown
 */
function formatSceneAsMarkdown(scene: Scene): string {
    return `## Scene ${scene.sceneNumber} - Block ${scene.block}

**Psychological Objective:** ${scene.psychologicalObjective}

**Narrative Function:** ${scene.narrativeFunction}

**Scene Description:** ${scene.sceneDescription}

**Context/Environment:** ${scene.context}

**Subject:** ${scene.subject}

**Emotional State:** ${scene.emotionalState}

**Motion:** ${scene.motion}

**Camera:** ${scene.camera}

**Lighting & Shadow:** ${scene.lighting}

**Visual Symbolism:** ${scene.visualSymbolism}

**Audio Effect:** ${scene.audioEffect}

**Voice-over:** ${scene.voiceOver}

**Feasibility:** ${scene.feasibilityLevel} - ${scene.feasibilityNote}

${scene.suggestion ? `**Suggestion:** ${scene.suggestion}` : ''}

### Prompts

**Image Prompt:**
\`\`\`
${scene.imagePrompt}
\`\`\`

**Video Prompt:**
\`\`\`
${scene.videoPrompt}
\`\`\`

---
`;
}

/**
 * Export script as Markdown
 */
export function exportScriptAsMarkdown(script: ScriptContent, filename: string = 'script.md') {
    let md = '# Video Script\n\n';

    // Legacy format
    if (script.intro) {
        md += `## Intro\n\n${script.intro}\n\n`;
    }

    if (script.sections?.length) {
        script.sections.forEach((section, i) => {
            md += `## ${section.heading}\n\n${section.content}\n\n`;
            if (section.visualNotes) {
                md += `*Visual Notes: ${section.visualNotes}*\n\n`;
            }
        });
    }

    if (script.outro) {
        md += `## Outro\n\n${script.outro}\n\n`;
    }

    if (script.callToAction) {
        md += `## Call to Action\n\n${script.callToAction}\n\n`;
    }

    // Scene format (documentary style)
    if (script.scenes?.length) {
        md += `## Scenes (${script.scenes.length} total)\n\n`;
        script.scenes.forEach(scene => {
            md += formatSceneAsMarkdown(scene);
        });
    }

    downloadFile(md, filename, 'text/markdown');
}

/**
 * Extract specific field from all scenes
 */
export function extractSceneField(scenes: Scene[], field: SceneFieldKey): string[] {
    return scenes.map(scene => {
        const value = scene[field];
        return typeof value === 'string' ? value : String(value);
    });
}

/**
 * Format extracted field as text with scene numbers
 */
export function formatExtractedField(
    scenes: Scene[],
    field: SceneFieldKey
): string {
    const lines = scenes.map((scene, i) => {
        const value = scene[field];
        return `[Scene ${scene.sceneNumber}] ${typeof value === 'string' ? value : String(value)}`;
    });
    return lines.join('\n\n');
}

/**
 * Export filtered content
 */
export function exportFilteredContent(
    scenes: Scene[],
    fields: SceneFieldKey[],
    filename: string = 'filtered_content.txt'
) {
    let content = '';

    fields.forEach(field => {
        content += `# ${field.toUpperCase()}\n\n`;
        content += formatExtractedField(scenes, field);
        content += '\n\n---\n\n';
    });

    downloadFile(content, filename, 'text/plain');
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        // Fallback for older browsers
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            return true;
        } catch (fallbackError) {
            return false;
        }
    }
}

/**
 * Get field display name (Vietnamese/English)
 */
export function getFieldDisplayName(field: SceneFieldKey, language: 'vi' | 'en' = 'en'): string {
    const names: Record<SceneFieldKey, { vi: string; en: string }> = {
        sceneNumber: { vi: 'Số cảnh', en: 'Scene Number' },
        block: { vi: 'Block', en: 'Block' },
        psychologicalObjective: { vi: 'Mục tiêu tâm lý', en: 'Psychological Objective' },
        narrativeFunction: { vi: 'Chức năng tường thuật', en: 'Narrative Function' },
        sceneDescription: { vi: 'Mô tả cảnh', en: 'Scene Description' },
        context: { vi: 'Bối cảnh', en: 'Context' },
        subject: { vi: 'Chủ thể', en: 'Subject' },
        emotionalState: { vi: 'Trạng thái cảm xúc', en: 'Emotional State' },
        motion: { vi: 'Chuyển động', en: 'Motion' },
        camera: { vi: 'Camera', en: 'Camera' },
        lighting: { vi: 'Ánh sáng', en: 'Lighting' },
        visualSymbolism: { vi: 'Biểu tượng hình ảnh', en: 'Visual Symbolism' },
        audioEffect: { vi: 'Hiệu ứng âm thanh', en: 'Audio Effect' },
        voiceOver: { vi: 'Lời thoại', en: 'Voice-over' },
        feasibilityLevel: { vi: 'Mức khả thi', en: 'Feasibility Level' },
        feasibilityNote: { vi: 'Ghi chú khả thi', en: 'Feasibility Note' },
        suggestion: { vi: 'Đề xuất', en: 'Suggestion' },
        imagePrompt: { vi: 'Prompt hình ảnh', en: 'Image Prompt' },
        videoPrompt: { vi: 'Prompt video', en: 'Video Prompt' },
    };

    return names[field]?.[language] || field;
}

/**
 * Export full project data
 */
export function exportFullProject(
    data: {
        topic: string;
        outline?: unknown;
        script?: ScriptContent;
        metadata?: VideoMetadata;
    },
    filename: string = 'project.json'
) {
    const content = JSON.stringify(data, null, 2);
    downloadFile(content, filename, 'application/json');
}
