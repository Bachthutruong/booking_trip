import { getItineraries } from '@/actions/itineraryActions';
import ItinerarySelectionStep from '@/components/trip/ItinerarySelectionStep';
import CreateTripFormWrapper from '@/components/trip/CreateTripFormWrapper';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ITINERARY_TYPES } from '@/lib/constants';
import CreateTripItinerarySelector from '@/components/trip/CreateTripItinerarySelector';

export default async function CreateTripPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const selectedItineraryId = searchParams?.itineraryId as string | undefined;
  const initialItineraryType = searchParams?.type as string | undefined;

  if (selectedItineraryId) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8 text-center font-headline">確認您的旅程詳情</h1>
        <Suspense fallback={<CreateTripFormSkeleton />}>
          <CreateTripFormWrapper itineraryId={selectedItineraryId} />
        </Suspense>
      </div>
    );
  }

  const allItineraries = await getItineraries();

  // Convert to plain objects to avoid the "toJSON" error when passing to Client Components
  const plainItineraries = allItineraries.map(itn => ({
    id: itn.id, // Mongoose documents have a .id getter that returns _id as a string
    name: itn.name,
    type: itn.type,
    pricePerPerson: itn.pricePerPerson,
    description: itn.description,
    imageUrl: itn.imageUrl,
    availableTimes: itn.availableTimes,
    // Add any other properties from your Itinerary type that are needed in client components
  }));

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-10 text-center font-headline">選擇您的旅程：選擇旅程</h1>
      <CreateTripItinerarySelector itineraries={plainItineraries} />
    </div>
  );
}

function CreateTripFormSkeleton() {
  return (
    <div className="max-w-2xl mx-auto bg-card p-6 sm:p-8 rounded-xl shadow-xl space-y-6">
      <Skeleton className="h-8 w-3/4 mb-4" /> {/* Itinerary Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-10 w-full" /> {/* Date */}
        <Skeleton className="h-10 w-full" /> {/* Time */}
      </div>
      <Skeleton className="h-10 w-full" /> {/* Num people */}
      <Skeleton className="h-10 w-full" /> {/* Address field 1 */}
      <Skeleton className="h-10 w-full" /> {/* Address field 2 (optional) */}
      <Skeleton className="h-10 w-full" /> {/* Contact Name */}
      <Skeleton className="h-10 w-full" /> {/* Contact Phone */}
      <Skeleton className="h-10 w-full" /> {/* Secondary Contact */}
      <Skeleton className="h-20 w-full" /> {/* Notes */}
      <Skeleton className="h-10 w-full" /> {/* District */}
      <div>
        <Skeleton className="h-6 w-1/4 mb-2" /> {/* Additional Services Label */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
      <Skeleton className="h-10 w-1/2" /> {/* Price */}
      <Skeleton className="h-12 w-full" /> {/* Submit Button */}
    </div>
  )
}

