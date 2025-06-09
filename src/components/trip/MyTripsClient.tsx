'use client';

import { useState, useEffect, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getUserTrips } from '@/actions/tripActions';
import type { Trip } from '@/lib/types';
import TripListItem from './TripListItem';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { getDistrictSurcharges } from '@/actions/configActions';
import type { DistrictSurcharge } from '@/lib/types';

interface MyTripsClientProps {
  tripIdFromParam?: string;
  phoneFromParam?: string;
}

export default function MyTripsClient({ tripIdFromParam, phoneFromParam }: MyTripsClientProps) {
  const [phone, setPhone] = useState(phoneFromParam || '');
  const [name, setName] = useState('');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(false); // For initial load or explicit search
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, startTransition] = useTransition(); // For actions within list items like proof upload revalidation
  const { toast } = useToast();
  const [districts, setDistricts] = useState<DistrictSurcharge[]>([]);

  // Fetch districts once on mount
  useEffect(() => {
    getDistrictSurcharges().then(setDistricts);
  }, []);

  const handleFetchTrips = () => {
    if (!phone.trim() || !name.trim()) {
      setError('Please enter both your phone number and name.');
      setTrips([]); // Clear previous results if any
      return;
    }
    setError(null);
    setIsLoading(true); // Explicit search loading state
    startTransition(async () => {
      try {
        const fetchedTrips = await getUserTrips(phone, name);
        setTrips(fetchedTrips);
        if (fetchedTrips.length === 0) {
          toast({ title: "No Trips Found", description: "We couldn't find any trips associated with this phone number and name." });
        }
      } catch (err) {
        console.error("Error fetching trips:", err);
        setError('Failed to fetch trips. Please try again.');
        toast({ title: "Error", description: "Could not fetch trips.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    });
  };

  useEffect(() => {
    if (phoneFromParam && phoneFromParam.trim() !== '') {
      setPhone(phoneFromParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneFromParam]);


  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Find Your Bookings</CardTitle>
          <CardDescription>Enter the phone number used during booking to see your trip details.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-grow">
              <label htmlFor="phoneInput" className="block text-sm font-medium text-foreground mb-1">
                Your Phone Number
              </label>
              <Input
                id="phoneInput"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g., 0912345678"
                className="text-base"
                disabled={isLoading || isTransitioning}
              />
              <label htmlFor="nameInput" className="block text-sm font-medium text-foreground mt-4 mb-1">
                Your Name
              </label>
              <Input
                id="nameInput"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., John Doe"
                className="text-base"
                disabled={isLoading || isTransitioning}
              />
            </div>
            <Button onClick={handleFetchTrips} disabled={isLoading || isTransitioning || !phone.trim() || !name.trim()} className="h-10 w-full sm:w-auto">
              {(isLoading || isTransitioning) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Search Trips
            </Button>
          </div>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>


      {isLoading && (
        <div className="text-center py-10">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Fetching your trips...</p>
        </div>
      )}

      {!isLoading && trips.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold font-headline">Your Booked Trips</h2>
          {trips.map(trip => (
            <TripListItem
              key={trip.id}
              trip={trip}
              highlight={trip.id === tripIdFromParam}
              onActionStart={() => startTransition(() => { })}
              onActionComplete={() => handleFetchTrips()}
              currentUsersPhone={phone}
              districts={districts}
            />
          ))}
        </div>
      )}
    </div>
  );
}
