import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { amount, currency = 'INR', receipt } = await req.json();

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret || keyId.includes('placeholder')) {
      // Demo mode — return a fake order
      return NextResponse.json({
        id: `order_demo_${Date.now()}`,
        amount: amount * 100,
        currency,
        receipt,
        status: 'created',
        demo: true,
      });
    }

    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify({ amount: amount * 100, currency, receipt }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.description || 'Razorpay error');
    }

    const order = await response.json();
    return NextResponse.json(order);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
