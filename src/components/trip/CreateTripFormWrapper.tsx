import { getItineraryById } from '@/actions/itineraryActions';
import { getDistrictSurcharges, getAdditionalServices, getAvailableTimes } from '@/actions/configActions';
import CreateTripForm from './CreateTripForm'; // This will be the client component

export default async function CreateTripFormWrapper({ itineraryId }: { itineraryId: string }) {
  const itinerary = await getItineraryById(itineraryId);
  const districts = await getDistrictSurcharges();
  const services = await getAdditionalServices();
  // const availableTimes = await getAvailableTimes(); // Itinerary specific times are now part of itinerary object

  if (!itinerary) {
    return <p className="text-center text-destructive text-lg">Itinerary not found. Please select a valid itinerary.</p>;
  }

  const applicableServices = services.filter(service => 
    service.applicableTo.includes(itinerary.type)
  );

  return (
    <CreateTripForm
      itinerary={itinerary}
      districts={districts}
      additionalServices={applicableServices}
      availableTimes={itinerary.availableTimes || []} // Use itinerary specific times
    />
  );
}
