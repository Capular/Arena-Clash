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
    const navRef = useRef<HTMLDivElement>(null);
    const { user, isAdmin } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

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
            className="w-16 lg:w-52 h-screen bg-background border-r border-border/40 flex flex-col justify-between fixed left-0 top-0 z-50"
        >
            <div className="flex flex-col flex-1 min-h-0">
                {/* Header */}
                <div className="h-14 flex items-center justify-center lg:justify-start lg:px-4">
                    <h1 className="hidden lg:block font-rajdhani font-bold text-lg text-foreground">
                        Admin Panel
                    </h1>
                    <Trophy className="lg:hidden h-5 w-5 text-primary" />
                </div>

                {/* Navigation */}
                <nav ref={navRef} className="flex-1 px-3 pt-2 space-y-1">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => router.push(item.path)}
                            className={cn(
                                "w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium",
                                isActive(item.path)
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            )}
                        >
                            <item.icon className="h-[18px] w-[18px]" />
                            <span className="hidden lg:block font-rajdhani">{item.label}</span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Bottom Section */}
            <div className="px-3 pb-4 space-y-2" ref={profileRef}>
                {/* Back to App */}
                <button
                    onClick={() => router.push('/')}
                    className="w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors text-sm font-medium"
                >
                    <ArrowLeft className="h-[18px] w-[18px]" />
                    <span className="hidden lg:block font-rajdhani">Back to App</span>
                </button>

                {/* Profile Menu */}
                {isProfileMenuOpen && (
                    <div className="admin-profile-menu absolute bottom-20 left-3 right-3 lg:right-auto lg:w-56 bg-popover border border-border/50 rounded-xl shadow-xl py-1.5 z-50">
                        <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2.5 font-medium transition-colors"
                        >
                            <LogOut className="h-4 w-4" />
                            <span className="hidden lg:inline">Log Out</span>
                        </button>
                    </div>
                )}

                {/* Profile Badge */}
                <div
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className={cn(
                        "flex items-center justify-center lg:justify-start gap-2.5 px-3 py-2.5 bg-muted/30 rounded-lg hover:bg-muted/50 transition-all cursor-pointer",
                        isProfileMenuOpen && "bg-muted/60"
                    )}
                >
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary overflow-hidden flex-shrink-0">
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt="User" className="h-full w-full object-cover" />
                        ) : (
                            <span className="font-bold text-sm">A</span>
                        )}
                    </div>
                    <div className="hidden lg:block flex-1 overflow-hidden min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">Admin</p>
                        <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                    </div>
                    <Menu size={14} className="hidden lg:block text-muted-foreground opacity-50" />
                </div>
            </div>
        </aside>
    );
}
