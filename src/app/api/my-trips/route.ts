import { NextRequest, NextResponse } from 'next/server';
import { getUserTrips } from '@/actions/tripActions';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone') || '';
  const name = searchParams.get('name') || '';
  if (!phone || !name) {
    return NextResponse.json({ trips: [] });
  }
  const trips = await getUserTrips(phone, name);
  return NextResponse.json({ trips });
} 