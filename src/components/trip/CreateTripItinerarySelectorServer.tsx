import CreateTripItinerarySelectorClient from "./CreateTripItinerarySelectorClient";
import { headers } from 'next/headers';

export default async function CreateTripItinerarySelectorServer() {
  const headersList = await headers();
  const host = headersList.get('host');
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const baseUrl = host ? `${protocol}://${host}` : 'http://localhost:3000';
  
  // Add caching with revalidation every 5 minutes
  const res = await fetch(`${baseUrl}/api/admin/itineraries/list`, {
    next: {
      revalidate: 300 // 5 minutes
    }
  });
  
  const data = await res.json();
  return <CreateTripItinerarySelectorClient initialItineraries={data?.itineraries || []} />;
} 