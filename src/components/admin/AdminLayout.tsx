'use client';

// Videlix AI - Admin Layout

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    FileText,
    Users,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { subscribeToAuthState, logOut, AdminUser } from '@/lib/firebase/auth';

interface AdminLayoutProps {
    children: React.ReactNode;
}

const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
    { id: 'profiles', label: 'Profiles', icon: FileText, href: '/admin/profiles' },
    { id: 'users', label: 'Users', icon: Users, href: '/admin/users' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/admin/settings' },
];

export function AdminLayout({ children }: AdminLayoutProps) {
    const router = useRouter();
    const [user, setUser] = useState<AdminUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [currentPath, setCurrentPath] = useState('');

    useEffect(() => {
        setCurrentPath(window.location.pathname);

        const unsubscribe = subscribeToAuthState((authUser) => {
            setUser(authUser);
            setLoading(false);

            if (!authUser || !authUser.isAdmin) {
                router.push('/admin/login');
            }
        });

        return () => unsubscribe();
    }, [router]);

    const handleLogout = async () => {
        await logOut();
        router.push('/admin/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user || !user.isAdmin) {
        return null;
    }

    return (
        <div className="min-h-screen bg-zinc-950 flex">
            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed left-0 top-0 h-full bg-zinc-900 border-r border-zinc-800 transition-all duration-300 z-50",
                    sidebarOpen ? "w-64" : "w-16"
                )}
            >
                {/* Logo */}
                <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-4">
                    {sidebarOpen && (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                                <span className="text-white font-bold text-sm">V</span>
                            </div>
                            <span className="text-white font-semibold">Admin</span>
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="text-zinc-400 hover:text-white"
                    >
                        {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                    </Button>
                </div>

                {/* Nav Items */}
                <nav className="p-2 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentPath === item.href ||
                            (item.href !== '/admin' && currentPath.startsWith(item.href));

                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setCurrentPath(item.href);
                                    router.push(item.href);
                                }}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                                    isActive
                                        ? "bg-blue-500/10 text-blue-400"
                                        : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                                )}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                {sidebarOpen && <span className="text-sm">{item.label}</span>}
                            </button>
                        );
                    })}
                </nav>

                {/* User & Logout */}
                <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-zinc-800">
                    {sidebarOpen && (
                        <div className="px-3 py-2 mb-2">
                            <p className="text-xs text-zinc-500">Signed in as</p>
                            <p className="text-sm text-zinc-300 truncate">{user.email}</p>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0" />
                        {sidebarOpen && <span className="text-sm">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main
                className={cn(
                    "flex-1 transition-all duration-300",
                    sidebarOpen ? "ml-64" : "ml-16"
                )}
            >
                {/* Top Bar */}
                <header className="h-16 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between px-6">
                    <div>
                        <h1 className="text-lg font-semibold text-white">
                            {navItems.find(item =>
                                currentPath === item.href ||
                                (item.href !== '/admin' && currentPath.startsWith(item.href))
                            )?.label || 'Dashboard'}
                        </h1>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/')}
                        className="border-zinc-700 text-zinc-400 hover:text-white"
                    >
                        Back to App
                    </Button>
                </header>

                {/* Page Content */}
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
