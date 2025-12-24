"use client";

import { Gamepad2, Wallet, Settings, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dispatch, SetStateAction } from "react";

interface MobileNavProps {
    activeTab: string;
    setActiveTab: Dispatch<SetStateAction<string>>;
}

export default function MobileNav({ activeTab, setActiveTab }: MobileNavProps) {
    const navItems = [
        { id: "tournaments", label: "Play", icon: Gamepad2 },
        { id: "my-registrations", label: "My Games", icon: ClipboardList },
        { id: "wallet", label: "Wallet", icon: Wallet },
        { id: "settings", label: "Settings", icon: Settings },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-xl border-t border-border z-50 lg:hidden flex items-center justify-around px-2 pb-safe">
            {navItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                        "flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 relative",
                        activeTab === item.id ? "text-primary" : "text-muted-foreground hover:text-white"
                    )}
                >
                    {activeTab === item.id && (
                        <div className="absolute top-0 w-8 h-1 bg-primary rounded-b-full shadow-[0_0_10px_hsl(var(--primary))]" />
                    )}
                    <item.icon size={20} className={cn("transition-transform", activeTab === item.id ? "scale-110" : "")} />
                    <span className="text-[10px] font-medium font-rajdhani">{item.label}</span>
                </button>
            ))}
        </div>
    );
}
