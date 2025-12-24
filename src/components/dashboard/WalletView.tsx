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
        const oid = (tx as any).gatewayOrderId; // Assuming we add this to local state (need to ensure it's in query)

        // If gatewayOrderId isn't in the type, we might need to fetch it or rely on it being there. 
        // We added it to the push logic in useEffect, so let's ensure it's there.
        // Actually, the Transaction interface doesn't have gatewayOrderId. Let's adding it to interface first or casting it.

        if (!oid) {
            console.log("Tx Data:", tx);
            alert(`No Order ID found. (Tx ID: ${tx.id}, Keys: ${Object.keys(tx).join(', ')})`);
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

            // STRICT CHECK: The API response status="success" just means the API call worked. 
            // We must check the INNER order status.
            const rawStatus = data.data?.status || data.result?.status;
            const innerStatus = String(rawStatus || '').trim().toLowerCase();

            const isPaid = (innerStatus === 'success');

            if (isPaid) {
                let amount = 100;
                if (data.amount) amount = parseFloat(String(data.amount));
                else if (data.data?.amount) amount = parseFloat(String(data.data.amount));

                if (isNaN(amount) || amount <= 0) amount = Number(tx.amount) || 100;

                // Ensure strict number for increment
                const finalAmount = Number(amount);

                await updateDoc(doc(db, "transactions", tx.id), {
                    status: 'success',
                    description: "Wallet Recharge",
                    amount: finalAmount,
                    gatewayRef: data.upi_txn_id || "Manual Check"
                });

                // Use setDoc with merge to ensure user doc exists
                await setDoc(doc(db, "users", user.uid), {
                    walletBalance: increment(finalAmount)
                }, { merge: true });

                console.log(`Updated balance by ${amount}`);
                alert(`Transaction Confirmed! Added ₹${amount} to wallet.`);
            } else if (data.status === 'error' && data.message?.includes('Record not found')) {
                alert("Gateway says Record Not Found. (Likely failed or invalid ID)");
            } else {
                alert(`Transaction Pending or Failed.\nGateway Status: "${rawStatus}" (Normalized: ${innerStatus})\nAPI Message: ${data.message || ''}`);
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
                        // Check for existing tx
                        const txQuery = query(collection(db, "transactions"), where("gatewayOrderId", "==", oid));
                        const txSnap = await getDocs(txQuery);

                        if (!txSnap.empty) {
                            const txDoc = txSnap.docs[0];
                            const txData = txDoc.data();

                            // Only update if not already success
                            if (txData.status !== 'success') {
                                let amount = 100;
                                if (data.amount) amount = parseFloat(String(data.amount));
                                else if (data.data?.amount) amount = parseFloat(String(data.data.amount));

                                if (isNaN(amount) || amount <= 0) amount = txData.amount || 100;

                                log(`Updating pending transaction ${txDoc.id} to success. Amount: ${amount}`);

                                await updateDoc(doc(db, "transactions", txDoc.id), {
                                    status: 'success',
                                    description: "Wallet Recharge",
                                    amount: amount, // confirm amount from gateway
                                    gatewayRef: data.upi_txn_id || "N/A"
                                });

                                // Use setDoc with merge to ensure user doc exists
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
                            // Fallback: If pending doc wasn't found (rare), create new
                            log("No pending doc found, creating new.");
                            let amount = 100;
                            if (data.amount) amount = parseFloat(String(data.amount));
                            else if (data.data?.amount) amount = parseFloat(String(data.data.amount));

                            // Check for NaN
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

                            // Use setDoc with merge to ensure user doc exists
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
                {/* Balance Card */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/20 via-neutral-900 to-black border border-primary/20 relative overflow-hidden shadow-2xl shadow-primary/5">
                    <div className="relative z-10">
                        <p className="text-primary font-medium mb-1">Total Balance</p>
                        <h2 className="text-5xl font-bold font-rajdhani text-white mb-8 tracking-tight">
                            ₹{balance.toFixed(2)}
                        </h2>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsPaymentModalOpen(true)}
                                className="flex-1 bg-primary text-white py-3 rounded-xl font-bold font-rajdhani text-lg shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all hover:scale-[1.02]"
                            >
                                Add Funds
                            </button>
                            <button className="flex-1 bg-white/5 text-white py-3 rounded-xl font-bold font-rajdhani text-lg border border-white/10 hover:bg-white/10 transition-all hover:scale-[1.02]">
                                Withdraw
                            </button>
                        </div>
                    </div>
                    {/* Background decoration */}
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/20 blur-[100px] rounded-full" />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 rounded-2xl bg-card border border-border flex flex-col justify-center hover:border-primary/30 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 mb-4 border border-green-500/20">
                            <ArrowDownLeft size={24} />
                        </div>
                        <p className="text-muted-foreground text-sm font-medium">Recent Winnings</p>
                        <p className="text-2xl font-bold text-white font-rajdhani">₹{stats.winnings.toFixed(2)}</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-card border border-border flex flex-col justify-center hover:border-primary/30 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 mb-4 border border-orange-500/20">
                            <CreditCard size={24} />
                        </div>
                        <p className="text-muted-foreground text-sm font-medium">Recent Spent</p>
                        <p className="text-2xl font-bold text-white font-rajdhani">₹{stats.spent.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* Transactions */}
            <div className="rounded-2xl bg-card border border-border p-6 shadow-xl shadow-black/20">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-rajdhani font-bold text-xl text-white flex items-center gap-2">
                        <History className="text-primary" size={20} />
                        Recent Transactions
                    </h3>
                    <button className="text-sm text-primary hover:underline font-medium">View All History</button>
                </div>

                {transactions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No recent transactions.</p>
                ) : (
                    <div className="space-y-2">
                        {transactions.map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : tx.status === 'failed' ? 'bg-red-500/10 text-red-500' : (tx.type === 'prize' || tx.type === 'deposit' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500')}`}>
                                        {tx.status === 'pending' ? <History size={18} /> : (tx.type === 'prize' || tx.type === 'deposit' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-sm capitalize">
                                            {tx.description || tx.type}
                                            {tx.status === 'pending' && <span className="ml-2 text-[10px] bg-yellow-500/20 text-yellow-500 px-1 rounded">PENDING</span>}
                                            {tx.status === 'failed' && <span className="ml-2 text-[10px] bg-red-500/20 text-red-500 px-1 rounded">FAILED</span>}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {tx.timestamp?.toDate ? tx.timestamp.toDate().toLocaleDateString() : 'Just now'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {tx.status === 'pending' && (
                                        <button
                                            onClick={() => manuallyCheck(tx)}
                                            className="text-xs bg-primary/20 text-primary hover:bg-primary/30 px-3 py-1.5 rounded-lg transition-colors font-bold"
                                        >
                                            Check Status
                                        </button>
                                    )}
                                    <span className={`font-bold font-rajdhani text-lg ${tx.status === 'failed' ? 'text-red-500 line-through' : (tx.type === 'prize' || tx.type === 'deposit' ? "text-green-500" : "text-white")}`}>
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
