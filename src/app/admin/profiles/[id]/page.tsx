'use client';

// Videlix AI - Profile Edit Page

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, History, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { PromptEditor } from '@/components/admin/PromptEditor';
import {
    getProfileById,
    updateProfile,
    createProfile,
    getProfileVersions,
    FirebaseProfile,
    ProfileVersion
} from '@/lib/firebase/firestore';

const CATEGORIES = ['education', 'entertainment', 'business', 'lifestyle', 'news', 'review'];
const ICONS = ['📝', '🎓', '📹', '⭐', '📰', '💡', '🎬', '🎯', '📊', '🔥'];

const defaultProfile: Omit<FirebaseProfile, 'id' | 'createdAt' | 'updatedAt' | 'version'> = {
    name: { en: '', vi: '' },
    description: { en: '', vi: '' },
    icon: '📝',
    category: 'education',
    isActive: true,
    isPremium: false,
    prompts: {
        idea: { en: '', vi: '' },
        outline: { en: '', vi: '' },
        script: { en: '', vi: '' },
        metadata: { en: '', vi: '' },
    },
};

export default function ProfileEditPage() {
    const router = useRouter();
    const params = useParams();
    const profileId = params.id as string;
    const isNew = profileId === 'new';

    const [profile, setProfile] = useState<FirebaseProfile | null>(null);
    const [versions, setVersions] = useState<ProfileVersion[]>([]);
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('basic');

    useEffect(() => {
        if (!isNew) {
            loadProfile();
        } else {
            setProfile({ id: '', ...defaultProfile, version: 1, createdAt: null as any, updatedAt: null as any });
        }
    }, [profileId, isNew]);

    const loadProfile = async () => {
        try {
            const data = await getProfileById(profileId);
            if (data) {
                setProfile(data);
                const versionData = await getProfileVersions(profileId);
                setVersions(versionData);
            } else {
                router.push('/admin/profiles');
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (updates: Partial<FirebaseProfile>) => {
        if (profile) {
            setProfile({ ...profile, ...updates });
        }
    };

    const handleSave = async () => {
        if (!profile) return;
        setSaving(true);

        try {
            if (isNew) {
                const { id, createdAt, updatedAt, version, ...data } = profile;
                const newId = await createProfile(data);
                router.push(`/admin/profiles/${newId}`);
            } else {
                await updateProfile(profileId, profile, 'admin', 'Manual update');
                await loadProfile();
            }
        } catch (error) {
            console.error('Failed to save profile:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </AdminLayout>
        );
    }

    if (!profile) {
        return null;
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push('/admin/profiles')}
                            className="text-zinc-400 hover:text-white"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                        <div>
                            <h2 className="text-xl font-semibold text-white">
                                {isNew ? 'New Profile' : 'Edit Profile'}
                            </h2>
                            {!isNew && (
                                <p className="text-sm text-zinc-500">
                                    Version {profile.version} • Last updated {profile.updatedAt?.toDate?.()?.toLocaleString() || 'N/A'}
                                </p>
                            )}
                        </div>
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-emerald-600 hover:bg-emerald-700"
                    >
                        {saving ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        {isNew ? 'Create Profile' : 'Save Changes'}
                    </Button>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="bg-zinc-800 border-zinc-700">
                        <TabsTrigger value="basic" className="data-[state=active]:bg-zinc-700">
                            Basic Info
                        </TabsTrigger>
                        <TabsTrigger value="prompts" className="data-[state=active]:bg-zinc-700">
                            Prompts
                        </TabsTrigger>
                        {!isNew && (
                            <TabsTrigger value="history" className="data-[state=active]:bg-zinc-700">
                                <History className="w-4 h-4 mr-1" />
                                History
                            </TabsTrigger>
                        )}
                    </TabsList>

                    {/* Basic Info Tab */}
                    <TabsContent value="basic" className="mt-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Name */}
                            <Card className="bg-zinc-900 border-zinc-800">
                                <CardHeader>
                                    <CardTitle className="text-sm text-zinc-300">Profile Name</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className="text-xs text-zinc-500 block mb-1">English</label>
                                        <input
                                            type="text"
                                            value={profile.name.en}
                                            onChange={(e) => handleChange({ name: { ...profile.name, en: e.target.value } })}
                                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                                            placeholder="Explainer Video"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-zinc-500 block mb-1">Tiếng Việt</label>
                                        <input
                                            type="text"
                                            value={profile.name.vi}
                                            onChange={(e) => handleChange({ name: { ...profile.name, vi: e.target.value } })}
                                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                                            placeholder="Video Giải Thích"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Description */}
                            <Card className="bg-zinc-900 border-zinc-800">
                                <CardHeader>
                                    <CardTitle className="text-sm text-zinc-300">Description</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className="text-xs text-zinc-500 block mb-1">English</label>
                                        <textarea
                                            value={profile.description.en}
                                            onChange={(e) => handleChange({ description: { ...profile.description, en: e.target.value } })}
                                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white min-h-[60px]"
                                            placeholder="Short description..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-zinc-500 block mb-1">Tiếng Việt</label>
                                        <textarea
                                            value={profile.description.vi}
                                            onChange={(e) => handleChange({ description: { ...profile.description, vi: e.target.value } })}
                                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white min-h-[60px]"
                                            placeholder="Mô tả ngắn..."
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Settings */}
                            <Card className="bg-zinc-900 border-zinc-800">
                                <CardHeader>
                                    <CardTitle className="text-sm text-zinc-300">Settings</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className="text-xs text-zinc-500 block mb-1">Category</label>
                                        <select
                                            value={profile.category}
                                            onChange={(e) => handleChange({ category: e.target.value })}
                                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                                        >
                                            {CATEGORIES.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-zinc-500 block mb-1">Icon</label>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {ICONS.map(icon => (
                                                <button
                                                    key={icon}
                                                    onClick={() => handleChange({ icon })}
                                                    className={`w-10 h-10 rounded-lg border flex items-center justify-center text-lg ${profile.icon === icon
                                                        ? 'border-blue-500 bg-blue-500/10'
                                                        : 'border-zinc-700 hover:border-zinc-600'
                                                        }`}
                                                >
                                                    {icon}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Toggles */}
                            <Card className="bg-zinc-900 border-zinc-800">
                                <CardHeader>
                                    <CardTitle className="text-sm text-zinc-300">Status</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <label className="flex items-center justify-between cursor-pointer">
                                        <span className="text-zinc-300">Active</span>
                                        <input
                                            type="checkbox"
                                            checked={profile.isActive}
                                            onChange={(e) => handleChange({ isActive: e.target.checked })}
                                            className="w-5 h-5 rounded bg-zinc-800 border-zinc-700"
                                        />
                                    </label>
                                    <label className="flex items-center justify-between cursor-pointer">
                                        <span className="text-zinc-300">Premium Only</span>
                                        <input
                                            type="checkbox"
                                            checked={profile.isPremium}
                                            onChange={(e) => handleChange({ isPremium: e.target.checked })}
                                            className="w-5 h-5 rounded bg-zinc-800 border-zinc-700"
                                        />
                                    </label>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Prompts Tab */}
                    <TabsContent value="prompts" className="mt-4">
                        <PromptEditor
                            profile={profile}
                            onChange={handleChange}
                            onSave={handleSave}
                            saving={saving}
                        />
                    </TabsContent>

                    {/* History Tab */}
                    <TabsContent value="history" className="mt-4">
                        <Card className="bg-zinc-900 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-sm text-zinc-300">Version History</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {versions.length === 0 ? (
                                    <p className="text-zinc-500">No version history available</p>
                                ) : (
                                    <div className="space-y-3">
                                        {versions.sort((a, b) => b.version - a.version).map((version) => (
                                            <div
                                                key={version.version}
                                                className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg"
                                            >
                                                <div>
                                                    <p className="text-white">Version {version.version}</p>
                                                    <p className="text-xs text-zinc-500">
                                                        {version.changeNote} • {version.changedAt?.toDate?.()?.toLocaleString() || 'N/A'}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-zinc-700 text-zinc-400"
                                                >
                                                    Rollback
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AdminLayout>
    );
}
