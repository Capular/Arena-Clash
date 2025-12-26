import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

const TOKEN_KEY = "65152fcfe4b3eaa9deb750d8710b953b";
const SECRET_KEY = "43530d9881bb470f78a1f9563d6510b3";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { orderId } = body;

        console.log("Checking status for Order ID:", orderId);

        // 1. Check status with Gateway
        const payload = new URLSearchParams();
        payload.append('token_key', TOKEN_KEY);
        payload.append('secret_key', SECRET_KEY);
        payload.append('order_id', orderId);

        const response = await fetch("https://zapupi.com/api/order-status", {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: payload
        });

        const data = await response.json();
        console.log("ZapUPI Status Response:", data);

        if (response.ok && data.status === 'success') {
            // 2. Find the transaction in Firestore
            const txQuery = await db.collection('transactions')
                .where('gatewayOrderId', '==', orderId)
                .limit(1)
                .get();

            if (txQuery.empty) {
                console.error("Transaction not found for Order ID:", orderId);
                return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
            }

            const txDoc = txQuery.docs[0];
            const txData = txDoc.data();

            // 3. Process if still pending
            if (txData.status === 'pending') {
                console.log("Processing pending transaction:", txDoc.id);

                // Run transaction to ensure atomicity
                await db.runTransaction(async (t) => {
                    // Re-read inside transaction for safety
                    const currentTxDoc = await t.get(txDoc.ref);
                    const currentTxData = currentTxDoc.data();

                    if (!currentTxData || currentTxData.status !== 'pending') {
                        throw new Error("Transaction already processed or invalid");
                    }

                    const userRef = db.collection('users').doc(txData.userId);
                    const userDoc = await t.get(userRef);

                    if (!userDoc.exists) {
                        throw new Error("User not found");
                    }

                    // Update Transaction Status
                    t.update(txDoc.ref, {
                        status: 'success',
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        paymentMethod: 'ZapUPI'
                    });

                    // Update User Balance
                    const newBalance = (userDoc.data()?.walletBalance || 0) + txData.amount;
                    t.update(userRef, {
                        walletBalance: newBalance,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                });

                console.log("Transaction processed successfully. Balance updated.");
                return NextResponse.json({ status: 'success', message: 'Transaction processed and balance updated' });
            } else if (txData.status === 'success') {
                console.log("Transaction already successful.");
                return NextResponse.json({ status: 'success', message: 'Transaction already processed' });
            } else {
                return NextResponse.json({ status: 'failed', message: 'Transaction marked as failed/invalid locally' });
            }
        } else {
            console.log("Payment status failed/pending from gateway for:", orderId);
            // Optionally update Firestore to 'failed' if gateway explicitly says failed
            // But usually we just let it stay pending or user retries.
            return NextResponse.json({ error: data.message || "Payment not successful" }, { status: 400 });
        }
    } catch (error: any) {
        console.error("Payment Verification Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
