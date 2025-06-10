
import { getItineraryById } from '@/actions/itineraryActions';
import { getDistrictSurcharges, getAdditionalServices } from '@/actions/configActions';
import CreateTripForm from './CreateTripForm'; // This will be the client component

export default async function CreateTripFormWrapper({ itineraryId }: { itineraryId: string }) {
  const itinerary = await getItineraryById(itineraryId);
  
  // These are now fetched from MongoDB via configActions
  const districts = await getDistrictSurcharges();
  const allServices = await getAdditionalServices();

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
      // availableTimes is part of the itinerary object
    />
  );
}
