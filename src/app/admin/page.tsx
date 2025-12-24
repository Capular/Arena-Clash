"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { Loader2, Shield, Users, Trophy } from "lucide-react";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminTournaments from "@/components/admin/AdminTournaments";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminPage() {
    const { user, isAdmin, loading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'tournaments' | 'users'>('tournaments');

    useEffect(() => {
        if (!loading) {
            if (!user || !isAdmin) {
                router.replace('/');
            }
        }
    }, [user, isAdmin, loading, router]);

    if (loading || !user || !isAdmin) {
        return (
            <div className="flex h-screen items-center justify-center bg-black text-white">
                <Loader2 className="animate-spin text-primary mr-2" />
                <span className="font-rajdhani font-bold">Verifying Admin Access...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white font-sans flex">

            <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            <main className="flex-1 ml-20 lg:ml-64 p-6 md:p-12 overflow-y-auto w-full">
                <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-4xl font-black font-rajdhani uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">
                                Admin Console
                            </h1>
                            <p className="text-muted-foreground">Manage tournaments, users, and platform settings.</p>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-3xl p-6 md:p-8 min-h-[600px] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

                        {activeTab === 'tournaments' ? <AdminTournaments /> : <AdminUsers />}
                    </div>

                </div>
            </main>
        </div>
    );
}
