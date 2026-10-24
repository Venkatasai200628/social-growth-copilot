import { NextRequest, NextResponse } from 'next/server';
import { UserOrder, DayMetric } from '@/lib/types';
import { readJson, badRequest, serverError } from '../_lib/http';

// Returns the day-by-day tracking skeleton for a campaign. GrowMitra does
// NOT project numbers — every metric is empty until the owner enters real
// results in Update Metrics.
export async function POST(req: NextRequest) {
  try {
    const body = await readJson<UserOrder>(req);
    if (!body) return badRequest('Invalid order — please restart the checkout.');

    // Cap the calendar length so a bogus duration can't allocate a huge array.
    const dur = Math.min(Math.max(parseInt(String(body.duration ?? 14), 10) || 7, 1), 60);

    const metrics: DayMetric[] = Array.from({ length: dur }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      return { day: i + 1, date: date.toISOString().split('T')[0] };
    });

    return NextResponse.json({ metrics });
  } catch (error: unknown) {
    return serverError('save-order', error);
  }
}
