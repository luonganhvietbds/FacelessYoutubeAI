'use client';

// Videlix AI - Simple API Key Input
// Direct input in Header, stored in localStorage

import { useState, useEffect } from 'react';
import { Key, Check, X, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { getApiKey, saveApiKey, removeApiKey, maskApiKey } from '@/lib/api-keys/simpleKeyStore';

export function ApiKeyInput() {
    const [key, setKey] = useState('');
    const [savedKey, setSavedKey] = useState<string | null>(null);
    const [showKey, setShowKey] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    // Load saved key on mount
    useEffect(() => {
        const stored = getApiKey();
        if (stored) {
            setSavedKey(stored);
        }
    }, []);

    const handleSave = () => {
        if (key.trim()) {
            saveApiKey(key.trim());
            setSavedKey(key.trim());
            setKey('');
            setIsOpen(false);
        }
    };

    const handleRemove = () => {
        removeApiKey();
        setSavedKey(null);
        setKey('');
    };

    const hasKey = !!savedKey;

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={`border-zinc-700 ${hasKey
                            ? 'text-green-400 hover:text-green-300'
                            : 'text-yellow-400 hover:text-yellow-300'
                        }`}
                >
                    <Key className="w-4 h-4 mr-2" />
                    {hasKey ? 'API Key ✓' : 'Add API Key'}
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-80 bg-zinc-900 border-zinc-700">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <h4 className="font-medium text-white">Gemini API Key</h4>
                        <p className="text-xs text-zinc-400">
                            Get your key from{' '}
                            <a
                                href="https://aistudio.google.com/app/apikey"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:underline"
                            >
                                Google AI Studio
                            </a>
                        </p>
                    </div>

                    {savedKey ? (
                        // Show saved key
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                                <Check className="w-4 h-4 text-green-400" />
                                <span className="text-sm text-green-300 flex-1 font-mono">
                                    {showKey ? savedKey : maskApiKey(savedKey)}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowKey(!showKey)}
                                    className="h-6 w-6 p-0 text-zinc-400"
                                >
                                    {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                </Button>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRemove}
                                className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Remove Key
                            </Button>
                        </div>
                    ) : (
                        // Input new key
                        <div className="space-y-3">
                            <Input
                                type={showKey ? 'text' : 'password'}
                                placeholder="AIzaSy..."
                                value={key}
                                onChange={(e) => setKey(e.target.value)}
                                className="bg-zinc-800 border-zinc-700 text-white font-mono"
                            />

                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowKey(!showKey)}
                                    className="text-zinc-400"
                                >
                                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </Button>

                                <Button
                                    onClick={handleSave}
                                    disabled={!key.trim()}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                >
                                    Save Key
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
