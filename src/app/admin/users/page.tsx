'use client';

// Videlix AI - Admin User Management

import { useState, useEffect } from 'react';
import {
    Search,
    Crown,
    Shield,
    User as UserIcon,
    MoreVertical,
    Mail,
    Calendar,
    Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
    subscribeToUsers,
    updateUserTier,
    updateUserRole,
    FirebaseUser
} from '@/lib/firebase/firestore';

export default function AdminUsersPage() {
    const [users, setUsers] = useState<FirebaseUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'free' | 'pro' | 'admin'>('all');

    useEffect(() => {
        const unsubscribe = subscribeToUsers((data) => {
            setUsers(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.email?.toLowerCase().includes(search.toLowerCase()) ||
            user.displayName?.toLowerCase().includes(search.toLowerCase());

        const matchesFilter =
            filter === 'all' ||
            (filter === 'admin' && user.role === 'admin') ||
            (filter === 'pro' && user.tier === 'pro') ||
            (filter === 'free' && user.tier === 'free');

        return matchesSearch && matchesFilter;
    });

    const handleTierChange = async (userId: string, tier: 'free' | 'pro') => {
        await updateUserTier(userId, tier);
    };

    const handleRoleChange = async (userId: string, role: 'admin' | 'user') => {
        if (confirm(`Are you sure you want to ${role === 'admin' ? 'grant admin access to' : 'revoke admin access from'} this user?`)) {
            await updateUserRole(userId, role);
        }
    };

    const stats = {
        total: users.length,
        pro: users.filter(u => u.tier === 'pro').length,
        admins: users.filter(u => u.role === 'admin').length,
        activeToday: users.filter(u => {
            const today = new Date().setHours(0, 0, 0, 0);
            const lastUsed = u.lastUsed?.toDate?.()?.getTime() || 0;
            return lastUsed >= today;
        }).length,
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardContent className="p-4">
                            <p className="text-xs text-zinc-500">Total Users</p>
                            <p className="text-2xl font-bold text-white">{stats.total}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardContent className="p-4">
                            <p className="text-xs text-zinc-500">Pro Users</p>
                            <p className="text-2xl font-bold text-yellow-500">{stats.pro}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardContent className="p-4">
                            <p className="text-xs text-zinc-500">Admins</p>
                            <p className="text-2xl font-bold text-blue-500">{stats.admins}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardContent className="p-4">
                            <p className="text-xs text-zinc-500">Active Today</p>
                            <p className="text-2xl font-bold text-emerald-500">{stats.activeToday}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search users..."
                            className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        {(['all', 'free', 'pro', 'admin'] as const).map((f) => (
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

                {/* Users Table */}
                {loading ? (
                    <div className="flex items-center justify-center h-32">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-zinc-800/50">
                                    <tr>
                                        <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">User</th>
                                        <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Role</th>
                                        <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Tier</th>
                                        <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Usage</th>
                                        <th className="text-left text-xs font-medium text-zinc-400 px-4 py-3">Last Active</th>
                                        <th className="text-right text-xs font-medium text-zinc-400 px-4 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                    {filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-8 text-zinc-500">
                                                No users found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map((user) => (
                                            <tr key={user.id} className="hover:bg-zinc-800/30">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
                                                            {user.role === 'admin' ? (
                                                                <Shield className="w-5 h-5 text-blue-500" />
                                                            ) : (
                                                                <UserIcon className="w-5 h-5 text-zinc-400" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-white">{user.displayName || 'User'}</p>
                                                            <p className="text-xs text-zinc-500">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge
                                                        variant={user.role === 'admin' ? 'default' : 'secondary'}
                                                        className={user.role === 'admin' ? 'bg-blue-500/10 text-blue-500' : 'bg-zinc-800'}
                                                    >
                                                        {user.role === 'admin' ? 'Admin' : 'User'}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge
                                                        variant={user.tier === 'pro' ? 'default' : 'secondary'}
                                                        className={user.tier === 'pro' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-zinc-800'}
                                                    >
                                                        {user.tier === 'pro' ? (
                                                            <><Crown className="w-3 h-3 mr-1" /> Pro</>
                                                        ) : 'Free'}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1 text-sm text-zinc-400">
                                                        <Zap className="w-3 h-3" />
                                                        {user.totalUsage || 0}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-sm text-zinc-500">
                                                        {user.lastUsed?.toDate?.()?.toLocaleDateString() || 'Never'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleTierChange(user.id, user.tier === 'pro' ? 'free' : 'pro')}
                                                            className="text-xs text-zinc-400 hover:text-white"
                                                        >
                                                            {user.tier === 'pro' ? 'Downgrade' : 'Upgrade'}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleRoleChange(user.id, user.role === 'admin' ? 'user' : 'admin')}
                                                            className="text-xs text-zinc-400 hover:text-white"
                                                        >
                                                            {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>
        </AdminLayout>
    );
}
