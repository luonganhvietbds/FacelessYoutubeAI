'use client';

// Videlix AI - Admin Profile List

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    ToggleLeft,
    ToggleRight,
    Star,
    MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
    subscribeToProfiles,
    deleteProfile,
    toggleProfileActive,
    FirebaseProfile
} from '@/lib/firebase/database';

export default function AdminProfilesPage() {
    const router = useRouter();
    const [profiles, setProfiles] = useState<FirebaseProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

    useEffect(() => {
        const unsubscribe = subscribeToProfiles((data) => {
            setProfiles(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredProfiles = profiles.filter(profile => {
        const matchesSearch =
            profile.name.en.toLowerCase().includes(search.toLowerCase()) ||
            profile.name.vi.toLowerCase().includes(search.toLowerCase()) ||
            profile.category.toLowerCase().includes(search.toLowerCase());

        const matchesFilter =
            filter === 'all' ||
            (filter === 'active' && profile.isActive) ||
            (filter === 'inactive' && !profile.isActive);

        return matchesSearch && matchesFilter;
    });

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Are you sure you want to delete "${name}"?`)) {
            await deleteProfile(id);
        }
    };

    const handleToggleActive = async (id: string, currentState: boolean) => {
        await toggleProfileActive(id, !currentState);
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-white">Prompt Profiles</h2>
                        <p className="text-sm text-zinc-400">
                            Manage video content profiles and their prompts
                        </p>
                    </div>
                    <Button
                        onClick={() => router.push('/admin/profiles/new')}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Profile
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search profiles..."
                            className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        {(['all', 'active', 'inactive'] as const).map((f) => (
                            <Button
                                key={f}
                                variant={filter === f ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter(f)}
                                className={filter === f
                                    ? 'bg-blue-600'
                                    : 'border-zinc-700 text-zinc-400 hover:text-white'
                                }
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Profile Grid */}
                {loading ? (
                    <div className="flex items-center justify-center h-32">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredProfiles.length === 0 ? (
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardContent className="py-12 text-center">
                            <p className="text-zinc-400">No profiles found</p>
                            <Button
                                onClick={() => router.push('/admin/profiles/new')}
                                variant="outline"
                                className="mt-4 border-zinc-700"
                            >
                                Create your first profile
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredProfiles.map((profile) => (
                            <Card
                                key={profile.id}
                                className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors"
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${profile.isActive ? 'bg-blue-500/10' : 'bg-zinc-800'
                                                }`}>
                                                <span className="text-lg">{profile.icon || '📝'}</span>
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-white">{profile.name.vi || profile.name.en}</h3>
                                                <p className="text-xs text-zinc-500">{profile.name.en}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {profile.isPremium && (
                                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                            )}
                                            <Badge
                                                variant={profile.isActive ? 'default' : 'secondary'}
                                                className={profile.isActive ? 'bg-emerald-500/10 text-emerald-500' : ''}
                                            >
                                                {profile.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                    </div>

                                    <p className="text-sm text-zinc-400 line-clamp-2 mb-3">
                                        {profile.description.vi || profile.description.en}
                                    </p>

                                    <div className="flex items-center justify-between text-xs text-zinc-500 mb-3">
                                        <span>Category: {profile.category}</span>
                                        <span>v{profile.version || 1}</span>
                                    </div>

                                    <div className="flex items-center gap-2 pt-3 border-t border-zinc-800">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => router.push(`/admin/profiles/${profile.id}`)}
                                            className="flex-1 text-zinc-400 hover:text-white"
                                        >
                                            <Edit2 className="w-4 h-4 mr-1" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleToggleActive(profile.id, profile.isActive)}
                                            className="text-zinc-400 hover:text-white"
                                        >
                                            {profile.isActive ? (
                                                <ToggleRight className="w-4 h-4 text-emerald-500" />
                                            ) : (
                                                <ToggleLeft className="w-4 h-4" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(profile.id, profile.name.vi || profile.name.en)}
                                            className="text-zinc-400 hover:text-red-400"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
