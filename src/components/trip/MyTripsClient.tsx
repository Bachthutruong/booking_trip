'use client';

import { useState, useEffect, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getUserTrips } from '@/actions/tripActions';
import type { Trip } from '@/lib/types';
import TripListItem from './TripListItem';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface MyTripsClientProps {
  tripIdFromParam?: string;
  phoneFromParam?: string;
}

export default function MyTripsClient({ tripIdFromParam, phoneFromParam }: MyTripsClientProps) {
  const [phone, setPhone] = useState(phoneFromParam || '');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleFetchTrips = () => {
    if (!phone) {
      setError('Please enter your phone number.');
      return;
    }
    setError(null);
    setIsLoading(true);
    startTransition(async () => {
      try {
        const fetchedTrips = await getUserTrips(phone);
        setTrips(fetchedTrips);
        if (fetchedTrips.length === 0) {
          toast({ title: "No Trips Found", description: "We couldn't find any trips associated with this phone number." });
        }
      } catch (err) {
        setError('Failed to fetch trips. Please try again.');
        toast({ title: "Error", description: "Could not fetch trips.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    });
  };
  
  useEffect(() => {
    if (phoneFromParam) {
      handleFetchTrips();
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
          <div className="flex gap-4 items-end">
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
                disabled={isLoading || isPending}
              />
            </div>
            <Button onClick={handleFetchTrips} disabled={isLoading || isPending || !phone} className="h-10">
              {(isLoading || isPending) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Search Trips
            </Button>
          </div>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
      

      {trips.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold font-headline">Your Booked Trips</h2>
          {trips.map(trip => (
            <TripListItem key={trip.id} trip={trip} highlight={trip.id === tripIdFromParam} />
          ))}
        </div>
      )}
      {/* Consider showing a message if search was performed but no trips found and not loading */}
      {!isLoading && !isPending && trips.length === 0 && phone && (
        <p className="text-center text-muted-foreground mt-6">
          No trips found for this phone number. Try a different number or create a new trip.
        </p>
      )}
    </div>
  );
}
