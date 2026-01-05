'use client';

// Videlix AI - Export Panel Component
// Provides download and filter options for script content

import { useState } from 'react';
import { Download, Copy, Check, Filter, FileJson, FileText, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScriptContent, Scene, SCENE_FIELDS, SceneFieldKey } from '@/types';
import {
    exportScriptAsJSON,
    exportScriptAsMarkdown,
    exportFilteredContent,
    formatExtractedField,
    copyToClipboard,
    getFieldDisplayName,
} from '@/lib/utils/exportUtils';
import { cn } from '@/lib/utils';

interface ExportPanelProps {
    script: ScriptContent;
    language: 'vi' | 'en';
}

export function ExportPanel({ script, language }: ExportPanelProps) {
    const [copied, setCopied] = useState<string | null>(null);
    const [selectedFields, setSelectedFields] = useState<SceneFieldKey[]>([]);
    const [showFilter, setShowFilter] = useState(false);

    const hasScenes = script.scenes && script.scenes.length > 0;
    const scenes = script.scenes || [];

    const handleCopy = async (text: string, key: string) => {
        const success = await copyToClipboard(text);
        if (success) {
            setCopied(key);
            setTimeout(() => setCopied(null), 2000);
        }
    };

    const toggleField = (field: SceneFieldKey) => {
        setSelectedFields(prev =>
            prev.includes(field)
                ? prev.filter(f => f !== field)
                : [...prev, field]
        );
    };

    const handleExportFiltered = () => {
        if (selectedFields.length > 0 && scenes.length > 0) {
            exportFilteredContent(scenes, selectedFields, `filtered_${selectedFields[0]}.txt`);
        }
    };

    const handleCopyFiltered = async () => {
        if (selectedFields.length > 0 && scenes.length > 0) {
            const content = selectedFields
                .map(field => formatExtractedField(scenes, field))
                .join('\n\n---\n\n');
            await handleCopy(content, 'filtered');
        }
    };

    // Quick extract presets
    const presets = [
        { key: 'voiceOver', label: language === 'vi' ? 'Lời thoại' : 'Voice-overs' },
        { key: 'imagePrompt', label: language === 'vi' ? 'Image Prompts' : 'Image Prompts' },
        { key: 'videoPrompt', label: language === 'vi' ? 'Video Prompts' : 'Video Prompts' },
    ] as const;

    return (
        <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    {language === 'vi' ? 'Xuất dữ liệu' : 'Export'}
                    {hasScenes && (
                        <Badge className="bg-emerald-500/20 text-emerald-400">
                            {scenes.length} scenes
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Download Options */}
                <div className="flex flex-wrap gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-zinc-700 text-zinc-300"
                            >
                                <Download className="w-3 h-3 mr-1" />
                                {language === 'vi' ? 'Tải xuống' : 'Download'}
                                <ChevronDown className="w-3 h-3 ml-1" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-zinc-900 border-zinc-700">
                            <DropdownMenuItem
                                onClick={() => exportScriptAsJSON(script)}
                                className="text-zinc-300 cursor-pointer"
                            >
                                <FileJson className="w-4 h-4 mr-2" />
                                JSON (Full)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => exportScriptAsMarkdown(script)}
                                className="text-zinc-300 cursor-pointer"
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                Markdown
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(JSON.stringify(script, null, 2), 'all')}
                        className="border-zinc-700 text-zinc-300"
                    >
                        {copied === 'all' ? (
                            <Check className="w-3 h-3 mr-1 text-green-400" />
                        ) : (
                            <Copy className="w-3 h-3 mr-1" />
                        )}
                        {language === 'vi' ? 'Copy JSON' : 'Copy JSON'}
                    </Button>
                </div>

                {/* Quick Extract for Scenes */}
                {hasScenes && (
                    <>
                        <div className="border-t border-zinc-800 pt-3">
                            <p className="text-xs text-zinc-500 mb-2">
                                {language === 'vi' ? 'Trích xuất nhanh:' : 'Quick Extract:'}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {presets.map(preset => (
                                    <Button
                                        key={preset.key}
                                        variant="ghost"
                                        size="sm"
                                        onClick={async () => {
                                            const content = formatExtractedField(scenes, preset.key as SceneFieldKey);
                                            await handleCopy(content, preset.key);
                                        }}
                                        className="text-xs h-7 text-zinc-400 hover:text-white"
                                    >
                                        {copied === preset.key ? (
                                            <Check className="w-3 h-3 mr-1 text-green-400" />
                                        ) : (
                                            <Copy className="w-3 h-3 mr-1" />
                                        )}
                                        {preset.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Advanced Filter */}
                        <div className="border-t border-zinc-800 pt-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowFilter(!showFilter)}
                                className="text-xs text-zinc-400 hover:text-white mb-2"
                            >
                                <Filter className="w-3 h-3 mr-1" />
                                {language === 'vi' ? 'Lọc nâng cao' : 'Advanced Filter'}
                                <ChevronDown className={cn(
                                    "w-3 h-3 ml-1 transition-transform",
                                    showFilter && "rotate-180"
                                )} />
                            </Button>

                            {showFilter && (
                                <div className="space-y-2 bg-zinc-800/50 rounded-lg p-3">
                                    <div className="grid grid-cols-2 gap-1">
                                        {SCENE_FIELDS.map(field => (
                                            <button
                                                key={field}
                                                onClick={() => toggleField(field)}
                                                className={cn(
                                                    "text-xs px-2 py-1 rounded text-left transition-all",
                                                    selectedFields.includes(field)
                                                        ? "bg-blue-500/20 text-blue-400"
                                                        : "text-zinc-500 hover:text-zinc-300"
                                                )}
                                            >
                                                {selectedFields.includes(field) && '✓ '}
                                                {getFieldDisplayName(field, language)}
                                            </button>
                                        ))}
                                    </div>

                                    {selectedFields.length > 0 && (
                                        <div className="flex gap-2 pt-2 border-t border-zinc-700">
                                            <Button
                                                size="sm"
                                                onClick={handleCopyFiltered}
                                                className="bg-blue-600 hover:bg-blue-700 text-xs"
                                            >
                                                {copied === 'filtered' ? (
                                                    <Check className="w-3 h-3 mr-1" />
                                                ) : (
                                                    <Copy className="w-3 h-3 mr-1" />
                                                )}
                                                Copy ({selectedFields.length})
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={handleExportFiltered}
                                                className="border-zinc-600 text-xs"
                                            >
                                                <Download className="w-3 h-3 mr-1" />
                                                Download
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
