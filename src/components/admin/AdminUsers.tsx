"use client";

import { useState, useEffect, useRef } from "react";
import { collection, getDocs, doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Search, Loader2 } from "lucide-react";
import gsap from "gsap";

interface UserData {
    id: string;
    displayName: string;
    email: string;
    walletBalance: number;
    role: string;
}

export default function AdminUsers() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const listRef = useRef<HTMLDivElement>(null);

    const fetchUsers = async () => {
        setLoading(true);
        const snapshot = await getDocs(collection(db, "users"));
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData));
        setUsers(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Animate list
    useEffect(() => {
        if (listRef.current && users.length > 0 && !loading) {
            gsap.fromTo(
                listRef.current.children,
                { y: 10, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.3, stagger: 0.05, ease: "power2.out" }
            );
        }
    }, [users, loading]);

    const handleUpdateBalance = async (uid: string) => {
        const amountStr = prompt("Enter amount to add (positive) or deduct (negative):", "0");
        if (!amountStr) return;
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount === 0) return;

        if (confirm(`${amount > 0 ? 'Add' : 'Deduct'} ₹${Math.abs(amount)}?`)) {
            await updateDoc(doc(db, "users", uid), {
                walletBalance: increment(amount)
            });
            fetchUsers();
        }
    };

    const handleToggleRole = async (user: UserData) => {
        const newRole = user.role === 'admin' ? 'user' : 'admin';
        if (confirm(`Change ${user.displayName} to ${newRole}?`)) {
            await updateDoc(doc(db, "users", user.id), { role: newRole });
            fetchUsers();
        }
    };

    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="flex items-center justify-between">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-2.5 text-muted-foreground h-4 w-4" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="w-full bg-muted/50 border border-border rounded-lg py-2 pl-9 pr-4 text-sm focus:border-primary focus:outline-none"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <button onClick={fetchUsers} className="text-xs text-primary hover:underline">Refresh</button>
            </div>

            {/* User List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-primary" />
                </div>
            ) : (
                <div ref={listRef} className="space-y-2">
                    {filteredUsers.map(u => (
                        <div key={u.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50 hover:border-border transition-colors">
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm ${u.role === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                    }`}>
                                    {u.displayName?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div>
                                    <p className="font-medium text-foreground text-sm flex items-center gap-2">
                                        {u.displayName}
                                        {u.role === 'admin' && (
                                            <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">ADMIN</span>
                                        )}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{u.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Balance</p>
                                    <p className="font-semibold text-green-500 text-sm">₹{u.walletBalance?.toFixed(2) || '0.00'}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleUpdateBalance(u.id)}
                                        className="px-2.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium rounded-lg transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleToggleRole(u)}
                                        className="px-2.5 py-1.5 bg-muted hover:bg-muted/80 text-muted-foreground text-xs font-medium rounded-lg transition-colors"
                                    >
                                        {u.role === 'admin' ? 'Demote' : 'Promote'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
