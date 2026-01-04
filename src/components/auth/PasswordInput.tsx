'use client';

// Videlix AI - Password Input Component
// Password input with show/hide toggle

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps {
    id: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    error?: string;
    disabled?: boolean;
    autoComplete?: string;
}

export function PasswordInput({
    id,
    value,
    onChange,
    placeholder = 'Enter password',
    error,
    disabled = false,
    autoComplete = 'current-password',
}: PasswordInputProps) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="relative">
            <input
                id={id}
                type={showPassword ? 'text' : 'password'}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                autoComplete={autoComplete}
                className={`
          w-full px-4 py-3 pr-12
          bg-zinc-800/50 border rounded-xl
          text-white placeholder:text-zinc-500
          focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
          ${error ? 'border-red-500' : 'border-zinc-700'}
        `}
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={disabled}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-50"
                tabIndex={-1}
            >
                {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                ) : (
                    <Eye className="w-5 h-5" />
                )}
            </button>
        </div>
    );
}
