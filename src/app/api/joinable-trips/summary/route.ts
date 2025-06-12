import { NextRequest, NextResponse } from 'next/server';
import { getJoinableTripSummaryList } from '@/actions/tripActions';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const trips = await getJoinableTripSummaryList(limit);
    return NextResponse.json({ trips });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch joinable trips summary' }, { status: 500 });
  }
} 