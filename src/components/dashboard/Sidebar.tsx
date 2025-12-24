"use client";

import { usePathname, useRouter } from "next/navigation";
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
    onLoginClick: () => void;
}

export default function Sidebar({ onLoginClick }: SidebarProps) {
    const sidebarRef = useRef(null);
    const { user, loading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        gsap.fromTo(
            sidebarRef.current,
            { x: -50, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.5, ease: "power3.out" }
        );
    }, []);

    const menuItems = [
        { id: "tournaments", label: "Tournaments", icon: Gamepad2, path: "/tournaments" },
        { id: "my-registrations", label: "My Registrations", icon: ClipboardList, path: "/registrations" },
        { id: "wallet", label: "Wallet", icon: Wallet, path: "/wallet" },
    ];

    const isActive = (path: string) => {
        if (path === "/tournaments" && (pathname === "/" || pathname === "/tournaments")) return true;
        return pathname.startsWith(path);
    };

    const handleLogout = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await signOut(auth);
            router.push("/");
        } catch (error) {
            console.error("Logout error", error);
        }
    };

    return (
        <aside
            ref={sidebarRef}
            className="hidden lg:flex w-64 h-[100dvh] bg-background flex-col justify-between fixed left-0 top-0 z-50 transition-all duration-300"
        >
            <div className="flex flex-col flex-1 min-h-0">
                {/* Logo Header - Minimal, No Border */}
                <div className="h-14 flex-shrink-0 flex items-center px-4">
                    <h1 className="font-rajdhani font-bold text-lg text-foreground tracking-wide">
                        Arena Clash
                    </h1>
                </div>

                {/* Navigation - Clean spacing */}
                <nav className="flex-1 overflow-y-auto px-3 pt-2 space-y-1 custom-scrollbar">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => router.push(item.path)}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium",
                                isActive(item.path)
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            )}
                        >
                            <item.icon className="h-[18px] w-[18px]" />
                            <span className="font-rajdhani">
                                {item.label}
                            </span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Bottom Section - Clean, Minimal */}
            <div className="px-3 pb-4 flex-shrink-0">
                {!loading && user ? (
                    <div className="space-y-2">
                        {/* Settings Button - Subtle */}
                        <button
                            onClick={() => router.push("/settings")}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium",
                                pathname === "/settings"
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            )}
                        >
                            <Settings className="h-[18px] w-[18px]" />
                            <span className="font-rajdhani">Settings</span>
                        </button>

                        {/* User Profile Card */}
                        <div className="flex items-center gap-2.5 px-3 py-2.5 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary overflow-hidden flex-shrink-0">
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="User" className="h-full w-full object-cover" />
                                ) : (
                                    <User size={16} />
                                )}
                            </div>
                            <div className="flex-1 overflow-hidden min-w-0">
                                <p className="text-xs font-semibold text-foreground leading-tight truncate">
                                    {user.displayName || "Gamer"}
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                    {user.email}
                                </p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                title="Logout"
                            >
                                <LogOut size={14} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={onLoginClick}
                        className="w-full btn-premium text-sm py-2.5 rounded-lg font-rajdhani"
                    >
                        Login
                    </button>
                )}
            </div>
        </aside>
    );
}
