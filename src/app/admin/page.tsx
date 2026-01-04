'use client';

// Videlix AI - Admin Dashboard

import { useState, useEffect } from 'react';
import {
    FileText,
    Users,
    Zap,
    TrendingUp,
    Clock,
    Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
    getAllProfiles,
    getAllUsers,
    getProfileUsageStats,
    FirebaseProfile,
    FirebaseUser
} from '@/lib/firebase/database';

interface StatsCard {
    title: string;
    value: string | number;
    icon: typeof FileText;
    change?: string;
    color: string;
}

export default function AdminDashboardPage() {
    const [profiles, setProfiles] = useState<FirebaseProfile[]>([]);
    const [users, setUsers] = useState<FirebaseUser[]>([]);
    const [usageStats, setUsageStats] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [profilesData, usersData, statsData] = await Promise.all([
                getAllProfiles(),
                getAllUsers(),
                getProfileUsageStats(),
            ]);
            setProfiles(profilesData);
            setUsers(usersData);
            setUsageStats(statsData);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const totalGenerations = Object.values(usageStats).reduce((a, b) => a + b, 0);
    const activeProfiles = profiles.filter(p => p.isActive).length;
    const proUsers = users.filter(u => u.tier === 'pro').length;

    const stats: StatsCard[] = [
        {
            title: 'Total Profiles',
            value: profiles.length,
            icon: FileText,
            change: `${activeProfiles} active`,
            color: 'blue',
        },
        {
            title: 'Total Users',
            value: users.length,
            icon: Users,
            change: `${proUsers} Pro`,
            color: 'emerald',
        },
        {
            title: 'Total Generations',
            value: totalGenerations.toLocaleString(),
            icon: Zap,
            color: 'purple',
        },
        {
            title: 'Active Today',
            value: users.filter(u => {
                const today = new Date().setHours(0, 0, 0, 0);
                return u.lastUsed >= today;
            }).length,
            icon: Activity,
            color: 'orange',
        },
    ];

    const topProfiles = profiles
        .map(p => ({ ...p, usage: usageStats[p.id] || 0 }))
        .sort((a, b) => b.usage - a.usage)
        .slice(0, 5);

    const recentUsers = [...users]
        .sort((a, b) => b.lastUsed - a.lastUsed)
        .slice(0, 5);

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
            <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <Card key={index} className="bg-zinc-900 border-zinc-800">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-zinc-400">{stat.title}</p>
                                            <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                                            {stat.change && (
                                                <p className="text-xs text-zinc-500 mt-1">{stat.change}</p>
                                            )}
                                        </div>
                                        <div className={`w-12 h-12 rounded-lg bg-${stat.color}-500/10 flex items-center justify-center`}>
                                            <Icon className={`w-6 h-6 text-${stat.color}-500`} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Profiles */}
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-lg text-white flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-emerald-500" />
                                Top Profiles
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {topProfiles.length === 0 ? (
                                    <p className="text-zinc-500 text-sm">No usage data yet</p>
                                ) : (
                                    topProfiles.map((profile, index) => (
                                        <div
                                            key={profile.id}
                                            className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="w-6 h-6 rounded bg-zinc-700 flex items-center justify-center text-xs text-zinc-400">
                                                    {index + 1}
                                                </span>
                                                <div>
                                                    <p className="text-sm text-white">{profile.name.vi || profile.name.en}</p>
                                                    <p className="text-xs text-zinc-500">{profile.category}</p>
                                                </div>
                                            </div>
                                            <span className="text-sm text-zinc-400">{profile.usage} uses</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Users */}
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-lg text-white flex items-center gap-2">
                                <Clock className="w-5 h-5 text-blue-500" />
                                Recent Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {recentUsers.length === 0 ? (
                                    <p className="text-zinc-500 text-sm">No users yet</p>
                                ) : (
                                    recentUsers.map((user) => (
                                        <div
                                            key={user.id}
                                            className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-400">
                                                    {user.email?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm text-white">{user.email}</p>
                                                    <p className="text-xs text-zinc-500">
                                                        {user.tier === 'pro' ? '⭐ Pro' : 'Free'} • {user.totalUsage || 0} generations
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-zinc-500">
                                                {new Date(user.lastUsed).toLocaleDateString()}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
