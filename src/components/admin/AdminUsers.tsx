"use client";

import { useState, useEffect, useRef } from "react";
import { collection, getDocs, updateDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Search, UserCog, Shield, Wallet } from "lucide-react";
import gsap from "gsap";

interface UserData {
    id: string;
    email: string;
    displayName?: string;
    role?: string;
    walletBalance?: number;
}

export default function AdminUsers() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [search, setSearch] = useState("");
    const listRef = useRef<HTMLDivElement>(null);

    const fetchUsers = async () => {
        const q = query(collection(db, "users"), orderBy("email"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData));
        setUsers(data);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (listRef.current && users.length > 0) {
            gsap.fromTo(
                listRef.current.children,
                { y: 10, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.3, stagger: 0.05, ease: "power2.out" }
            );
        }
    }, [users]);

    const toggleRole = async (user: UserData) => {
        const newRole = user.role === 'admin' ? 'user' : 'admin';
        await updateDoc(doc(db, "users", user.id), { role: newRole });
        fetchUsers();
    };

    const updateBalance = async (user: UserData) => {
        const newBalance = prompt("Enter new wallet balance:", String(user.walletBalance || 0));
        if (newBalance !== null) {
            await updateDoc(doc(db, "users", user.id), { walletBalance: Number(newBalance) });
            fetchUsers();
        }
    };

    const filtered = users.filter(u =>
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.displayName?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:border-primary focus:outline-none transition-colors"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div ref={listRef} className="space-y-2">
                {filtered.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-card border border-border/50 rounded-lg hover:border-border transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <UserCog className="text-primary w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground text-sm">{user.displayName || "User"}</h3>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden md:block">
                                <p className="text-xs text-muted-foreground">Wallet</p>
                                <p className="text-sm font-medium">₹{user.walletBalance || 0}</p>
                            </div>
                            <button
                                onClick={() => updateBalance(user)}
                                className="p-2 text-muted-foreground hover:text-primary transition-colors"
                                title="Edit Balance"
                            >
                                <Wallet size={16} />
                            </button>
                            <button
                                onClick={() => toggleRole(user)}
                                className={`text-xs px-2 py-1 rounded font-medium transition-colors ${user.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                                    }`}
                            >
                                <Shield size={14} className="inline mr-1" />
                                {user.role === 'admin' ? 'Admin' : 'User'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
