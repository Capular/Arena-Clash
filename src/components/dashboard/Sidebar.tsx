"use client";

import { usePathname } from "next/navigation";
import { Gamepad2, Wallet, Settings, Menu, User, LogOut, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dispatch, SetStateAction } from "react";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useAuth } from "@/components/auth/AuthProvider";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import LoginModal from "@/components/auth/LoginModal";

interface SidebarProps {
    activeTab: string;
    setActiveTab: Dispatch<SetStateAction<string>>;
    onLoginClick: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, onLoginClick }: SidebarProps) {
    const sidebarRef = useRef(null);
    const { user, loading } = useAuth();
    // Removed local isLoginOpen

    useEffect(() => {
        gsap.fromTo(
            sidebarRef.current,
            { x: -50, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.5, ease: "power3.out" }
        );
    }, []);

    const menuItems = [
        { id: "tournaments", label: "Tournaments", icon: Gamepad2 },
        { id: "my-registrations", label: "My Registrations", icon: ClipboardList },
        { id: "wallet", label: "Wallet", icon: Wallet },
    ];

    const handleLogout = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout error", error);
        }
    };

    return (
        <aside
            ref={sidebarRef}
            className="hidden lg:flex w-64 h-[100dvh] border-r border-border bg-card/50 backdrop-blur-xl flex-col justify-between fixed left-0 top-0 z-50 transition-all duration-300"
        >
            <div className="flex flex-col flex-1 min-h-0">
                <div className="h-16 flex-shrink-0 flex items-center justify-center border-b border-border/50">
                    <h1 className="font-rajdhani font-bold text-xl text-primary tracking-wide uppercase">
                        Arena Clash
                    </h1>
                </div>

                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 no-scrollbar">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden",
                                activeTab === item.id
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <item.icon className="h-[18px] w-[18px] z-10" />
                            <span className="hidden lg:block font-medium z-10 font-rajdhani text-sm">
                                {item.label}
                            </span>
                            {activeTab === item.id && (
                                <div className="absolute inset-0 bg-primary/10 border-r-2 border-primary" />
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="px-3 py-3 border-t border-border/50 flex-shrink-0">
                {!loading && user ? (
                    <div
                        onClick={() => setActiveTab("settings")}
                        className="flex items-center gap-2.5 px-2.5 py-2 bg-black/20 rounded-lg relative group cursor-pointer hover:bg-black/30 transition-colors"
                    >
                        <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-primary overflow-hidden flex-shrink-0">
                            {user.photoURL ? <img src={user.photoURL} alt="User" className="h-full w-full object-cover" /> : <User size={14} />}
                        </div>
                        <div className="hidden lg:block flex-1 overflow-hidden min-w-0">
                            <p className="text-xs font-semibold text-white leading-tight truncate">{user.displayName || "Gamer"}</p>
                            <p className="text-[10px] text-muted-foreground truncate mt-0.5">{user.email}</p>
                        </div>
                        <button onClick={handleLogout} className="absolute right-1.5 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <LogOut size={14} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={onLoginClick}
                        className="w-full bg-primary text-black py-2.5 rounded-lg font-bold font-rajdhani text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                    >
                        Login
                    </button>
                )}
            </div>
        </aside>
    );
}
