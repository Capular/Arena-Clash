import { User } from "firebase/auth";
import { Gamepad2, Wallet, ClipboardList, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";

interface MobileNavProps {
    onLoginClick: () => void;
    user: User | null;
}

export default function MobileNav({ onLoginClick, user }: MobileNavProps) {
    const router = useRouter();
    const pathname = usePathname();

    const navItems = [
        { id: "tournaments", label: "Play", icon: Gamepad2, path: "/tournaments" },
        { id: "my-registrations", label: "My Games", icon: ClipboardList, path: "/registrations" },
    ];

    const isActive = (path: string) => {
        if (path === "/tournaments" && (pathname === "/" || pathname === "/tournaments")) return true;
        return pathname.startsWith(path);
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-xl border-t border-border z-50 lg:hidden flex items-center justify-around px-2 pb-safe">
            {navItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => router.push(item.path)}
                    className={cn(
                        "flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 relative",
                        isActive(item.path) ? "text-primary" : "text-muted-foreground hover:text-white"
                    )}
                >
                    {isActive(item.path) && (
                        <div className="absolute top-0 w-8 h-1 bg-primary rounded-b-full shadow-[0_0_10px_hsl(var(--primary))]" />
                    )}
                    <item.icon size={20} className={cn("transition-transform", isActive(item.path) ? "scale-110" : "")} />
                    <span className="text-[10px] font-medium font-rajdhani">{item.label}</span>
                </button>
            ))}

            {/* Profile / Login Button */}
            <button
                onClick={() => user ? router.push("/settings") : onLoginClick()}
                className={cn(
                    "flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 relative",
                    pathname === "/settings" ? "text-primary" : "text-muted-foreground hover:text-white"
                )}
            >
                {pathname === "/settings" && (
                    <div className="absolute top-0 w-8 h-1 bg-primary rounded-b-full shadow-[0_0_10px_hsl(var(--primary))]" />
                )}
                {user?.photoURL ? (
                    <div className={`h-6 w-6 rounded-full overflow-hidden border ${pathname === "/settings" ? 'border-primary' : 'border-transparent'}`}>
                        <img src={user.photoURL} alt="Profile" className="h-full w-full object-cover" />
                    </div>
                ) : (
                    <UserIcon size={20} className={cn("transition-transform", pathname === "/settings" ? "scale-110" : "")} />
                )}
                <span className="text-[10px] font-medium font-rajdhani">{user ? "Profile" : "Login"}</span>
            </button>
        </div>
    );
}
