"use client";

import { useRef, useEffect, useState } from "react";
import { Users, Trophy, LogOut, ArrowLeft, Menu, Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import { useAuth } from "@/components/auth/AuthProvider";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";

export default function AdminSidebar() {
    const sidebarRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        gsap.fromTo(
            sidebarRef.current,
            { x: -50, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.5, ease: "power3.out" }
        );
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (isProfileMenuOpen) {
            gsap.fromTo(
                ".admin-profile-menu",
                { opacity: 0, y: 10, scale: 0.95 },
                { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: "power2.out" }
            );
        }
    }, [isProfileMenuOpen]);

    const menuItems = [
        { id: "tournaments", label: "Tournaments", icon: Trophy, path: "/admin/tournaments" },
        { id: "games", label: "Games", icon: Gamepad2, path: "/admin/games" },
        { id: "users", label: "Users", icon: Users, path: "/admin/users" },
    ];

    const isActive = (path: string) => pathname.startsWith(path);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/');
        } catch (error) {
            console.error("Logout error", error);
        }
    };

    return (
        <aside
            ref={sidebarRef}
            className="hidden lg:flex w-52 h-[100dvh] bg-background border-r border-border/40 flex-col justify-between fixed left-0 top-0 z-50 transition-all duration-300"
        >
            <div className="flex flex-col flex-1 min-h-0">
                {/* Header */}
                <div className="h-14 flex-shrink-0 flex items-center px-4">
                    <h1 className="font-rajdhani font-bold text-lg text-foreground tracking-wide">
                        Admin Panel
                    </h1>
                </div>

                {/* Navigation */}
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
                            <span className="font-rajdhani">{item.label}</span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Bottom Section */}
            <div className="px-3 pb-4 flex-shrink-0 space-y-2" ref={profileRef}>
                {/* Back to App */}
                <button
                    onClick={() => router.push('/')}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-200 text-sm font-medium"
                >
                    <ArrowLeft className="h-[18px] w-[18px]" />
                    <span className="font-rajdhani">Back to App</span>
                </button>

                {/* Profile Menu */}
                {isProfileMenuOpen && (
                    <div className="admin-profile-menu absolute bottom-20 left-3 right-3 bg-popover/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl py-1.5 z-50 ring-1 ring-white/5">
                        <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2.5 font-medium transition-colors"
                        >
                            <LogOut className="h-4 w-4" />
                            Log Out
                        </button>
                    </div>
                )}

                {/* Profile Badge */}
                <div
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className={cn(
                        "flex items-center gap-2.5 px-3 py-2.5 bg-muted/30 rounded-lg hover:bg-muted/50 transition-all cursor-pointer group select-none",
                        isProfileMenuOpen && "bg-muted/60 ring-1 ring-primary/20"
                    )}
                >
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary overflow-hidden flex-shrink-0">
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt="User" className="h-full w-full object-cover" />
                        ) : (
                            <span className="font-bold text-sm">A</span>
                        )}
                    </div>
                    <div className="flex-1 overflow-hidden min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">Admin</p>
                        <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                    </div>
                    <Menu size={14} className="text-muted-foreground opacity-50" />
                </div>
            </div>
        </aside>
    );
}
