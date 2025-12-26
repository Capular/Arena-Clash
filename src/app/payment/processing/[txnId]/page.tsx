"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle, AlertCircle, ArrowRight, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import gsap from "gsap";
import { toast } from "sonner";

// This page handles both the "intermediate" state (before paying) and "verifying" state (after paying)
export default function PaymentProcessingPage({ params }: { params: { txnId: string } }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const txnId = params.txnId;
    const paymentUrl = searchParams.get("url");
    const isReturning = searchParams.get("status") === "check"; // Flag from ZapUPI redirect

    const [status, setStatus] = useState<'pending' | 'success' | 'failed'>('pending');
    const [verifying, setVerifying] = useState(false);

    // Copy Txn ID
    const copyTxnId = () => {
        navigator.clipboard.writeText(txnId);
        toast.success("Transaction ID copied to clipboard");
    };

    // 1. Listen for real-time status updates from Firestore
    useEffect(() => {
        const unsub = onSnapshot(doc(db, "transactions", txnId), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                if (data.status === 'success') {
                    setStatus('success');
                    setVerifying(false);
                    // Redirect to wallet after short delay
                    setTimeout(() => router.push('/?tab=wallet'), 3000);
                } else if (data.status === 'failed') {
                    setStatus('failed');
                    setVerifying(false);
                }
            }
        });
        return () => unsub();
    }, [txnId, router]);

    // 2. If returning from gateway, trigger a status check
    useEffect(() => {
        if (isReturning) {
            setVerifying(true);
            // Call your status check API if needed, or rely on webhook/realtime listeners.
            // For now, we rely on the Firestore listener above, assuming Webhook updates it.
            // But we can also force a check:
            fetch(`/api/payment/status?orderId=${txnId}`, { method: 'POST' })
                .catch(console.error);
        }
    }, [isReturning, txnId]);

    // Animations
    useEffect(() => {
        gsap.fromTo(".fade-in",
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: "power2.out" }
        );
    }, [status]);

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-card border border-border/50 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center text-center space-y-6">

                    {/* Icon Status */}
                    <div className="fade-in">
                        {status === 'pending' && (
                            <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mb-2 animate-pulse">
                                <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
                            </div>
                        )}
                        {status === 'success' && (
                            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
                                <CheckCircle2 className="w-10 h-10 text-green-500" />
                            </div>
                        )}
                        {status === 'failed' && (
                            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-2">
                                <XCircle className="w-10 h-10 text-red-500" />
                            </div>
                        )}
                    </div>

                    {/* Text Status */}
                    <div className="fade-in space-y-2">
                        <h2 className="text-2xl font-bold font-rajdhani text-foreground">
                            {status === 'pending' ? (isReturning || verifying ? "Verifying Payment..." : "Complete Payment") :
                                status === 'success' ? "Payment Successful!" : "Payment Failed"}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {status === 'pending' ?
                                (isReturning ? "Please wait while we confirm your transaction." : "Please complete the transaction with the provider.") :
                                status === 'success' ? "Funds have been added to your wallet." :
                                    "Something went wrong. Please try again."
                            }
                        </p>
                    </div>

                    {/* Transaction ID */}
                    <div className="fade-in w-full bg-muted/30 rounded-lg p-3 flex items-center justify-between border border-border/50">
                        <div className="text-left">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Transaction ID</p>
                            <p className="text-sm font-mono font-medium text-foreground">{txnId}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={copyTxnId}>
                            <Copy size={14} />
                        </Button>
                    </div>

                    {/* Action Buttons */}
                    <div className="fade-in w-full pt-2">
                        {status === 'pending' && !isReturning && paymentUrl && (
                            <Button className="w-full gap-2 font-bold font-rajdhani" size="lg" onClick={() => window.location.href = paymentUrl}>
                                Pay Now <ExternalLink size={16} />
                            </Button>
                        )}

                        {status === 'success' && (
                            <Button className="w-full gap-2 font-bold font-rajdhani" variant="outline" onClick={() => router.push('/?tab=wallet')}>
                                Return to Wallet <ArrowRight size={16} />
                            </Button>
                        )}

                        {status === 'failed' && (
                            <Button className="w-full gap-2 font-bold font-rajdhani" variant="destructive" onClick={() => router.push('/?tab=wallet')}>
                                Go Back <ArrowRight size={16} />
                            </Button>
                        )}

                        {/* Manual Check Button for stuck pending states */}
                        {status === 'pending' && (
                            <div className="mt-4">
                                <button
                                    onClick={() => fetch(`/api/payment/status?orderId=${txnId}`, { method: 'POST' })}
                                    className="text-xs text-primary underline hover:text-primary/80 transition-colors"
                                >
                                    Check Status Again
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
