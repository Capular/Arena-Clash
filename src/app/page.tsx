"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import TournamentsView from "@/components/dashboard/TournamentsView";
import WalletView from "@/components/dashboard/WalletView";
import MyRegistrationsView from "@/components/dashboard/MyRegistrationsView";
import { ChevronDown, Bell } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { collection, query, where, orderBy, onSnapshot, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/auth/AuthProvider";

const GAMES = ["All Games", "Free Fire", "PUBG", "COD: Mobile"];

export default function Home() {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Initialize from URL param or default
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "tournaments");
  const [selectedGame, setSelectedGame] = useState("Free Fire");
  const [isGameDropdownOpen, setIsGameDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && (tab === "tournaments" || tab === "wallet" || tab === "my-registrations")) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;

    // Fetch Notifications
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifs);
      // Simple unread count logic (assuming 'read' field exists, if not just show total or new)
      setUnreadCount(notifs.filter((n: any) => !n.read).length);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <main className="min-h-screen bg-background">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="lg:pl-64 transition-all duration-300">
        {/* Header Area */}
        <header className="h-20 border-b border-border/50 flex items-center justify-between px-8 bg-background/80 backdrop-blur-xl sticky top-0 z-40">
          {/* Left Side: Title */}
          <h1 className="text-2xl font-bold text-white capitalize font-rajdhani tracking-wide">
            {activeTab === 'tournaments' ? 'Live Tournaments' : activeTab === 'wallet' ? 'My Wallet' : 'My Registrations'}
          </h1>

          {/* Right Side: Notification */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              {unreadCount > 0 && (
                <div className="w-5 h-5 rounded-full bg-red-500 absolute -top-1 -right-1 animate-pulse z-10 flex items-center justify-center text-[10px] font-bold text-white border-2 border-background">
                  {unreadCount}
                </div>
              )}
              <button className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-black/5 transition-colors relative shadow-sm">
                <Bell size={20} className="text-foreground" />
              </button>

              {/* Dropdown */}
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
        </header>

        {/* Controls Bar */}
        {activeTab === "tournaments" && (
          <div className="px-8 mt-6 mb-2">
            <div className="relative inline-block">
              <button
                onClick={() => setIsGameDropdownOpen(!isGameDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl hover:bg-white/5 transition-all text-white font-rajdhani font-bold min-w-[160px] justify-between shadow-sm"
              >
                {selectedGame}
                <ChevronDown size={16} className={`text-muted-foreground transition-transform ${isGameDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isGameDropdownOpen && (
                <div className="absolute top-full mt-2 left-0 w-48 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  {GAMES.map((game) => (
                    <button
                      key={game}
                      onClick={() => {
                        setSelectedGame(game);
                        setIsGameDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors hover:bg-white/5 ${selectedGame === game ? 'text-primary bg-primary/5' : 'text-muted-foreground hover:text-white'}`}
                    >
                      {game}
                    </button>
                  ))}
                </div>
              )}

              {/* Overlay to close dropdown */}
              {isGameDropdownOpen && (
                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsGameDropdownOpen(false)} />
              )}
            </div>
          </div>
        )}

        <section className="p-4 lg:p-8 max-w-[1600px] mx-auto pt-4">
          {activeTab === "tournaments" && <TournamentsView selectedGame={selectedGame === "All Games" ? undefined : selectedGame} />}
          {activeTab === "my-registrations" && <MyRegistrationsView />}
          {activeTab === "wallet" && <WalletView />}
        </section>
      </div>
    </main>
  );
}
