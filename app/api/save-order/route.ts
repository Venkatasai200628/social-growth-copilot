import { NextRequest, NextResponse } from 'next/server';
import { UserOrder, DayMetric } from '@/lib/types';

// Server-side: use Firebase Admin or just return to client to save
// Since we use client-side Firebase, this route generates the metrics data
export async function POST(req: NextRequest) {
  try {
    const order: UserOrder = await req.json();

    // Generate projected metrics for each day based on plan + efficiency
    const multipliers = { conservative: 0.7, balanced: 1.0, aggressive: 1.5 };
    const m = multipliers[order.promotionEfficiency] || 1.0;
    const baseReach = order.planId === 'starter' ? 800 : order.planId === 'growth' ? 2500 : 8000;

    const metrics: DayMetric[] = Array.from({ length: order.duration || 7 }, (_, i) => {
      const day = i + 1;
      const growth = 1 + (day / (order.duration || 7)) * 0.8; // ramp up over campaign
      const reach = Math.round(baseReach * m * growth * (0.9 + Math.random() * 0.2));
      const date = new Date();
      date.setDate(date.getDate() + i);
      return {
        day,
        date: date.toISOString().split('T')[0],
        projected: {
          reach,
          clicks: Math.round(reach * 0.04 * m),
          impressions: Math.round(reach * 2.5),
          conversions: Math.round(reach * 0.008 * m),
        },
      };
    });

    return NextResponse.json({ metrics });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
