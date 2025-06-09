'use client';

import type { Trip } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, Users, MapPin, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import JoinTripForm from './JoinTripForm'; // This will be the dialog/form component
import { ITINERARY_TYPES } from '@/lib/constants';
import Image from 'next/image'; // Assuming itineraries might have images
import { getDistrictSurcharges, getAdditionalServices } from '@/actions/configActions'; // Import the action
import type { DistrictSurcharge, AdditionalService } from '@/lib/types'; // Import DistrictSurcharge type

export default function JoinableTripCard({ trip }: { trip: Trip }) {
  const [isJoinFormOpen, setIsJoinFormOpen] = useState(false);
  const [districts, setDistricts] = useState<DistrictSurcharge[]>([]); // State to store districts
  const [additionalServices, setAdditionalServices] = useState<AdditionalService[]>([]); // State to store additional services

  // Fetch districts and additional services when the component mounts or when the form is opened
  useEffect(() => {
    if (isJoinFormOpen) {
      const fetchData = async () => {
        const fetchedDistricts = await getDistrictSurcharges();
        setDistricts(fetchedDistricts);
        const fetchedServices = await getAdditionalServices();
        setAdditionalServices(fetchedServices);
      };
      fetchData();
    }
  }, [isJoinFormOpen]);

  const formattedDate = new Date(trip.date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  // Calculate total participants already in the trip (main booker + all participants)
  const totalCurrentParticipants = trip.participants.reduce((sum, p) => sum + (p.numberOfPeople || 0), 0);

  return (
    <>
      <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl">
        {/* You might want to fetch itinerary image based on trip.itineraryId if available */}
        <div className="relative w-full h-40 bg-secondary/50">
          <Image
            src={`https://placehold.co/600x400.png?text=${encodeURIComponent(trip.itineraryName.substring(0, 20))}`}
            alt={trip.itineraryName}
            layout="fill"
            objectFit="cover"
            data-ai-hint={`${trip.itineraryType} travel`}
          />
        </div>
        <CardHeader>
          <CardTitle className="font-headline text-lg">{trip.itineraryName}</CardTitle>
          <CardDescription className="text-xs">{ITINERARY_TYPES[trip.itineraryType]}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-2 text-sm">
          <p className="flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-primary" /> {formattedDate}</p>
          <p className="flex items-center"><Clock className="h-4 w-4 mr-2 text-primary" /> {trip.time}</p>
          <p className="flex items-center"><Users className="h-4 w-4 mr-2 text-primary" /> Currently {totalCurrentParticipants} person(s) joined</p>
          {trip.pickupAddress && <p className="flex items-start"><MapPin className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" /> <strong>Pickup:</strong>&nbsp;{trip.pickupAddress}</p>}
          {trip.dropoffAddress && <p className="flex items-start"><MapPin className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" /> <strong>Dropoff:</strong>&nbsp;{trip.dropoffAddress}</p>}
        </CardContent>
        <CardFooter>
          <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setIsJoinFormOpen(true)}>
            Join This Trip
          </Button>
        </CardFooter>
      </Card>

      {isJoinFormOpen && (
        <JoinTripForm
          trip={trip}
          isOpen={isJoinFormOpen}
          onOpenChange={setIsJoinFormOpen}
          districts={districts}
          additionalServices={additionalServices}
        />
      )}
    </>
  );
}
