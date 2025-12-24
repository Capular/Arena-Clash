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
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
    const sidebarRef = useRef(null);
    const { user, loading } = useAuth();
    const [isLoginOpen, setIsLoginOpen] = useState(false);

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

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout error", error);
        }
    };

    return (
        <>
            <aside
                ref={sidebarRef}
                className="w-20 lg:w-64 h-screen border-r border-border bg-card/50 backdrop-blur-xl flex flex-col justify-between fixed left-0 top-0 z-50 transition-all duration-300"
            >
                <div>
                    <div className="h-20 flex items-center justify-center border-b border-border/50">
                        <h1 className="hidden lg:block font-rajdhani font-bold text-2xl text-primary tracking-wider uppercase">
                            Arena Clash
                        </h1>
                        <Gamepad2 className="lg:hidden h-8 w-8 text-primary" />
                    </div>

                    <nav className="p-4 space-y-2">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={cn(
                                    "w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                                    activeTab === item.id
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-white/5 hover:text-white"
                                )}
                            >
                                <item.icon className="h-5 w-5 z-10" />
                                <span className="hidden lg:block font-medium z-10 font-rajdhani text-lg">
                                    {item.label}
                                </span>
                                {activeTab === item.id && (
                                    <div className="absolute inset-0 bg-primary/10 border-r-2 border-primary" />
                                )}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-4 border-t border-border/50">
                    <button className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-white transition-colors">
                        <Settings className="h-5 w-5" />
                        <span className="hidden lg:block font-medium font-rajdhani">Settings</span>
                    </button>

                    {!loading && user ? (
                        <div className="mt-4 flex items-center gap-3 px-3 py-2 bg-black/20 rounded-lg relative group cursor-pointer">
                            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary overflow-hidden">
                                {user.photoURL ? <img src={user.photoURL} alt="User" className="h-full w-full object-cover" /> : <User size={16} />}
                            </div>
                            <div className="hidden lg:block flex-1 overflow-hidden">
                                <p className="text-sm font-bold text-white leading-none truncate">{user.displayName || "Gamer"}</p>
                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            </div>
                            <button onClick={handleLogout} className="absolute right-2 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <LogOut size={16} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsLoginOpen(true)}
                            className="mt-4 w-full bg-primary text-white py-2 rounded-lg font-bold font-rajdhani hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                        >
                            Login
                        </button>
                    )}
                </div>
            </aside>
            <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        </>
    );
}
