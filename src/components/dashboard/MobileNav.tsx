import { User } from "firebase/auth";
import { Gamepad2, Wallet, ClipboardList, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dispatch, SetStateAction } from "react";

interface MobileNavProps {
    activeTab: string;
    setActiveTab: Dispatch<SetStateAction<string>>;
    onLoginClick: () => void;
    user: User | null;
}

export default function MobileNav({ activeTab, setActiveTab, onLoginClick, user }: MobileNavProps) {
    const navItems = [
        { id: "tournaments", label: "Play", icon: Gamepad2 },
        { id: "my-registrations", label: "My Games", icon: ClipboardList },
        { id: "wallet", label: "Wallet", icon: Wallet },
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

            {/* Profile / Login Button */}
            <button
                onClick={() => user ? setActiveTab("settings") : onLoginClick()}
                className={cn(
                    "flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 relative",
                    activeTab === "settings" ? "text-primary" : "text-muted-foreground hover:text-white"
                )}
            >
                {activeTab === "settings" && (
                    <div className="absolute top-0 w-8 h-1 bg-primary rounded-b-full shadow-[0_0_10px_hsl(var(--primary))]" />
                )}
                {user?.photoURL ? (
                    <div className={`h-6 w-6 rounded-full overflow-hidden border ${activeTab === "settings" ? 'border-primary' : 'border-transparent'}`}>
                        <img src={user.photoURL} alt="Profile" className="h-full w-full object-cover" />
                    </div>
                ) : (
                    <UserIcon size={20} className={cn("transition-transform", activeTab === "settings" ? "scale-110" : "")} />
                )}
                <span className="text-[10px] font-medium font-rajdhani">{user ? "Profile" : "Login"}</span>
            </button>
        </div>
    );
}
