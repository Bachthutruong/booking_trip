'use client';

import type { Itinerary } from '@/lib/types';
import ItineraryCard from '@/components/itinerary/ItineraryCard';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '../ui/button';
import { ArrowLeft } from 'lucide-react';

interface ItinerarySelectionStepProps {
  itineraries: Itinerary[];
}

export default function ItinerarySelectionStep({ itineraries }: ItinerarySelectionStepProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTypeFilter = searchParams.get('type');

  const handleSelectItinerary = (itineraryId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('itineraryId', itineraryId);
    router.push(`/create-trip?${params.toString()}`);
  };

  return (
    <div>
      {currentTypeFilter && (
        <Button variant="outline" onClick={() => router.push('/create-trip')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Itinerary Types
        </Button>
      )}
      {itineraries.length === 0 ? (
        <p className="text-center text-muted-foreground text-lg">No itineraries available at the moment. Please check back later.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {itineraries.map((itinerary) => (
            <ItineraryCard 
              key={itinerary.id} 
              itinerary={itinerary} 
              onSelect={handleSelectItinerary}
              showSelectButton 
              className="animate-fadeIn"
              style={{ animationDelay: `${itineraries.indexOf(itinerary) * 100}ms` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
