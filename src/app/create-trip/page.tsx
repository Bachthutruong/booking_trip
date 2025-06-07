import { getItineraries } from '@/actions/itineraryActions';
import ItinerarySelectionStep from '@/components/trip/ItinerarySelectionStep';
import CreateTripFormWrapper from '@/components/trip/CreateTripFormWrapper';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

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
        <h1 className="text-3xl font-bold mb-8 text-center font-headline">Confirm Your Trip Details</h1>
        <Suspense fallback={<CreateTripFormSkeleton />}>
          <CreateTripFormWrapper itineraryId={selectedItineraryId} />
        </Suspense>
      </div>
    );
  }

  const itineraries = await getItineraries();

  const filteredItineraries = initialItineraryType 
    ? itineraries.filter(itn => itn.type === initialItineraryType)
    : itineraries;
  
  const title = initialItineraryType 
    ? `Select a ${initialItineraryType.replace('_', ' ')} Itinerary`
    : "Choose Your Adventure: Select an Itinerary";

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-10 text-center font-headline">{title}</h1>
      <ItinerarySelectionStep itineraries={filteredItineraries.length > 0 ? filteredItineraries : itineraries} />
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
