import CreateTripItinerarySelectorClient from "./CreateTripItinerarySelectorClient";
import { headers } from 'next/headers';

// Add cache constant
const CACHE_TIME = 60 * 5; // 5 minutes

async function getItineraries(baseUrl: string) {
  const res = await fetch(`${baseUrl}/api/admin/itineraries/list`, {
    next: { 
      revalidate: CACHE_TIME,
      tags: ['itineraries']
    },
    headers: {
      'Cache-Control': `s-maxage=${CACHE_TIME}, stale-while-revalidate`
    }
  });

  if (!res.ok) {
    return { itineraries: [] };
  }

  return res.json();
}

export default async function CreateTripItinerarySelectorServer() {
  const headersList = await headers();
  const host = headersList.get('host');
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const baseUrl = host ? `${protocol}://${host}` : 'http://localhost:3000';
  
  const data = await getItineraries(baseUrl);
  
  return <CreateTripItinerarySelectorClient initialItineraries={data?.itineraries || []} />;
} 