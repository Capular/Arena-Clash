"use client";

import { CreditCard, ArrowUpRight, ArrowDownLeft, History, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { doc, onSnapshot, collection, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/auth/AuthProvider";
import PaymentModal from "@/components/payment/PaymentModal";

interface Transaction {
    id: string;
    type: 'deposit' | 'withdrawal' | 'entry' | 'prize';
    amount: number;
    timestamp: any;
    description: string;
    status?: 'pending' | 'success' | 'failed';
}

export default function WalletView() {
    const { user } = useAuth();
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState({ winnings: 0, spent: 0 });
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    useEffect(() => {
        if (!user) return;

        const userUnsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
            if (doc.exists()) {
                setBalance(doc.data().walletBalance || 0);
            }
        });

        const q = query(
            collection(db, "transactions"),
            where("userId", "==", user.uid)
        );

        const txUnsub = onSnapshot(q, (snapshot) => {
            const txs: Transaction[] = [];
            let totalWinnings = 0;
            let totalSpent = 0;

            snapshot.forEach((doc) => {
                const data = doc.data();
                txs.push({
                    id: doc.id,
                    type: data.type,
                    amount: data.amount,
                    timestamp: data.timestamp,
                    description: data.description,
                    status: data.status,
                });

                if (data.type === 'prize') totalWinnings += data.amount;
                if (data.type === 'entry') totalSpent += data.amount;
            });

            txs.sort((a, b) => {
                const timeA = a.timestamp?.seconds || 0;
                const timeB = b.timestamp?.seconds || 0;
                return timeB - timeA;
            });

            setTransactions(txs.slice(0, 5));
            setStats({ winnings: totalWinnings, spent: totalSpent });
        });

        return () => {
            userUnsub();
            txUnsub();
        };
    }, [user]);

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center">
                <h2 className="text-lg font-semibold text-foreground mb-2">Login Required</h2>
                <p className="text-sm text-muted-foreground">Please login to access your wallet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 lg:p-6">
            {/* Balance Card */}
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Balance</span>
                </div>
                <h2 className="text-3xl font-bold text-foreground font-rajdhani mb-4">
                    ₹{balance.toFixed(2)}
                </h2>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors"
                    >
                        Add Funds
                    </button>
                    <button className="flex-1 bg-muted text-foreground py-2.5 rounded-lg font-semibold text-sm hover:bg-muted/80 transition-colors">
                        Withdraw
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <ArrowDownLeft className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-muted-foreground">Winnings</span>
                    </div>
                    <p className="text-xl font-bold text-green-500 font-rajdhani">₹{stats.winnings.toFixed(2)}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Spent</span>
                    </div>
                    <p className="text-xl font-bold text-foreground font-rajdhani">₹{stats.spent.toFixed(2)}</p>
                </div>
            </div>

            {/* Transactions */}
            <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <History className="w-4 h-4 text-muted-foreground" />
                        Recent Transactions
                    </h3>
                </div>

                {transactions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No transactions yet</p>
                ) : (
                    <div className="space-y-2">
                        {transactions.map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'prize' || tx.type === 'deposit'
                                            ? 'bg-green-500/10 text-green-500'
                                            : 'bg-muted text-muted-foreground'
                                        }`}>
                                        {tx.type === 'prize' || tx.type === 'deposit'
                                            ? <ArrowDownLeft size={16} />
                                            : <ArrowUpRight size={16} />
                                        }
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">{tx.description || tx.type}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {tx.timestamp?.toDate ? tx.timestamp.toDate().toLocaleDateString() : 'Just now'}
                                        </p>
                                    </div>
                                </div>
                                <span className={`text-sm font-semibold ${tx.type === 'prize' || tx.type === 'deposit' ? 'text-green-500' : 'text-foreground'
                                    }`}>
                                    {tx.type === 'prize' || tx.type === 'deposit' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} uid={user.uid} />
        </div>
    );
}
