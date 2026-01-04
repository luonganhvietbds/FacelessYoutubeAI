'use client';

// Videlix AI - Profile Selector Component with Real-time Firebase Sync

import { useState, useEffect } from 'react';
import { BookOpen, GraduationCap, Video, Star, Newspaper, ChevronDown, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePipelineStore } from '@/lib/store/pipelineStore';
import { BilingualText } from '@/types';
import { subscribeToProfiles, FirebaseProfile } from '@/lib/firebase/firestore';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    BookOpen,
    GraduationCap,
    Video,
    Star,
    Newspaper,
};

interface ProfileCardProps {
    profile: {
        id: string;
        name: BilingualText;
        description: BilingualText;
        icon: string;
        category: string;
    };
    isSelected: boolean;
    language: 'en' | 'vi';
    onClick: () => void;
}

function ProfileCard({ profile, isSelected, language, onClick }: ProfileCardProps) {
    const Icon = iconMap[profile.icon] || BookOpen;

    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full p-4 rounded-lg border text-left transition-all duration-200",
                isSelected
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800"
            )}
        >
            <div className="flex items-start gap-3">
                <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                    isSelected ? "bg-blue-500/20" : "bg-zinc-700"
                )}>
                    <Icon className={cn(
                        "w-5 h-5",
                        isSelected ? "text-blue-500" : "text-zinc-400"
                    )} />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className={cn(
                        "font-medium text-sm",
                        isSelected ? "text-blue-400" : "text-white"
                    )}>
                        {profile.name[language]}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                        {profile.description[language]}
                    </p>
                </div>
                {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                )}
            </div>
        </button>
    );
}

export function ProfileSelector() {
    const { profileId, setProfile, language } = usePipelineStore();
    const [profiles, setProfiles] = useState<{
        id: string;
        name: BilingualText;
        description: BilingualText;
        icon: string;
        category: string;
    }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(true);
    const [isRealtime, setIsRealtime] = useState(false);

    useEffect(() => {
        // Subscribe to real-time updates from Firestore
        const unsubscribe = subscribeToProfiles((firebaseProfiles: FirebaseProfile[]) => {
            // Filter only active profiles and transform for UI
            const activeProfiles = firebaseProfiles
                .filter(p => p.isActive)
                .map(p => ({
                    id: p.id,
                    name: p.name,
                    description: p.description,
                    icon: p.icon,
                    category: p.category,
                }));

            setProfiles(activeProfiles);
            setIsLoading(false);
            setIsRealtime(true);

            // Auto-select first profile if none selected
            if (activeProfiles.length > 0 && !profileId) {
                setProfile(activeProfiles[0].id);
            }
        });

        return () => unsubscribe();
    }, [profileId, setProfile]);

    const selectedProfile = profiles.find(p => p.id === profileId);

    return (
        <div className="space-y-3">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-between w-full text-left"
            >
                <div className="flex items-center gap-2">
                    <h2 className="text-sm font-medium text-zinc-300">
                        {language === 'vi' ? 'Phong cách Video' : 'Video Style'}
                    </h2>
                    {isRealtime && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-[10px] text-emerald-400">
                            <RefreshCw className="w-2.5 h-2.5" />
                            Live
                        </div>
                    )}
                </div>
                <ChevronDown className={cn(
                    "w-4 h-4 text-zinc-500 transition-transform",
                    isExpanded && "rotate-180"
                )} />
            </button>

            {selectedProfile && !isExpanded && (
                <p className="text-xs text-blue-400">
                    {selectedProfile.name[language]}
                </p>
            )}

            {isExpanded && (
                <div className="space-y-2">
                    {isLoading ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-20 rounded-lg bg-zinc-800 animate-pulse" />
                            ))}
                        </div>
                    ) : profiles.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500 text-sm">
                            {language === 'vi'
                                ? 'Chưa có profile nào. Hãy thêm trong Admin Panel.'
                                : 'No profiles yet. Add some in Admin Panel.'}
                        </div>
                    ) : (
                        profiles.map(profile => (
                            <ProfileCard
                                key={profile.id}
                                profile={profile}
                                isSelected={profileId === profile.id}
                                language={language}
                                onClick={() => setProfile(profile.id)}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
