import { NextRequest, NextResponse } from 'next/server';
import { getTripsPaginated, getTripsCount } from '@/actions/tripActions';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const PAGE_SIZE = 10;
  const skip = (page - 1) * PAGE_SIZE;
  const trips = await getTripsPaginated(PAGE_SIZE, skip, search, status);
  const totalTrips = await getTripsCount(search, status);
  return NextResponse.json({ trips, totalTrips });
} 