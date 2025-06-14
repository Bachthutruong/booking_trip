'use client';

import type { Trip } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, Users, MapPin, CheckCircle2, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import JoinTripForm from './JoinTripForm'; // This will be the dialog/form component
import { ITINERARY_TYPES } from '@/lib/constants';
import Image from 'next/image'; // Assuming itineraries might have images
import { getDistrictSurcharges, getAdditionalServices } from '@/actions/configActions'; // Import the action
import type { DistrictSurcharge, AdditionalService } from '@/lib/types'; // Import DistrictSurcharge type

type TripSummary = Trip & { participantsCount?: number };

export default function JoinableTripCard({ trip }: { trip: TripSummary }) {
  const [isJoinFormOpen, setIsJoinFormOpen] = useState(false);
  const [districts, setDistricts] = useState<DistrictSurcharge[]>([]);
  const [additionalServices, setAdditionalServices] = useState<AdditionalService[]>([]);
  const [tripDetail, setTripDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [fetchedDistricts, fetchedServices] = await Promise.all([
        getDistrictSurcharges(),
        getAdditionalServices()
      ]);
      setDistricts(fetchedDistricts);
      setAdditionalServices(fetchedServices);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formattedDate = new Date(trip.date).toLocaleDateString('zh-TW', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  // Calculate total participants already in the trip (main booker + all participants)
  const totalCurrentParticipants = typeof trip.participantsCount === 'number' ? trip.participantsCount : 0;

  const handleJoinClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/joinable-trips/${trip.id}`);
      const data = await res.json();
      setTripDetail(data.trip);
      setIsJoinFormOpen(true);
    } catch (err) {
      alert('加载行程详情失败');
    } finally {
      setLoadingDetail(false);
    }
  }, [trip.id]);

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
          {/* <p className="flex items-center"><Users className="h-4 w-4 mr-2 text-primary" /> 目前 {totalCurrentParticipants} 人加入</p> */}
          {/* {trip.pickupAddress && <p className="flex items-start"><MapPin className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" /> <strong>Pickup:</strong>&nbsp;{trip.pickupAddress}</p>} */}
          {/* {trip.dropoffAddress && <p className="flex items-start"><MapPin className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" /> <strong>Dropoff:</strong>&nbsp;{trip.dropoffAddress}</p>} */}
        </CardContent>
        <CardFooter>
          <Button
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={handleJoinClick}
            type="button"
            disabled={loadingDetail}
          >
            {loadingDetail ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            加入此行程
          </Button>
        </CardFooter>
      </Card>

      {isJoinFormOpen && tripDetail && (
        <JoinTripForm
          trip={tripDetail}
          isOpen={isJoinFormOpen}
          onOpenChange={setIsJoinFormOpen}
          districts={districts}
          additionalServices={additionalServices}
        />
      )}
    </>
  );
}
