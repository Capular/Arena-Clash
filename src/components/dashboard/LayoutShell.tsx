"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import MobileNav from "@/components/dashboard/MobileNav";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import LoginModal from "@/components/auth/LoginModal";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const { user } = useAuth();

    return (
        <div className="flex min-h-screen bg-background premium-bg-gradient pb-20 lg:pb-0">
            <Sidebar onLoginClick={() => setIsLoginOpen(true)} />
            <MobileNav onLoginClick={() => setIsLoginOpen(true)} user={user} />
            <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

            <div className="flex-1 lg:pl-52 transition-all duration-300">
                <DashboardHeader />
                <main className="p-4 lg:px-5 w-full max-w-full mx-auto pt-4">
                    {children}
                </main>
            </div>
        </div>
    );
}
