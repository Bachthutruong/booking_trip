import { NextRequest, NextResponse } from 'next/server';
import { getItineraries } from '@/actions/itineraryActions';

export async function GET(req: NextRequest) {
  const itineraries = await getItineraries();
  return NextResponse.json({ itineraries });
} 