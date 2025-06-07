'use client';

import type { Trip } from '@/lib/types';
import JoinableTripCard from './JoinableTripCard';
import { useState, useEffect, useTransition } from 'react';
import { Input } from '../ui/input';
import { Loader2, Search, WifiOff } from 'lucide-react';
import { getAllAvailableTrips } from '@/actions/tripActions';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';

// No longer needs initialTrips prop if fetching client-side
// interface JoinableTripsListProps {
//   initialTrips: Trip[];
// }

export default function JoinableTripsList() {
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const fetchTrips = () => {
    setError(null);
    startTransition(async () => {
      try {
        const trips = await getAllAvailableTrips();
        // Convert trips to plain JavaScript objects to avoid passing non-plain objects to client components
        setAllTrips(trips);
        setFilteredTrips(trips); // Initialize filtered trips
      } catch (err) {
        console.error("Failed to fetch joinable trips:", err);
        setError("Could not load trips. Please check your connection and try again.");
        setAllTrips([]);
        setFilteredTrips([]);
      }
    });
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  useEffect(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const results = allTrips.filter(trip =>
      trip.itineraryName.toLowerCase().includes(lowerSearchTerm) ||
      trip.date.includes(searchTerm) || // Keep for simple date string search
      (trip.pickupAddress && trip.pickupAddress.toLowerCase().includes(lowerSearchTerm)) ||
      (trip.dropoffAddress && trip.dropoffAddress.toLowerCase().includes(lowerSearchTerm)) ||
      (trip.contactName && trip.contactName.toLowerCase().includes(lowerSearchTerm))
    );
    setFilteredTrips(results);
  }, [searchTerm, allTrips]);

  if (isLoading && allTrips.length === 0) { // Show skeleton only on initial load
    return (
      <div className="space-y-8">
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input type="text" placeholder="Loading trips..." disabled className="pl-10 text-base" value={searchTerm} />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-lg mx-auto">
        <WifiOff className="h-5 w-5" />
        <AlertTitle>Loading Error</AlertTitle>
        <AlertDescription>
          {error}
          <Button onClick={fetchTrips} variant="link" className="p-0 h-auto ml-1 text-destructive hover:underline">
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }


  if (!isLoading && allTrips.length === 0 && !error) {
    return (
      <Alert className="max-w-lg mx-auto">
        <Search className="h-5 w-5" />
        <AlertTitle>No Trips Available</AlertTitle>
        <AlertDescription>
          There are currently no confirmed trips available to join. Please check back later or create your own trip!
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <div className="relative max-w-lg mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search trips by name, date, location, or creator..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 text-base shadow-sm"
          disabled={isLoading}
        />
      </div>

      {isLoading && <div className="text-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}

      {filteredTrips.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
          {filteredTrips.map(trip => (
            <JoinableTripCard key={trip.id} trip={trip} />
          ))}
        </div>
      ) : (
        !isLoading && searchTerm && <p className="text-center text-muted-foreground text-lg mt-10">No trips match your search criteria "{searchTerm}".</p>
      )}
    </div>
  );
}


function SkeletonCard() { // Renamed from CardSkeleton to avoid conflict if used elsewhere
  return (
    <div className="border bg-card text-card-foreground shadow-sm rounded-xl p-0 overflow-hidden animate-pulse">
      <div className="h-40 w-full bg-muted" /> {/* Image Placeholder */}
      <div className="p-6 space-y-3">
        <div className="h-6 w-3/4 bg-muted rounded" /> {/* Title */}
        <div className="h-4 w-1/2 bg-muted rounded" /> {/* Sub-title / Date */}
        <div className="h-4 w-full bg-muted rounded" /> {/* Description line 1 */}
        <div className="h-4 w-5/6 bg-muted rounded" /> {/* Description line 2 */}
      </div>
      <div className="p-6 pt-0">
        <div className="h-10 w-full bg-muted rounded" /> {/* Button */}
      </div>
    </div>
  );
}
