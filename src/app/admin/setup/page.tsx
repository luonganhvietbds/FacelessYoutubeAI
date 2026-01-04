'use client';

// Videlix AI - Database Setup Page

import { useState, useEffect } from 'react';
import { Database, Check, AlertCircle, RefreshCw, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface DatabaseStatus {
    profiles: number;
    settings: number;
    users: number;
    isEmpty: boolean;
}

export default function SetupPage() {
    const [status, setStatus] = useState<DatabaseStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/seed');
            const data = await res.json();

            if (data.success) {
                setStatus(data.status);
                setMessage(data.message);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to check database status');
        } finally {
            setLoading(false);
        }
    };

    const seedDatabase = async () => {
        setSeeding(true);
        setError('');
        setMessage('');

        try {
            const res = await fetch('/api/seed', { method: 'POST' });
            const data = await res.json();

            if (data.success) {
                setMessage(data.message);
                // Refresh status
                await checkStatus();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to seed database');
        } finally {
            setSeeding(false);
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center mx-auto mb-4">
                        <Database className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-semibold text-white mb-2">Database Setup</h2>
                    <p className="text-zinc-400">
                        Initialize Firestore with default profiles and settings
                    </p>
                </div>

                {/* Status Card */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm text-zinc-300">Database Status</CardTitle>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={checkStatus}
                                disabled={loading}
                                className="text-zinc-400"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-4">
                                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : status ? (
                            <div className="space-y-3">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-3 bg-zinc-800/50 rounded-lg">
                                        <p className="text-2xl font-bold text-white">{status.profiles}</p>
                                        <p className="text-xs text-zinc-500">Profiles</p>
                                    </div>
                                    <div className="text-center p-3 bg-zinc-800/50 rounded-lg">
                                        <p className="text-2xl font-bold text-white">{status.users}</p>
                                        <p className="text-xs text-zinc-500">Users</p>
                                    </div>
                                    <div className="text-center p-3 bg-zinc-800/50 rounded-lg">
                                        <p className="text-2xl font-bold text-white">{status.settings}</p>
                                        <p className="text-xs text-zinc-500">Settings</p>
                                    </div>
                                </div>

                                {status.isEmpty ? (
                                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                        <p className="text-sm text-yellow-400">
                                            ⚠️ Database is empty. Click "Seed Database" to initialize.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                                        <p className="text-sm text-emerald-400">
                                            ✓ Database is initialized and ready to use.
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </CardContent>
                </Card>

                {/* Messages */}
                {message && (
                    <div className="flex items-start gap-2 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                        <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-emerald-400">{message}</p>
                    </div>
                )}

                {error && (
                    <div className="flex items-start gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-400">{error}</p>
                    </div>
                )}

                {/* Seed Button */}
                <Button
                    onClick={seedDatabase}
                    disabled={seeding || (status !== null && !status.isEmpty)}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                    {seeding ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Seeding Database...
                        </>
                    ) : (
                        <>
                            <Upload className="w-4 h-4 mr-2" />
                            Seed Database
                        </>
                    )}
                </Button>

                {/* Data Preview */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-sm text-zinc-300">Data to be Seeded</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-2 bg-zinc-800/50 rounded-lg">
                                <span className="text-sm text-zinc-300">📝 Explainer Video</span>
                                <span className="text-xs text-zinc-500">Profile</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-zinc-800/50 rounded-lg">
                                <span className="text-sm text-zinc-300">🎓 Tutorial / How-To</span>
                                <span className="text-xs text-zinc-500">Profile</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-zinc-800/50 rounded-lg">
                                <span className="text-sm text-zinc-300">📹 Vlog / Personal</span>
                                <span className="text-xs text-zinc-500">Profile</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-zinc-800/50 rounded-lg">
                                <span className="text-sm text-zinc-300">⭐ Product Review</span>
                                <span className="text-xs text-zinc-500">Profile</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-zinc-800/50 rounded-lg">
                                <span className="text-sm text-zinc-300">📰 News / Commentary</span>
                                <span className="text-xs text-zinc-500">Profile</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-zinc-800/50 rounded-lg border border-zinc-700">
                                <span className="text-sm text-zinc-300">⚙️ Default Settings</span>
                                <span className="text-xs text-zinc-500">Config</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
