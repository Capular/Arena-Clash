"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Search, Loader2 } from "lucide-react";

interface UserData {
    id: string;
    displayName: string;
    email: string;
    walletBalance: number;
    role: string;
    lastLogin?: string;
}

export default function AdminUsers() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

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

    const handleUpdateBalance = async (uid: string, current: number) => {
        const amountStr = prompt("Enter amount to ADD (positive) or DEDUCT (negative):", "0");
        if (!amountStr) return;
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount === 0) return;

        if (confirm(`Are you sure you want to ${amount > 0 ? 'add' : 'deduct'} ${Math.abs(amount)}?`)) {
            await updateDoc(doc(db, "users", uid), {
                walletBalance: increment(amount)
            });
            fetchUsers();
        }
    };

    const handleToggleRole = async (user: UserData) => {
        const newRole = user.role === 'admin' ? 'user' : 'admin';
        if (confirm(`Change role of ${user.displayName} to ${newRole}?`)) {
            await updateDoc(doc(db, "users", user.id), {
                role: newRole
            });
            fetchUsers();
        }
    }

    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/10">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-3 text-muted-foreground h-4 w-4" />
                    <input
                        type="text"
                        placeholder="Search users by email or name..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 text-sm text-white focus:border-primary focus:outline-none"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <button onClick={fetchUsers} className="text-xs text-primary hover:underline">Refresh List</button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>
            ) : (
                <div className="grid gap-2">
                    {filteredUsers.map(u => (
                        <div key={u.id} className="flex flex-col md:flex-row items-center justify-between p-4 rounded-lg bg-black/20 hover:bg-white/5 border border-transparent hover:border-white/10 transition-all">
                            <div className="flex gap-4 items-center w-full md:w-auto">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${u.role === 'admin' ? 'bg-purple-500 text-white' : 'bg-neutral-700 text-muted-foreground'}`}>
                                    {u.displayName?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-white flex items-center gap-2">
                                        {u.displayName}
                                        {u.role === 'admin' && <span className="bg-purple-500/20 text-purple-400 text-[10px] px-1.5 py-0.5 rounded uppercase">ADMIN</span>}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{u.email}</p>
                                    <p className="text-[10px] text-muted-foreground/50">ID: {u.id}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end mt-4 md:mt-0">
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Wallet Balance</p>
                                    <p className="font-rajdhani font-bold text-xl text-green-400">₹{u.walletBalance?.toFixed(2) || '0.00'}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleUpdateBalance(u.id, u.walletBalance)}
                                        className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg transition-colors"
                                    >
                                        Edit Fund
                                    </button>
                                    <button
                                        onClick={() => handleToggleRole(u)}
                                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-muted-foreground text-xs font-bold rounded-lg transition-colors"
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
