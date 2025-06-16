import { NextResponse } from 'next/server';
import { getItineraryById } from '@/actions/itineraryActions';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const itinerary = await getItineraryById(params.id);
    if (!itinerary) {
      return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 });
    }
    return NextResponse.json({ itinerary });
  } catch (error) {
    console.error('Error fetching itinerary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 