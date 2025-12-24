import { NextResponse } from 'next/server';

const TOKEN_KEY = "65152fcfe4b3eaa9deb750d8710b953b";
const SECRET_KEY = "43530d9881bb470f78a1f9563d6510b3";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { orderId } = body;

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

        if (response.ok && data.status === 'success') {
            return NextResponse.json(data);
        } else {
            return NextResponse.json({ error: data.message }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
