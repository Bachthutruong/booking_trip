
import { getConfirmedTrips } from '@/actions/tripActions';
import JoinableTripsList from '@/components/trip/JoinableTripsList';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MapPinned } from 'lucide-react';

export default async function JoinTripPage() {
  // Fetching trips is now handled client-side within JoinableTripsList for better UX with filtering
  // const trips = await getConfirmedTrips(); // This can be used for SSR if preferred

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-10">
        <MapPinned className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-bold font-headline">Join an Existing Trip</h1>
        <p className="text-lg text-muted-foreground mt-2">Find a confirmed trip and hop on board!</p>
      </div>
      <Suspense fallback={<JoinableTripsSkeleton />}>
        {/* Pass initialTrips if fetched via SSR, otherwise component fetches */}
        <JoinableTripsList /> 
      </Suspense>
    </div>
  );
}

function JoinableTripsSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-12 w-full max-w-lg mx-auto" /> {/* Search Input Skeleton */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function CardSkeleton() {
    return (
        <div className="border bg-card text-card-foreground shadow-sm rounded-xl p-0 overflow-hidden">
            <Skeleton className="h-40 w-full" /> {/* Image Placeholder */}
            <div className="p-6 space-y-3">
              <Skeleton className="h-6 w-3/4" /> {/* Title */}
              <Skeleton className="h-4 w-1/2" /> {/* Sub-title / Date */}
              <Skeleton className="h-4 w-full" /> {/* Description line 1 */}
              <Skeleton className="h-4 w-5/6" /> {/* Description line 2 */}
            </div>
            <div className="p-6 pt-0">
              <Skeleton className="h-10 w-full" /> {/* Button */}
            </div>
        </div>
    );
}
