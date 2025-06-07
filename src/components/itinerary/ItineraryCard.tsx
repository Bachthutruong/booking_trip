import type { Itinerary } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { CalendarDays, Clock, Users, Tag, PlaneLanding, PlaneTakeoff, Waypoints, Info } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ITINERARY_TYPES } from '@/lib/constants';

interface ItineraryCardProps {
  itinerary: Itinerary;
  onSelect?: (itineraryId: string) => void; // For selection in create trip flow
  showSelectButton?: boolean;
  className?: string;
}

const ItineraryIcon = ({ type }: { type: Itinerary['type'] }) => {
  switch (type) {
    case 'airport_pickup':
      return <PlaneLanding className="h-5 w-5 text-primary" />;
    case 'airport_dropoff':
      return <PlaneTakeoff className="h-5 w-5 text-primary" />;
    case 'tourism':
      return <Waypoints className="h-5 w-5 text-primary" />;
    default:
      return <Info className="h-5 w-5 text-primary" />;
  }
};

export default function ItineraryCard({ itinerary, onSelect, showSelectButton = false, className }: ItineraryCardProps) {
  return (
    <Card className={`flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl ${className}`}>
      {itinerary.imageUrl && (
        <div className="relative w-full h-48">
          <Image
            src={itinerary.imageUrl}
            alt={itinerary.name}
            layout="fill"
            objectFit="cover"
            data-ai-hint={`${itinerary.type} travel`}
          />
        </div>
      )}
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="font-headline text-xl">{itinerary.name}</CardTitle>
          <Badge variant="secondary" className="flex items-center gap-1.5">
            <ItineraryIcon type={itinerary.type} />
            {ITINERARY_TYPES[itinerary.type]}
          </Badge>
        </div>
        <CardDescription className="text-sm text-muted-foreground line-clamp-3 min-h-[60px]">
          {itinerary.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        <div className="flex items-center text-sm text-foreground">
          <Tag className="h-4 w-4 mr-2 text-primary" />
          Price: <span className="font-semibold ml-1">{itinerary.pricePerPerson.toLocaleString()} VND</span> / person
        </div>
         {itinerary.availableTimes && itinerary.availableTimes.length > 0 && (
          <div className="flex items-center text-sm text-foreground">
            <Clock className="h-4 w-4 mr-2 text-primary" />
            Available Times: {itinerary.availableTimes.slice(0,3).join(', ')}{itinerary.availableTimes.length > 3 ? '...' : ''}
          </div>
        )}
      </CardContent>
      <CardFooter>
        {showSelectButton && onSelect ? (
          <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => onSelect(itinerary.id)}>
            Select This Itinerary
          </Button>
        ) : (
           <Button className="w-full" asChild>
            <Link href={`/create-trip?itineraryId=${itinerary.id}`}>
              Book Now
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
