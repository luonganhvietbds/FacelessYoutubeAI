'use client';

// Videlix AI - Admin Settings

import { useState, useEffect } from 'react';
import { Save, AlertTriangle, Bell, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { getSettings, updateSettings, AppSettings } from '@/lib/firebase/firestore';

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<AppSettings>({
        rateLimits: { free: 3, pro: -1 },
        maintenance: false,
        announcement: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await getSettings();
            setSettings(data);
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateSettings(settings);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Failed to save settings:', error);
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

    return (
        <AdminLayout>
            <div className="space-y-6 max-w-3xl">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-white">Settings</h2>
                        <p className="text-sm text-zinc-400">Configure system-wide settings</p>
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className={saved ? 'bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700'}
                    >
                        {saving ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        {saved ? 'Saved!' : 'Save Settings'}
                    </Button>
                </div>

                {/* Rate Limits */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-yellow-500" />
                            Rate Limits
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-zinc-500 block mb-2">
                                    Free Tier (generations/day)
                                </label>
                                <input
                                    type="number"
                                    value={settings.rateLimits.free}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        rateLimits: { ...settings.rateLimits, free: parseInt(e.target.value) || 0 }
                                    })}
                                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                                    min={0}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500 block mb-2">
                                    Pro Tier (generations/day, -1 = unlimited)
                                </label>
                                <input
                                    type="number"
                                    value={settings.rateLimits.pro}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        rateLimits: { ...settings.rateLimits, pro: parseInt(e.target.value) || -1 }
                                    })}
                                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                                    min={-1}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-zinc-500">
                            Set -1 for unlimited generations. Free tier default: 3, Pro tier default: unlimited
                        </p>
                    </CardContent>
                </Card>

                {/* Maintenance Mode */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                            Maintenance Mode
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <label className="flex items-center justify-between cursor-pointer">
                            <div>
                                <p className="text-zinc-300">Enable Maintenance Mode</p>
                                <p className="text-xs text-zinc-500">
                                    When enabled, users will see a maintenance message instead of the app
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                checked={settings.maintenance}
                                onChange={(e) => setSettings({ ...settings, maintenance: e.target.checked })}
                                className="w-5 h-5 rounded bg-zinc-800 border-zinc-700"
                            />
                        </label>

                        {settings.maintenance && (
                            <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                                <p className="text-sm text-orange-400">
                                    ⚠️ Maintenance mode is ON. Users cannot access the application.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Announcement */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
                            <Bell className="w-4 h-4 text-blue-500" />
                            System Announcement
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <textarea
                            value={settings.announcement || ''}
                            onChange={(e) => setSettings({ ...settings, announcement: e.target.value })}
                            placeholder="Enter an announcement to show to all users (leave empty to hide)"
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white min-h-[100px] placeholder:text-zinc-500"
                        />
                        <p className="text-xs text-zinc-500 mt-2">
                            This message will appear as a banner at the top of the application
                        </p>
                    </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="bg-zinc-900 border-red-900/50">
                    <CardHeader>
                        <CardTitle className="text-sm text-red-400 flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Danger Zone
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-zinc-300">Reset All Analytics</p>
                                <p className="text-xs text-zinc-500">Clear all usage statistics and analytics data</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-red-800 text-red-400 hover:bg-red-500/10"
                            >
                                Reset
                            </Button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-zinc-300">Export All Data</p>
                                <p className="text-xs text-zinc-500">Download profiles, users, and settings as JSON</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-zinc-700 text-zinc-400"
                            >
                                Export
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
