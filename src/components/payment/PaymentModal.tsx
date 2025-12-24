"use client";

import { useState } from "react";
import { X, ShieldCheck } from "lucide-react";

import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    uid: string;
}

export default function PaymentModal({ isOpen, onClose, uid }: PaymentModalProps) {
    const [amount, setAmount] = useState("100");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handlePayment = async () => {
        setLoading(true);
        setError("");
        try {
            // Generate a numeric Order ID (10-15 digits)
            const orderId = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
            // Robust random mobile: Start with 9, then 9 random digits. 
            // Math.random() * 900000000 + 100000000 ensures 9 digits (100000000 to 999999999)
            const randomMobile = `9${Math.floor(100000000 + Math.random() * 900000000)}`;

            // Record Pending Transaction in Firestore immediately
            await addDoc(collection(db, "transactions"), {
                userId: uid,
                type: 'deposit',
                amount: parseFloat(amount),
                timestamp: Timestamp.now(),
                description: "Wallet Recharge (Pending)",
                gatewayOrderId: orderId,
                status: 'pending' // New field
            });

            console.log("Initiating Payment with Order ID:", orderId, "Mobile:", randomMobile);

            const res = await fetch(`/api/payment/create?t=${Date.now()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount,
                    orderId,
                    customerMobile: randomMobile
                })
            });

            const data = await res.json();
            console.log("CreateOrder Response:", data);

            // Robust check for payment URL
            const paymentUrl = data.result?.payment_url || data.payment_url || data.data?.payment_url;

            if ((data.status === 'success' || data.status === true) && paymentUrl) {
                // Redirect user to payment page
                window.location.href = paymentUrl;
            } else {
                // Show detailed error
                const msg = data.error || data.message || "Failed to initiate payment";
                const detailed = data.fullError ? JSON.stringify(data.fullError) : "";
                setError(`${msg} (ID: ${orderId}) ${detailed}`);
                console.error("Payment Error Payload:", JSON.stringify(data, null, 2));
            }

        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 relative shadow-2xl shadow-primary/10">
                <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors">
                    <X size={20} />
                </button>

                <h2 className="text-xl font-bold font-rajdhani text-white mb-6">Add Funds</h2>

                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        {["100", "500", "1000"].map((amt) => (
                            <button
                                key={amt}
                                onClick={() => setAmount(amt)}
                                className={`py-2 rounded-lg border text-sm font-bold transition-all ${amount === amt ? "border-primary bg-primary/20 text-primary" : "border-border bg-black/20 text-muted-foreground hover:text-white"}`}
                            >
                                ₹{amt}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground ml-1">Enter Amount (₹)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-black/20 border border-border rounded-xl p-3 text-white focus:border-primary focus:outline-none transition-colors font-rajdhani font-bold text-lg"
                            placeholder="100"
                        />
                    </div>

                    {error && <p className="text-xs text-red-500">{error}</p>}

                    <button
                        onClick={handlePayment}
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? <div className="h-4 w-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <ShieldCheck size={18} />}
                        {loading ? "Processing..." : `Pay ₹${amount}`}
                    </button>

                    <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
                        <ShieldCheck size={10} /> Secured by ZapUPI
                    </p>
                </div>
            </div>
        </div>
    );
}
