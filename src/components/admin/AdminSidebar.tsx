"use client";

import { useRef, useEffect, Dispatch, SetStateAction } from "react";
import { Users, Trophy, LogOut, LayoutDashboard, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import { useAuth } from "@/components/auth/AuthProvider";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface AdminSidebarProps {
    activeTab: 'tournaments' | 'users';
    setActiveTab: Dispatch<SetStateAction<'tournaments' | 'users'>>;
}

export default function AdminSidebar({ activeTab, setActiveTab }: AdminSidebarProps) {
    const sidebarRef = useRef(null);
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        gsap.fromTo(
            sidebarRef.current,
            { x: -50, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.5, ease: "power3.out" }
        );
    }, []);

    const menuItems = [
        { id: "tournaments", label: "Tournaments", icon: Trophy },
        { id: "users", label: "Users", icon: Users },
    ];

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
            className="w-20 lg:w-64 h-screen border-r border-border bg-card/50 backdrop-blur-xl flex flex-col justify-between fixed left-0 top-0 z-50 transition-all duration-300"
        >
            <div>
                <div className="h-20 flex items-center justify-center border-b border-border/50">
                    <h1 className="hidden lg:block font-rajdhani font-bold text-2xl text-purple-500 tracking-wider uppercase">
                        Admin
                    </h1>
                    <LayoutDashboard className="lg:hidden h-8 w-8 text-purple-500" />
                </div>

                <nav className="p-4 space-y-2">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            className={cn(
                                "w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                                activeTab === item.id
                                    ? "bg-purple-500/10 text-purple-500"
                                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <item.icon className="h-5 w-5 z-10" />
                            <span className="hidden lg:block font-medium z-10 font-rajdhani text-lg">
                                {item.label}
                            </span>
                            {activeTab === item.id && (
                                <div className="absolute inset-0 bg-purple-500/10 border-r-2 border-purple-500" />
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="p-4 border-t border-border/50 space-y-2">
                <button
                    onClick={() => router.push('/')}
                    className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-white transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                    <span className="hidden lg:block font-medium font-rajdhani">Main App</span>
                </button>

                <div className="flex items-center gap-3 px-3 py-2 bg-black/20 rounded-lg relative group cursor-pointer">
                    <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 overflow-hidden">
                        {user?.photoURL ? <img src={user.photoURL} alt="User" className="h-full w-full object-cover" /> : <div className="font-bold">A</div>}
                    </div>
                    <div className="hidden lg:block flex-1 overflow-hidden">
                        <p className="text-sm font-bold text-white leading-none truncate">Admin</p>
                    </div>
                    <button onClick={handleLogout} className="absolute right-2 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </aside>
    );
}
