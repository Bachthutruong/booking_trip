import { getItineraries } from '@/actions/itineraryActions';
import { Skeleton } from '@/components/ui/skeleton';
import { ITINERARY_TYPES } from '@/lib/constants';
import CreateTripItinerarySelector from '@/components/trip/CreateTripItinerarySelector';
import CreateTripFormWrapper from '@/components/trip/CreateTripFormWrapper';
import { Suspense } from 'react';

// Add route segment config
export const revalidate = 30; // revalidate every 30 seconds

export default async function CreateTripPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const selectedItineraryId = searchParams?.itineraryId as string | undefined;

  if (selectedItineraryId) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8 text-center font-headline">確認您的旅程詳情</h1>
        <CreateTripFormWrapper itineraryId={selectedItineraryId} />
      </div>
    );
  }

  // Fetch itineraries on the server side with error handling
  const itineraries = await getItineraries().catch(() => []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-10 text-center font-headline">選擇您的旅程：選擇旅程</h1>
      <CreateTripItinerarySelector itineraries={itineraries} />
    </div>
  );
}

function ItinerarySelectorSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-card rounded-lg p-4 space-y-4">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

function CreateTripFormSkeleton() {
  return (
    <div className="max-w-2xl mx-auto bg-card p-6 sm:p-8 rounded-xl shadow-xl space-y-6">
      <Skeleton className="h-8 w-3/4 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-10 w-full" />
      <div>
        <Skeleton className="h-6 w-1/4 mb-2" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

