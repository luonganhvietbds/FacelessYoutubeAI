'use client';

// Videlix AI - Profile Selector Component with Real-time Firebase Sync
// Supports 100+ profiles with scrollable area and bilingual categories

import { useState, useEffect } from 'react';
import { BookOpen, GraduationCap, Video, Star, Newspaper, ChevronDown, RefreshCw, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePipelineStore } from '@/lib/store/pipelineStore';
import { BilingualText } from '@/types';
import { subscribeToProfiles, FirebaseProfile } from '@/lib/firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    BookOpen,
    GraduationCap,
    Video,
    Star,
    Newspaper,
};

interface ProfileDisplay {
    id: string;
    name: BilingualText;
    description: BilingualText;
    icon: string;
    category: BilingualText | string; // Support both old string and new BilingualText
}

interface ProfileCardProps {
    profile: ProfileDisplay;
    isSelected: boolean;
    language: 'en' | 'vi';
    onClick: () => void;
}

function ProfileCard({ profile, isSelected, language, onClick }: ProfileCardProps) {
    const Icon = iconMap[profile.icon] || BookOpen;

    // Get category text - support both string and BilingualText
    const categoryText = typeof profile.category === 'string'
        ? profile.category
        : profile.category[language];

    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full p-3 rounded-lg border text-left transition-all duration-200",
                isSelected
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800"
            )}
        >
            <div className="flex items-start gap-3">
                <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                    isSelected ? "bg-blue-500/20" : "bg-zinc-700"
                )}>
                    <Icon className={cn(
                        "w-4 h-4",
                        isSelected ? "text-blue-500" : "text-zinc-400"
                    )} />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className={cn(
                        "font-medium text-sm leading-tight",
                        isSelected ? "text-blue-400" : "text-white"
                    )}>
                        {profile.name[language]}
                    </h3>
                    <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">
                        {categoryText}
                    </p>
                </div>
                {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    const [profiles, setProfiles] = useState<ProfileDisplay[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(true);
    const [isRealtime, setIsRealtime] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

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

    // Filter profiles by search query
    const filteredProfiles = profiles.filter(profile => {
        if (!searchQuery.trim()) return true;

        const query = searchQuery.toLowerCase();
        const nameMatch = profile.name[language].toLowerCase().includes(query);
        const categoryText = typeof profile.category === 'string'
            ? profile.category
            : profile.category[language];
        const categoryMatch = categoryText.toLowerCase().includes(query);

        return nameMatch || categoryMatch;
    });

    const selectedProfile = profiles.find(p => p.id === profileId);
    const showScrollArea = filteredProfiles.length > 10;

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
                    <span className="text-[10px] text-zinc-500">
                        ({profiles.length})
                    </span>
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
                    {/* Search box - show when more than 10 profiles */}
                    {profiles.length > 10 && (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                            <input
                                type="text"
                                placeholder={language === 'vi' ? 'Tìm kiếm profile...' : 'Search profiles...'}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500"
                            />
                        </div>
                    )}

                    {isLoading ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-16 rounded-lg bg-zinc-800 animate-pulse" />
                            ))}
                        </div>
                    ) : filteredProfiles.length === 0 ? (
                        <div className="text-center py-6 text-zinc-500 text-xs">
                            {searchQuery
                                ? (language === 'vi' ? 'Không tìm thấy profile' : 'No profiles found')
                                : (language === 'vi' ? 'Chưa có profile nào' : 'No profiles yet')}
                        </div>
                    ) : showScrollArea ? (
                        // Scrollable area for more than 10 profiles
                        <ScrollArea className="h-[400px] pr-2">
                            <div className="space-y-2">
                                {filteredProfiles.map(profile => (
                                    <ProfileCard
                                        key={profile.id}
                                        profile={profile}
                                        isSelected={profileId === profile.id}
                                        language={language}
                                        onClick={() => setProfile(profile.id)}
                                    />
                                ))}
                            </div>
                        </ScrollArea>
                    ) : (
                        // Normal list for 10 or fewer profiles
                        <div className="space-y-2">
                            {filteredProfiles.map(profile => (
                                <ProfileCard
                                    key={profile.id}
                                    profile={profile}
                                    isSelected={profileId === profile.id}
                                    language={language}
                                    onClick={() => setProfile(profile.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
