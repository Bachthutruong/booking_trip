import MyTripsClient from '@/components/trip/MyTripsClient';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function MyTripsPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const tripIdFromParam = searchParams?.tripId as string | undefined; // For highlighting new trip
  const phoneFromParam = searchParams?.phone as string | undefined;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-10 text-center font-headline">Manage Your Trips</h1>
      <Suspense fallback={<MyTripsSkeleton />}>
        <MyTripsClient tripIdFromParam={tripIdFromParam} phoneFromParam={phoneFromParam} />
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
