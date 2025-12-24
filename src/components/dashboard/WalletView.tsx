"use client";

import { CreditCard, ArrowUpRight, ArrowDownLeft, History, Loader2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { doc, onSnapshot, collection, query, where, addDoc, updateDoc, setDoc, increment, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/auth/AuthProvider";
import PaymentModal from "@/components/payment/PaymentModal";
import { useSearchParams, useRouter } from "next/navigation";

interface Transaction {
    id: string;
    type: 'deposit' | 'withdrawal' | 'entry' | 'prize';
    amount: number;
    timestamp: any;
    description: string;
    status?: 'pending' | 'success' | 'failed';
    gatewayOrderId?: string;
}

export default function WalletView() {
    const { user } = useAuth();
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState({ winnings: 0, spent: 0 });
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();
    const processedRef = useRef(false);

    useEffect(() => {
        if (!user) return;

        // Listen to User Balance
        const userUnsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
            if (doc.exists()) {
                setBalance(doc.data().walletBalance || 0);
            }
        });

        // Listen to Recent Transactions
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
                    gatewayOrderId: data.gatewayOrderId
                });

                if (data.type === 'prize') totalWinnings += data.amount;
                if (data.type === 'entry') totalSpent += data.amount;
            });
            // Client-side sort (descending) and limit
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

    const [debugLogs, setDebugLogs] = useState<string[]>([]);
    const log = (msg: string) => setDebugLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

    const manuallyCheck = async (tx: Transaction) => {
        if (!tx.id || !user) return;
        const oid = (tx as any).gatewayOrderId;

        if (!oid) {
            console.log("Tx Data:", tx);
            alert(`No Order ID found. (Tx ID: ${tx.id})`);
            return;
        }

        const confirmCheck = confirm("Check status with Gateway?");
        if (!confirmCheck) return;

        try {
            alert("Checking status...");
            const res = await fetch('/api/payment/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: oid })
            });
            const data = await res.json();
            console.log("Manual Check Data:", data);

            const rawStatus = data.data?.status || data.result?.status;
            const innerStatus = String(rawStatus || '').trim().toLowerCase();
            const isPaid = (innerStatus === 'success');

            if (isPaid) {
                let amount = 100;
                if (data.amount) amount = parseFloat(String(data.amount));
                else if (data.data?.amount) amount = parseFloat(String(data.data.amount));

                if (isNaN(amount) || amount <= 0) amount = Number(tx.amount) || 100;

                const finalAmount = Number(amount);

                await updateDoc(doc(db, "transactions", tx.id), {
                    status: 'success',
                    description: "Wallet Recharge",
                    amount: finalAmount,
                    gatewayRef: data.upi_txn_id || "Manual Check"
                });

                await setDoc(doc(db, "users", user.uid), {
                    walletBalance: increment(finalAmount)
                }, { merge: true });

                console.log(`Updated balance by ${amount}`);
                alert(`Transaction Confirmed! Added ₹${amount} to wallet.`);
            } else if (data.status === 'error' && data.message?.includes('Record not found')) {
                alert("Gateway says Record Not Found. (Likely failed or invalid ID)");
            } else {
                alert(`Transaction Pending or Failed.\nGateway Status: "${rawStatus}"`);
            }

        } catch (e: any) {
            alert("Error checking: " + e.message);
        }
    };

    // Handle Payment Verification
    useEffect(() => {
        const checkPayment = async () => {
            const status = searchParams.get('status');
            const oid = searchParams.get('oid');

            if (status === 'check' && oid && user && !processedRef.current) {
                processedRef.current = true;
                log(`Started verification for OID: ${oid}`);

                try {
                    const res = await fetch('/api/payment/status', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ orderId: oid })
                    });

                    const data = await res.json();
                    log(`API Response: ${JSON.stringify(data)}`);

                    if (data.status === 'success' || (data.data && data.data.status === 'success')) {
                        const txQuery = query(collection(db, "transactions"), where("gatewayOrderId", "==", oid));
                        const txSnap = await getDocs(txQuery);

                        if (!txSnap.empty) {
                            const txDoc = txSnap.docs[0];
                            const txData = txDoc.data();

                            if (txData.status !== 'success') {
                                let amount = 100;
                                if (data.amount) amount = parseFloat(String(data.amount));
                                else if (data.data?.amount) amount = parseFloat(String(data.data.amount));

                                if (isNaN(amount) || amount <= 0) amount = txData.amount || 100;

                                log(`Updating pending transaction ${txDoc.id} to success. Amount: ${amount}`);

                                await updateDoc(doc(db, "transactions", txDoc.id), {
                                    status: 'success',
                                    description: "Wallet Recharge",
                                    amount: amount,
                                    gatewayRef: data.upi_txn_id || "N/A"
                                });

                                await setDoc(doc(db, "users", user.uid), {
                                    walletBalance: increment(amount)
                                }, { merge: true });

                                log("Firestore updated successfully.");
                                alert(`Success! Added ₹${amount}`);
                                router.replace('/');
                            } else {
                                log("Transaction already marked success.");
                                alert("Transaction already processed");
                                router.replace('/');
                            }
                        } else {
                            log("No pending doc found, creating new.");
                            let amount = 100;
                            if (data.amount) amount = parseFloat(String(data.amount));
                            else if (data.data?.amount) amount = parseFloat(String(data.data.amount));

                            if (isNaN(amount) || amount <= 0) amount = 100;

                            await addDoc(collection(db, "transactions"), {
                                userId: user.uid,
                                type: 'deposit',
                                amount: amount,
                                timestamp: Timestamp.now(),
                                description: "Wallet Recharge (Recovered)",
                                gatewayOrderId: oid,
                                status: 'success',
                                gatewayRef: data.upi_txn_id || "N/A"
                            });

                            await setDoc(doc(db, "users", user.uid), {
                                walletBalance: increment(amount)
                            }, { merge: true });

                            alert(`Success! Added ₹${amount}`);
                            router.replace('/');
                        }
                    } else {
                        log("Payment status failed or pending.");
                    }
                } catch (error: any) {
                    log(`Error: ${error.message}`);
                    console.error("Verification error", error);
                }
            }
        };

        if (user && searchParams.get('oid')) {
            checkPayment();
        }
    }, [user, searchParams, router]);

    // debug UI
    if (searchParams.get('status') === 'check') {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] animate-in fade-in p-8">
                <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
                <h2 className="text-2xl font-bold text-white font-rajdhani">Verifying Transaction...</h2>
                <div className="mt-8 w-full max-w-md bg-black/50 p-4 rounded-xl text-xs font-mono text-green-400 overflow-hidden break-all border border-green-500/20">
                    <p className="text-white mb-2 font-bold border-b border-white/10 pb-2">Debug Logs:</p>
                    {debugLogs.map((l, i) => <div key={i}>{l}</div>)}
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center">
                <h2 className="text-xl font-bold text-white mb-2">Login Required</h2>
                <p className="text-muted-foreground">Please login to access your wallet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Premium Balance Card */}
                <div className="card-premium p-8 relative overflow-hidden group">
                    {/* Animated gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-50 group-hover:opacity-70 transition-opacity duration-500" />

                    {/* Shine effect */}
                    <div className="card-shine" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                <CreditCard className="w-4 h-4 text-primary" />
                            </div>
                            <p className="text-primary font-semibold text-xs uppercase tracking-wider">Total Balance</p>
                        </div>

                        <h2 className="text-4xl font-bold font-rajdhani text-foreground mb-6 tracking-tight">
                            ₹{balance.toFixed(2)}
                        </h2>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsPaymentModalOpen(true)}
                                className="flex-1 btn-premium flex items-center justify-center gap-2 group/btn text-sm py-2.5"
                            >
                                <ArrowDownLeft className="w-4 h-4 transition-transform group-hover/btn:rotate-12" />
                                Add Funds
                            </button>
                            <button className="flex-1 glass-effect py-2.5 rounded-lg font-bold font-rajdhani text-sm transition-all hover:scale-105 hover:shadow-lg border border-primary/20 hover:border-primary/40 flex items-center justify-center gap-2 group/btn">
                                <ArrowUpRight className="w-4 h-4 transition-transform group-hover/btn:-rotate-12" />
                                Withdraw
                            </button>
                        </div>
                    </div>

                    {/* Decorative glow */}
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/20 blur-[100px] rounded-full animate-pulse-glow" />
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Winnings Card */}
                    <div className="card-premium p-5 flex flex-col justify-between group hover:border-green-500/30 transition-all">
                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 mb-3 border border-green-500/20 transition-transform group-hover:scale-110 duration-300">
                            <ArrowDownLeft size={20} className="transition-transform group-hover:rotate-12" />
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs font-medium mb-1">Total Winnings</p>
                            <p className="text-2xl font-bold text-green-400 font-rajdhani">₹{stats.winnings.toFixed(2)}</p>
                        </div>
                    </div>

                    {/* Spent Card */}
                    <div className="card-premium p-5 flex flex-col justify-between group hover:border-primary/30 transition-all">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3 border border-primary/20 transition-transform group-hover:scale-110 duration-300">
                            <ArrowUpRight size={20} className="transition-transform group-hover:-rotate-12" />
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs font-medium mb-1">Total Spent</p>
                            <p className="text-2xl font-bold text-foreground font-rajdhani">₹{stats.spent.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Transactions Section */}
            <div className="card-premium p-6">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="font-rajdhani font-bold text-xl text-foreground flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <History className="text-primary" size={16} />
                        </div>
                        Recent Transactions
                    </h3>
                    <button className="text-xs text-primary hover:text-primary/80 font-semibold transition-colors hover:underline underline-offset-4">
                        View All →
                    </button>
                </div>

                {transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                            <History className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground text-lg">No recent transactions</p>
                        <p className="text-muted-foreground/60 text-sm mt-1">Your transaction history will appear here</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {transactions.map((tx, index) => (
                            <div
                                key={tx.id}
                                className="flex items-center justify-between p-3.5 rounded-xl glass-effect hover:bg-primary/5 transition-all duration-300 border border-border/50 hover:border-primary/30 group"
                                style={{
                                    animationDelay: `${index * 50}ms`,
                                    animation: 'fadeInSlide 0.4s ease-out forwards',
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    {/* Status Icon */}
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${tx.status === 'pending'
                                            ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30'
                                            : tx.status === 'failed'
                                                ? 'bg-red-500/10 text-red-500 border border-red-500/30'
                                                : (tx.type === 'prize' || tx.type === 'deposit'
                                                    ? 'bg-green-500/10 text-green-500 border border-green-500/30'
                                                    : 'bg-primary/10 text-primary border border-primary/30')
                                        } group-hover:scale-110`}>
                                        {tx.status === 'pending'
                                            ? <Loader2 size={18} className="animate-spin" />
                                            : (tx.type === 'prize' || tx.type === 'deposit'
                                                ? <ArrowDownLeft size={18} />
                                                : <ArrowUpRight size={18} />)
                                        }
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <p className="font-semibold text-foreground capitalize text-sm">
                                                {tx.description || tx.type}
                                            </p>
                                            {tx.status === 'pending' && (
                                                <span className="text-[9px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                                                    Pending
                                                </span>
                                            )}
                                            {tx.status === 'failed' && (
                                                <span className="text-[9px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                                                    Failed
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-muted-foreground">
                                            {tx.timestamp?.toDate ? tx.timestamp.toDate().toLocaleString() : 'Just now'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2.5">
                                    {tx.status === 'pending' && (
                                        <button
                                            onClick={() => manuallyCheck(tx)}
                                            className="text-[11px] bg-primary/20 text-primary hover:bg-primary/30 px-2.5 py-1.5 rounded-lg transition-all font-bold hover:scale-105"
                                        >
                                            Check
                                        </button>
                                    )}
                                    <span className={`font-bold font-rajdhani text-lg ${tx.status === 'failed'
                                            ? 'text-red-500 line-through'
                                            : (tx.type === 'prize' || tx.type === 'deposit'
                                                ? "text-green-500"
                                                : "text-foreground")
                                        }`}>
                                        {tx.type === 'prize' || tx.type === 'deposit' ? "+" : "-"} ₹{tx.amount.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} uid={user.uid} />
        </div>
    );
}
