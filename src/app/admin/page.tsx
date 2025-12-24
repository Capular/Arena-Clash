"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminTournaments from "@/components/admin/AdminTournaments";
import AdminSidebar from "@/components/admin/AdminSidebar";
import gsap from "gsap";

export default function AdminPage() {
    const { user, isAdmin, loading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'tournaments' | 'users'>('tournaments');
    const mainRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!loading) {
            if (!user || !isAdmin) {
                router.replace('/');
            }
        }
    }, [user, isAdmin, loading, router]);

    // Page entrance animation
    useEffect(() => {
        if (mainRef.current && headerRef.current) {
            gsap.fromTo(
                headerRef.current,
                { y: -20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" }
            );
            gsap.fromTo(
                mainRef.current,
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.4, ease: "power2.out", delay: 0.1 }
            );
        }
    }, [activeTab]);

    if (loading || !user || !isAdmin) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="animate-spin text-primary mr-2" />
                <span className="font-rajdhani font-medium text-foreground">Verifying access...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex">
            <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            <main className="flex-1 ml-20 lg:ml-64 p-6 lg:p-8">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Header */}
                    <div ref={headerRef}>
                        <h1 className="text-2xl font-bold font-rajdhani text-foreground">
                            {activeTab === 'tournaments' ? 'Tournaments' : 'Users'}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {activeTab === 'tournaments'
                                ? 'Create and manage tournaments'
                                : 'Manage users and balances'
                            }
                        </p>
                    </div>

                    {/* Content */}
                    <div ref={mainRef} className="bg-card border border-border rounded-xl p-6">
                        {activeTab === 'tournaments' ? <AdminTournaments /> : <AdminUsers />}
                    </div>
                </div>
            </main>
        </div>
    );
}
