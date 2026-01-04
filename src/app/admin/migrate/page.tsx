'use client';

// Videlix AI - Admin Migration Tool

import { useState } from 'react';
import { Upload, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { createProfile, FirebaseProfile } from '@/lib/firebase/firestore';
import localProfiles from '@/lib/prompts/profiles.json';

export default function MigratePage() {
    const [migrating, setMigrating] = useState(false);
    const [results, setResults] = useState<{ id: string; name: string; success: boolean; error?: string }[]>([]);

    const handleMigrate = async () => {
        setMigrating(true);
        setResults([]);

        const profiles = localProfiles.profiles;
        const newResults: typeof results = [];

        for (const profile of profiles) {
            try {
                const profileData: Omit<FirebaseProfile, 'id' | 'createdAt' | 'updatedAt' | 'version'> = {
                    name: profile.name,
                    description: profile.description,
                    icon: profile.icon,
                    category: { en: 'Education', vi: 'Giáo dục' },
                    isActive: true,
                    isPremium: false,
                    prompts: profile.prompts,
                };

                await createProfile(profileData);
                newResults.push({ id: profile.id, name: profile.name.vi, success: true });
            } catch (error) {
                newResults.push({
                    id: profile.id,
                    name: profile.name.vi,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        setResults(newResults);
        setMigrating(false);
    };

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return (
        <AdminLayout>
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-white mb-2">Migrate Local Profiles to Firebase</h2>
                    <p className="text-zinc-400">
                        This will copy all {localProfiles.profiles.length} profiles from the local JSON file to Firestore.
                    </p>
                </div>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-sm text-zinc-300">Local Profiles Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {localProfiles.profiles.map(profile => (
                                <div key={profile.id} className="flex items-center gap-3 p-2 bg-zinc-800/50 rounded-lg">
                                    <span className="text-lg">{profile.icon}</span>
                                    <div>
                                        <p className="text-sm text-white">{profile.name.vi}</p>
                                        <p className="text-xs text-zinc-500">{profile.name.en}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Button
                    onClick={handleMigrate}
                    disabled={migrating}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                >
                    {migrating ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Migrating...
                        </>
                    ) : (
                        <>
                            <Upload className="w-4 h-4 mr-2" />
                            Start Migration
                        </>
                    )}
                </Button>

                {results.length > 0 && (
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-sm text-zinc-300">
                                Migration Results: {successCount} success, {failCount} failed
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {results.map(result => (
                                    <div
                                        key={result.id}
                                        className={`flex items-center justify-between p-2 rounded-lg ${result.success ? 'bg-emerald-500/10' : 'bg-red-500/10'
                                            }`}
                                    >
                                        <span className="text-sm text-white">{result.name}</span>
                                        {result.success ? (
                                            <Check className="w-4 h-4 text-emerald-500" />
                                        ) : (
                                            <div className="flex items-center gap-2 text-red-400">
                                                <AlertCircle className="w-4 h-4" />
                                                <span className="text-xs">{result.error}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AdminLayout>
    );
}
