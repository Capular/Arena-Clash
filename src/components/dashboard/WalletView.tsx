"use client";

import { CreditCard, ArrowUpRight, ArrowDownLeft, History, Loader2 } from "lucide-react";
import { useEffect, useState, useRef, memo, useCallback, useMemo } from "react";
import { doc, onSnapshot, collection, query, where, updateDoc, setDoc, increment, addDoc, Timestamp, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/auth/AuthProvider";
import PaymentModal from "@/components/payment/PaymentModal";
import { useSearchParams, useRouter } from "next/navigation";
import gsap from "gsap";

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */
interface Transaction {
    id: string;
    type: 'deposit' | 'withdrawal' | 'entry' | 'prize';
    amount: number;
    timestamp: any;
    description: string;
    status?: 'pending' | 'success' | 'failed';
    gatewayOrderId?: string;
}

/* -------------------------------------------------------------------------- */
/*                            Sub-Components (Memo)                           */
/* -------------------------------------------------------------------------- */

// 1. Balance Card Content
const BalanceCard = memo(({ balance, onAddFunds }: { balance: number; onAddFunds: () => void }) => {
    return (
        <div className="card-premium p-8 relative overflow-hidden group">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-100 pointer-events-none" />
            <div className="glass-shine pointer-events-none" />

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
                        onClick={onAddFunds}
                        className="flex-1 btn-premium flex items-center justify-center gap-2 text-sm py-2.5"
                    >
                        <ArrowDownLeft className="w-4 h-4" />
                        Add Funds
                    </button>
                    <button className="flex-1 glass-effect py-2.5 rounded-lg font-bold font-rajdhani text-sm transition-all border border-primary/20 hover:border-primary/30 flex items-center justify-center gap-2">
                        <ArrowUpRight className="w-4 h-4" />
                        Withdraw
                    </button>
                </div>
            </div>

            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
        </div>
    );
});
BalanceCard.displayName = "BalanceCard";

// 2. Stats Cards
const StatsSection = memo(({ winnings, spent }: { winnings: number; spent: number }) => {
    return (
        <div className="grid grid-cols-2 gap-4">
            {/* Winnings Card */}
            <div className="card-premium p-5 flex flex-col justify-between group hover:border-green-500/20 transition-all relative overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 mb-3 border border-green-500/20">
                    <ArrowDownLeft size={20} />
                </div>
                <div>
                    <p className="text-muted-foreground text-xs font-medium mb-1">Total Winnings</p>
                    <p className="text-2xl font-bold text-green-400 font-rajdhani">₹{winnings.toFixed(2)}</p>
                </div>
            </div>

            {/* Spent Card */}
            <div className="card-premium p-5 flex flex-col justify-between group hover:border-primary/20 transition-all relative overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3 border border-primary/20">
                    <ArrowUpRight size={20} />
                </div>
                <div>
                    <p className="text-muted-foreground text-xs font-medium mb-1">Total Spent</p>
                    <p className="text-2xl font-bold text-foreground font-rajdhani">₹{spent.toFixed(2)}</p>
                </div>
            </div>
        </div>
    );
});
StatsSection.displayName = "StatsSection";


// 3. Single Transaction Item
const TransactionItem = memo(({
    tx,
    isExpanded,
    onToggle,
    onVerify
}: {
    tx: Transaction;
    isExpanded: boolean;
    onToggle: (id: string) => void;
    onVerify: (tx: Transaction) => void;
}) => {

    // Helper to determine icon color/style
    const getStatusStyles = () => {
        if (tx.status === 'pending') return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
        if (tx.status === 'failed') return 'bg-red-500/10 text-red-500 border-red-500/20';
        if (tx.type === 'prize' || tx.type === 'deposit') return 'bg-green-500/10 text-green-500 border-green-500/20';
        return 'bg-primary/10 text-primary border-primary/20';
    };

    const isPositive = tx.type === 'prize' || tx.type === 'deposit';

    return (
        <div
            onClick={() => onToggle(tx.id)}
            className={`relative overflow-hidden rounded-xl transition-all duration-200 border cursor-pointer ${isExpanded
                    ? 'bg-card/80 border-primary/30 ring-1 ring-primary/20 shadow-md transform scale-[1.01]'
                    : 'bg-card/50 hover:bg-card/80 border-border/50 hover:border-primary/20'
                }`}
        >
            {/* Main Row Content */}
            <div className="flex items-center justify-start p-3.5 gap-4">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center border transition-colors duration-300 ${getStatusStyles()}`}>
                    {isPositive ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                </div>

                {/* Text Info */}
                <div className="min-w-0 flex-1 text-left">
                    <div className="flex flex-wrap items-center justify-start gap-2 mb-0.5">
                        <p className="font-semibold text-foreground capitalize text-sm truncate">
                            {tx.description || tx.type}
                        </p>

                        {/* Status Badges */}
                        {tx.status === 'pending' && (
                            <span className="text-[9px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide flex-shrink-0">
                                Pending
                            </span>
                        )}
                        {tx.status === 'failed' && (
                            <span className="text-[9px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide flex-shrink-0">
                                Failed
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate text-left">
                        {tx.timestamp?.toDate ? tx.timestamp.toDate().toLocaleString() : 'Just now'}
                    </p>
                </div>

                {/* Amount */}
                <div className="flex-shrink-0 relative z-10 ml-auto">
                    <span className={`font-bold font-rajdhani text-lg whitespace-nowrap ${tx.status === 'failed'
                            ? 'text-red-500 line-through opacity-70'
                            : (isPositive ? "text-green-500" : "text-foreground")
                        }`}>
                        {isPositive ? "+" : "-"} ₹{tx.amount.toFixed(2)}
                    </span>
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 duration-300 text-left">
                    <div className="h-px w-full bg-border/50 mb-3" />
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                        <div className="col-span-2">
                            <p className="text-muted-foreground mb-1 text-left">Transaction ID</p>
                            <p className="font-mono text-xs bg-muted/50 p-1.5 rounded select-all text-foreground/80 break-all border border-white/5 text-left">
                                {tx.id}
                            </p>
                        </div>

                        {tx.gatewayOrderId && (
                            <div className="col-span-2">
                                <p className="text-muted-foreground mb-1 text-left">Gateway Ref</p>
                                <p className="font-mono text-xs bg-muted/50 p-1.5 rounded select-all text-foreground/80 break-all border border-white/5 text-left">
                                    {tx.gatewayOrderId}
                                </p>
                            </div>
                        )}

                        <div>
                            <p className="text-muted-foreground mb-0.5 text-left">Type</p>
                            <p className="font-medium text-foreground capitalize text-left">{tx.type}</p>
                        </div>

                        <div>
                            <p className="text-muted-foreground mb-0.5 text-left">Status</p>
                            <p className={`font-medium capitalize text-left ${tx.status === 'success' ? 'text-green-500' :
                                    tx.status === 'pending' ? 'text-yellow-500' : 'text-red-500'
                                }`}>
                                {tx.status || 'Success'}
                            </p>
                        </div>

                        {tx.status === 'pending' && (
                            <div className="col-span-2 mt-2">
                                <div className="text-yellow-500/80 italic text-[10px] text-center w-full mb-1">
                                    Checking status automatically...
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onVerify(tx);
                                    }}
                                    className="w-full text-xs bg-primary/10 text-primary hover:bg-primary/20 py-2 rounded-lg transition-all font-bold opacity-50 hover:opacity-100"
                                >
                                    Force Check
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
});
TransactionItem.displayName = "TransactionItem";


/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */

export default function WalletView() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    // -- State --
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState({ winnings: 0, spent: 0 });
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    // Pagination (Client Side for smoothness on small lists)
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // View State
    const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
    const processedRef = useRef(false);
    const checkedTxIds = useRef<Set<string>>(new Set());

    // -- Animation Refs --
    const mainContainerRef = useRef<HTMLDivElement>(null);

    // -- Derived State (Memoized) --
    const displayedTransactions = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return transactions.slice(startIndex, endIndex);
    }, [transactions, currentPage]);

    const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);

    // -- Handlers --
    const toggleExpand = useCallback((id: string) => {
        setExpandedTxId(prev => (prev === id ? null : id));
    }, []);

    const handleNextPage = useCallback(() => {
        if (currentPage < totalPages) setCurrentPage(p => p + 1);
    }, [currentPage, totalPages]);

    const handlePrevPage = useCallback(() => {
        if (currentPage > 1) setCurrentPage(p => p - 1);
    }, [currentPage]);

    // -- Data Fetching --
    useEffect(() => {
        if (!user) return;

        // Balance Listener
        const userUnsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
            if (doc.exists()) {
                setBalance(doc.data().walletBalance || 0);
            }
        });

        // Transactions Listener
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

            // Sort by Date Descending
            txs.sort((a, b) => {
                const timeA = a.timestamp?.seconds || 0;
                const timeB = b.timestamp?.seconds || 0;
                return timeB - timeA;
            });

            // Update State (Limit to latest 50 for performance)
            setTransactions(txs.slice(0, 50));
            setStats({ winnings: totalWinnings, spent: totalSpent });
        });

        return () => {
            userUnsub();
            txUnsub();
        };
    }, [user]);

    // -- GSAP Entrance --
    useEffect(() => {
        if (!mainContainerRef.current) return;
        const ctx = gsap.context(() => {
            gsap.fromTo(mainContainerRef.current!.children,
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: "power2.out" }
            );
        }, mainContainerRef);
        return () => ctx.revert();
    }, []);


    // -- Verification Logic --
    const verifyTransaction = useCallback(async (tx: Transaction, silent = false) => {
        if (!tx.id || !user) return;
        const oid = (tx as any).gatewayOrderId;
        if (!oid) return;

        try {
            if (!silent) alert("Checking status...");

            const res = await fetch('/api/payment/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: oid })
            });
            const data = await res.json();

            const rawStatus = data.data?.status || data.result?.status;
            const innerStatus = String(rawStatus || '').trim().toLowerCase();
            const isPaid = (innerStatus === 'success');
            const isFailed = (innerStatus === 'failure' || innerStatus === 'failed');

            if (isPaid) {
                let amount = 100; // Default fallback
                if (data.amount) amount = parseFloat(String(data.amount));
                else if (data.data?.amount) amount = parseFloat(String(data.data.amount));
                if (isNaN(amount) || amount <= 0) amount = Number(tx.amount) || 100;

                await updateDoc(doc(db, "transactions", tx.id), {
                    status: 'success',
                    description: "Wallet Recharge",
                    amount: amount,
                    gatewayRef: data.upi_txn_id || "Auto-Verified"
                });

                await setDoc(doc(db, "users", user.uid), {
                    walletBalance: increment(amount)
                }, { merge: true });

                if (!silent) alert(`Verified! Added ₹${amount}`);

            } else if (isFailed || (data.status === 'error' && data.message?.includes('Record not found'))) {
                await updateDoc(doc(db, "transactions", tx.id), {
                    status: 'failed',
                    description: "Recharge Failed",
                    gatewayRef: data.message || "Gateway Failed"
                });
                if (!silent) alert("Transaction marked as failed.");
            } else {
                if (!silent) alert(`Status: ${innerStatus}`);
            }

        } catch (e) {
            console.error(e);
            if (!silent) alert("Error checking status");
        }
    }, [user]);

    // -- Auto-verify Effect (Optimized) --
    useEffect(() => {
        if (!transactions.length) return;

        // Find pending txs we haven't checked this session
        const pendingToVerify = transactions.filter(tx =>
            tx.status === 'pending' && !checkedTxIds.current.has(tx.id)
        );

        if (pendingToVerify.length > 0) {
            pendingToVerify.forEach(tx => {
                checkedTxIds.current.add(tx.id); // Mark as checked immediately
                verifyTransaction(tx, true);
            });
        }
    }, [transactions, verifyTransaction]);

    // -- Payment Return Handler --
    useEffect(() => {
        const checkPayment = async () => {
            const status = searchParams.get('status');
            const oid = searchParams.get('oid');

            if (status === 'check' && oid && user && !processedRef.current) {
                processedRef.current = true;

                try {
                    const res = await fetch('/api/payment/status', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ orderId: oid })
                    });
                    const data = await res.json();

                    if (data.status === 'success' || (data.data && data.data.status === 'success')) {
                        // Check if already exists to avoid double credit
                        const txQuery = query(collection(db, "transactions"), where("gatewayOrderId", "==", oid));
                        const txSnap = await getDocs(txQuery);

                        let amount = 100;
                        if (data.amount) amount = parseFloat(String(data.amount));
                        else if (data.data?.amount) amount = parseFloat(String(data.data.amount));

                        if (!txSnap.empty) {
                            const txDoc = txSnap.docs[0];
                            if (txDoc.data().status !== 'success') {
                                await updateDoc(doc(db, "transactions", txDoc.id), {
                                    status: 'success', amount, gatewayRef: data.upi_txn_id || "Verified"
                                });
                                await setDoc(doc(db, "users", user.uid), { walletBalance: increment(amount) }, { merge: true });
                                alert(`Payment Success! Added ₹${amount}`);
                            }
                        } else {
                            // Create missing tx
                            await addDoc(collection(db, "transactions"), {
                                userId: user.uid, type: 'deposit', amount, timestamp: Timestamp.now(), description: "Wallet Recharge", gatewayOrderId: oid, status: 'success', gatewayRef: data.upi_txn_id
                            });
                            await setDoc(doc(db, "users", user.uid), { walletBalance: increment(amount) }, { merge: true });
                            alert(`Payment Success! Added ₹${amount}`);
                        }
                    } else {
                        alert("Payment checking failed or pending.");
                    }
                    router.replace('/');
                } catch (e) {
                    console.error(e);
                    router.replace('/');
                }
            }
        };
        if (searchParams.get('status') === 'check') checkPayment();
    }, [searchParams, user, router]);


    // -- Empty State Helper --
    if (!user) return <div className="text-center p-10 text-muted-foreground">Please log in.</div>;

    if (searchParams.get('status') === 'check') {
        return (
            <div className="flex flex-col items-center justify-center p-20 animate-in fade-in">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="font-rajdhani text-xl">Verifying Payment...</p>
            </div>
        );
    }

    return (
        <div ref={mainContainerRef} className="space-y-6">

            {/* 1. Header with Balance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <BalanceCard balance={balance} onAddFunds={() => setIsPaymentModalOpen(true)} />
                <StatsSection winnings={stats.winnings} spent={stats.spent} />
            </div>

            {/* 2. Transactions List */}
            <div className="card-premium p-6">
                <div className="flex items-center gap-3 mb-5 pl-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <History className="text-primary" size={16} />
                    </div>
                    <h3 className="font-rajdhani font-bold text-xl text-foreground">Recent Transactions</h3>
                </div>

                {transactions.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">No transactions found.</div>
                ) : (
                    <div className="space-y-2">
                        {displayedTransactions.map(tx => (
                            <TransactionItem
                                key={tx.id}
                                tx={tx}
                                isExpanded={expandedTxId === tx.id}
                                onToggle={toggleExpand}
                                onVerify={verifyTransaction}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination Controls */}
                {transactions.length > ITEMS_PER_PAGE && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/40">
                        <p className="text-xs text-muted-foreground pl-2">
                            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, transactions.length)} of {transactions.length}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrevPage}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg bg-card border border-primary/20 hover:bg-primary/10 disabled:opacity-30 disabled:hover:bg-card transition-all"
                            >
                                <ArrowDownLeft className="w-4 h-4 rotate-90" />
                            </button>
                            <span className="text-xs font-bold font-rajdhani bg-primary/10 px-3 py-1.5 rounded-md text-primary">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg bg-card border border-primary/20 hover:bg-primary/10 disabled:opacity-30 disabled:hover:bg-card transition-all"
                            >
                                <ArrowUpRight className="w-4 h-4 rotate-90" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                uid={user.uid}
            />
        </div>
    );
}
