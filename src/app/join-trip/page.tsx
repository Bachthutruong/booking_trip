import { getConfirmedTrips } from '@/actions/tripActions';
import JoinableTripsList from '@/components/trip/JoinableTripsList';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default async function JoinTripPage() {
  const trips = await getConfirmedTrips();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-10 text-center font-headline">Join an Existing Trip</h1>
      <Suspense fallback={<JoinableTripsSkeleton />}>
        <JoinableTripsList initialTrips={trips} />
      </Suspense>
    </div>
  );
}

function JoinableTripsSkeleton() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

function CardSkeleton() {
    return (
        <div className="border bg-card text-card-foreground shadow-sm rounded-lg p-6 space-y-4">
            <Skeleton className="h-6 w-3/4" /> {/* Title */}
            <Skeleton className="h-4 w-1/2" /> {/* Sub-title / Date */}
            <Skeleton className="h-4 w-full" /> {/* Description line 1 */}
            <Skeleton className="h-4 w-5/6" /> {/* Description line 2 */}
            <Skeleton className="h-10 w-full mt-4" /> {/* Button */}
        </div>
    );
}
