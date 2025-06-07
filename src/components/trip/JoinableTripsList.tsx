'use client';

import type { Trip } from '@/lib/types';
import JoinableTripCard from './JoinableTripCard';
import { useState } from 'react';
import { Input } from '../ui/input';
import { Search } from 'lucide-react';

interface JoinableTripsListProps {
  initialTrips: Trip[];
}

export default function JoinableTripsList({ initialTrips }: JoinableTripsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredTrips = initialTrips.filter(trip => 
    trip.itineraryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.date.includes(searchTerm) ||
    (trip.pickupAddress && trip.pickupAddress.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (trip.dropoffAddress && trip.dropoffAddress.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (initialTrips.length === 0) {
    return <p className="text-center text-muted-foreground text-lg mt-10">There are currently no trips available to join. Check back soon!</p>;
  }

  return (
    <div className="space-y-8">
      <div className="relative max-w-lg mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          type="text"
          placeholder="Search trips by name, date, or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 text-base"
        />
      </div>

      {filteredTrips.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map(trip => (
            <JoinableTripCard key={trip.id} trip={trip} />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground text-lg mt-10">No trips match your search criteria.</p>
      )}
    </div>
  );
}
