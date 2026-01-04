'use client';

// Videlix AI - API Key Manager Component
// Modal for managing user's Gemini API keys

import { useState } from 'react';
import { Key, Plus, Trash2, RefreshCw, CheckCircle, XCircle, Loader2, X, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useApiKeys } from '@/hooks/useApiKeys';
import { ApiKeyDisplay } from '@/lib/api-keys/keyStore';

interface ApiKeyManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

function StatusBadge({ status }: { status: ApiKeyDisplay['status'] }) {
    const config = {
        active: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Active' },
        invalid: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Invalid' },
        checking: { icon: Loader2, color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Checking' },
    }[status];

    const Icon = config.icon;

    return (
        <span className={cn('flex items-center gap-1 px-2 py-0.5 rounded text-xs', config.bg, config.color)}>
            <Icon className={cn('w-3 h-3', status === 'checking' && 'animate-spin')} />
            {config.label}
        </span>
    );
}

function KeyRow({
    apiKey,
    onDelete
}: {
    apiKey: ApiKeyDisplay;
    onDelete: () => void;
}) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(apiKey.maskedKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <Key className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <code className="text-sm text-white font-mono truncate">
                            {apiKey.maskedKey}
                        </code>
                        <button
                            onClick={handleCopy}
                            className="p-1 hover:bg-zinc-700 rounded transition-colors"
                        >
                            {copied
                                ? <Check className="w-3 h-3 text-emerald-400" />
                                : <Copy className="w-3 h-3 text-zinc-500" />
                            }
                        </button>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                        <span>{apiKey.usageCount} uses</span>
                        {apiKey.lastUsed && (
                            <span>Last: {apiKey.lastUsed.toLocaleDateString()}</span>
                        )}
                        {apiKey.errorMessage && (
                            <span className="text-red-400">{apiKey.errorMessage}</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                <StatusBadge status={apiKey.status} />
                <button
                    onClick={onDelete}
                    className="p-1.5 hover:bg-red-500/10 rounded text-zinc-500 hover:text-red-400 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

export function ApiKeyManager({ isOpen, onClose }: ApiKeyManagerProps) {
    const { keys, loading, validating, addKeys, deleteKey, hasActiveKeys } = useApiKeys();
    const [inputValue, setInputValue] = useState('');
    const [result, setResult] = useState<{ valid: number; invalid: number } | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!inputValue.trim()) return;

        const res = await addKeys(inputValue);
        setResult(res);
        setInputValue('');

        // Clear result after 3 seconds
        setTimeout(() => setResult(null), 3000);
    };

    const activeKeys = keys.filter(k => k.status === 'active');
    const invalidKeys = keys.filter(k => k.status === 'invalid');

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Key className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-white">Manage API Keys</h2>
                            <p className="text-xs text-zinc-500">
                                {hasActiveKeys
                                    ? `${activeKeys.length} active key${activeKeys.length > 1 ? 's' : ''}`
                                    : 'No active keys - add your Gemini API keys'
                                }
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-zinc-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto flex-1">
                    {/* Input Section */}
                    <div className="mb-6">
                        <label className="text-sm text-zinc-300 mb-2 block">
                            Paste your Gemini API keys (one per line):
                        </label>
                        <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX&#10;AIzaSyYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY&#10;AIzaSyZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ"
                            className="w-full h-32 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-none"
                        />

                        <div className="flex items-center gap-3 mt-3">
                            <Button
                                onClick={handleSubmit}
                                disabled={validating || !inputValue.trim()}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {validating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Validating...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Validate & Add Keys
                                    </>
                                )}
                            </Button>

                            {result && (
                                <span className="text-sm">
                                    <span className="text-emerald-400">{result.valid} valid</span>
                                    {result.invalid > 0 && (
                                        <>, <span className="text-red-400">{result.invalid} invalid</span></>
                                    )}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Keys List */}
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
                        </div>
                    ) : keys.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500">
                            <Key className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No API keys added yet</p>
                            <p className="text-xs mt-1">Paste your Gemini API keys above</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Active Keys */}
                            {activeKeys.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-medium text-zinc-400 uppercase mb-2">
                                        Active Keys ({activeKeys.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {activeKeys.map(key => (
                                            <KeyRow
                                                key={key.id}
                                                apiKey={key}
                                                onDelete={() => deleteKey(key.id)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Invalid Keys */}
                            {invalidKeys.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-medium text-zinc-400 uppercase mb-2">
                                        Invalid Keys ({invalidKeys.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {invalidKeys.map(key => (
                                            <KeyRow
                                                key={key.id}
                                                apiKey={key}
                                                onDelete={() => deleteKey(key.id)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-zinc-800 bg-zinc-800/30">
                    <p className="text-xs text-zinc-500">
                        💡 Get your Gemini API keys from{' '}
                        <a
                            href="https://aistudio.google.com/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline"
                        >
                            Google AI Studio
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
