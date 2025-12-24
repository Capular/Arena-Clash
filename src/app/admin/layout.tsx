"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isAdmin, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user || !isAdmin) {
                router.replace('/');
            }
        }
    }, [user, isAdmin, loading, router]);

    if (loading || !user || !isAdmin) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="animate-spin text-primary mr-2" />
                <span className="font-rajdhani font-medium text-foreground">Verifying access...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex premium-bg-gradient">
            <AdminSidebar />
            <div className="flex-1 lg:pl-44 transition-all duration-300">
                <main className="p-4 lg:px-5 w-full max-w-full mx-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
