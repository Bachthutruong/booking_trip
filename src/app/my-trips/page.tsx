import MyTripsClient from '@/components/trip/MyTripsClient';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function MyTripsPage({
  searchParams,
}: {
  searchParams?: { tripId?: string; phone?: string; name?: string };
}) {
  const tripIdFromParam = searchParams?.tripId ? String(searchParams.tripId) : undefined;
  const phoneFromParam = searchParams?.phone ? String(searchParams.phone) : undefined;
  const nameFromParam = searchParams?.name ? String(searchParams.name) : undefined;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-10 text-center font-headline">管理您的共乘</h1>
      <Suspense fallback={<MyTripsSkeleton />}>
        <MyTripsClient tripIdFromParam={tripIdFromParam} phoneFromParam={phoneFromParam} nameFromParam={nameFromParam} />
      </Suspense>
    </div>
  );
}

function MyTripsSkeleton() {
  return (
    <div className="max-w-3xl mx-auto">
      <Skeleton className="h-10 w-full mb-6" /> {/* Phone input */}
      <Skeleton className="h-12 w-1/3 mb-8" /> {/* Fetch button */}
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-40 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
