import { getItineraryById } from '@/actions/itineraryActions';
import { getDistrictSurcharges, getAdditionalServices } from '@/actions/configActions';
import { getTerms } from '@/actions/configActions';
import CreateTripForm from './CreateTripForm';
import { Suspense } from 'react';

export default async function CreateTripFormWrapper({ itineraryId }: { itineraryId: string }) {
  // Fetch all data in parallel
  const [itinerary, districts, allServices, terms] = await Promise.all([
    getItineraryById(itineraryId),
    getDistrictSurcharges(),
    getAdditionalServices(),
    getTerms()
  ]);

  if (!itinerary) {
    return <p className="text-center text-destructive text-lg py-10">行程未找到。请选择一个有效的行程。</p>;
  }

  // Filter services applicable to the selected itinerary type
  const applicableServices = allServices.filter(service => 
    service.applicableTo.includes(itinerary.type)
  );

  return (
    <CreateTripForm
      itinerary={itinerary}
      districts={districts}
      additionalServices={applicableServices}
      terms={terms}
    />
  );
}
