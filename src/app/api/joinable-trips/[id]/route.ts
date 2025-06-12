import { NextRequest, NextResponse } from 'next/server';
import { getTripById } from '@/actions/tripActions';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const trip = await getTripById(params.id);
    if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    return NextResponse.json({ trip });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch trip detail' }, { status: 500 });
  }
} 