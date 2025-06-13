import { Suspense } from 'react';
import MyTripsClient from '@/components/trip/MyTripsClient';
import { Skeleton } from '@/components/ui/skeleton';
import { getUserTrips } from '@/actions/tripActions';
import { getDistrictSurcharges } from '@/actions/configActions';
import type { Trip } from '@/lib/types';

// Add route segment config
export const revalidate = 30; // revalidate every 30 seconds
export const dynamic = 'force-dynamic';

export default async function MyTripsPage({ searchParams }: { searchParams?: { tripId?: string; phone?: string; name?: string } }) {
  const tripIdFromParam = searchParams?.tripId ? String(searchParams.tripId) : undefined;
  const phoneFromParam = searchParams?.phone ? String(searchParams.phone) : undefined;
  const nameFromParam = searchParams?.name ? String(searchParams.name) : undefined;

  // Fetch trips and districts in parallel with error handling
  const [serverTrips, districts] = await Promise.all([
    phoneFromParam && nameFromParam 
      ? getUserTrips(phoneFromParam, nameFromParam).catch(() => [])
      : Promise.resolve([]),
    getDistrictSurcharges().catch(() => [])
  ]);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-10 text-center font-headline">管理您的共乘</h1>
      <MyTripsClient 
        tripIdFromParam={tripIdFromParam} 
        phoneFromParam={phoneFromParam} 
        nameFromParam={nameFromParam} 
        serverTrips={serverTrips}
        districts={districts}
      />
    </div>
  );
}

function MyTripsSkeleton() {
  return (
    <div className="max-w-3xl mx-auto">
      <Skeleton className="h-10 w-full mb-6" />
      <Skeleton className="h-12 w-1/3 mb-8" />
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-40 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
