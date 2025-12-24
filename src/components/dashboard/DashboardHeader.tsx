"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const GAMES = ["All Games", "Free Fire", "PUBG", "COD: Mobile"];

export default function DashboardHeader() {
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const activeTab = pathname === "/" ? "tournaments" : pathname.split("/").pop();

    // Get game from URL or default
    const selectedGame = searchParams.get("game") || "All Games";

    const handleGameChange = (game: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (game === "All Games") {
            params.delete("game");
        } else {
            params.set("game", game);
        }
        router.push(`${pathname}?${params.toString()}`);
    };

    // Fetch Notifications
    useEffect(() => {
        if (!user) return;
        const q = query(
            collection(db, "notifications"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc"),
            limit(10)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setNotifications(notifs);
            setUnreadCount(notifs.filter((n: any) => !n.read).length);
        });
        return () => unsubscribe();
    }, [user]);

    const isTournaments = pathname === "/" || pathname.includes("tournaments");

    return (
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl flex flex-col">
            <div className="h-16 lg:h-20 flex items-center px-4 lg:px-8 gap-4">
                {/* Desktop Game Selection */}
                {isTournaments && (
                    <div className="hidden lg:block w-[180px]">
                        <Select value={selectedGame} onValueChange={handleGameChange}>
                            <SelectTrigger className="bg-card border-border hover:bg-white/5 transition-all text-foreground font-rajdhani font-bold shadow-sm h-10">
                                <SelectValue placeholder="Select Game" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border text-foreground">
                                {GAMES.map((game) => (
                                    <SelectItem
                                        key={game}
                                        value={game}
                                        className="font-rajdhani font-medium focus:bg-primary/10 focus:text-primary cursor-pointer"
                                    >
                                        {game}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Notification Bell */}
                <div className="relative group ml-auto">
                    {unreadCount > 0 && (
                        <div className="w-5 h-5 rounded-full bg-red-500 absolute -top-1 -right-1 animate-pulse z-10 flex items-center justify-center text-[10px] font-bold text-white border-2 border-background">
                            {unreadCount}
                        </div>
                    )}
                    <button className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-black/5 transition-colors relative shadow-sm">
                        <Bell size={20} className="text-foreground" />
                    </button>

                    <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl shadow-black/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                        <div className="p-4 border-b border-border/50 flex justify-between items-center">
                            <h4 className="font-bold text-foreground font-rajdhani">Notifications</h4>
                            <span className="text-xs text-primary cursor-pointer hover:underline">Mark all read</span>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-4 text-center text-muted-foreground text-sm">No notifications</div>
                            ) : (
                                notifications.map((n) => (
                                    <div key={n.id} className={`p-3 hover:bg-primary/5 border-b border-border/50 last:border-0 flex gap-3 ${!n.read ? 'bg-primary/5' : ''}`}>
                                        <div className="h-8 w-8 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center text-primary text-xs">
                                            📢
                                        </div>
                                        <div>
                                            <p className="text-sm text-foreground font-semibold">{n.title}</p>
                                            <p className="text-xs text-muted-foreground">{n.message}</p>
                                            <p className="text-[10px] text-muted-foreground/50 mt-1">{n.createdAt?.toDate ? n.createdAt.toDate().toLocaleTimeString() : ''}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Game Chips */}
            {isTournaments && (
                <div className="lg:hidden px-4 pb-4 overflow-x-auto no-scrollbar">
                    <div className="flex gap-2">
                        {GAMES.map(game => (
                            <button
                                key={game}
                                onClick={() => handleGameChange(game)}
                                className={`whitespace-nowrap px-4 py-2 rounded-full border text-sm font-bold font-rajdhani transition-colors ${selectedGame === game ? 'bg-primary/20 border-primary text-primary' : 'bg-card border-border text-muted-foreground'}`}>
                                {game}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
