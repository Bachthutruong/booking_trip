'use client';

import type { Trip } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, Users, MapPin, CreditCard, AlertTriangle, CheckCircle2, Hourglass, Ban, PlaneLanding, PlaneTakeoff, Waypoints } from 'lucide-react';
import UploadProofDialog from './UploadProofDialog';
import { useState } from 'react';
import { ITINERARY_TYPES, TRIP_STATUSES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface TripListItemProps {
  trip: Trip;
  highlight?: boolean;
}

const StatusBadge = ({ status }: { status: Trip['status'] }) => {
  let icon;
  let variant: "default" | "secondary" | "destructive" | "outline" = "default";
  let className = "";

  switch (status) {
    case 'pending_payment':
      icon = <Hourglass className="h-4 w-4 mr-1.5" />;
      variant = "outline";
      className = "border-yellow-500 text-yellow-700 bg-yellow-50";
      break;
    case 'payment_confirmed':
      icon = <CheckCircle2 className="h-4 w-4 mr-1.5" />;
      variant = "default";
      className = "bg-green-500 text-white";
      break;
    case 'completed':
      icon = <CheckCircle2 className="h-4 w-4 mr-1.5" />;
      variant = "secondary";
      className = "bg-blue-500 text-white";
      break;
    case 'cancelled':
      icon = <Ban className="h-4 w-4 mr-1.5" />;
      variant = "destructive";
      break;
    default:
      icon = <AlertTriangle className="h-4 w-4 mr-1.5" />;
  }
  return <Badge variant={variant} className={cn("capitalize", className)}>{icon}{TRIP_STATUSES[status]}</Badge>;
};

const ItineraryTypeIcon = ({ type }: { type: Trip['itineraryType'] }) => {
  switch (type) {
    case 'airport_pickup':
      return <PlaneLanding className="h-4 w-4 text-primary" />;
    case 'airport_dropoff':
      return <PlaneTakeoff className="h-4 w-4 text-primary" />;
    case 'tourism':
      return <Waypoints className="h-4 w-4 text-primary" />;
    default:
      return <MapPin className="h-4 w-4 text-primary" />;
  }
}

export default function TripListItem({ trip, highlight = false }: TripListItemProps) {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  const formattedDate = new Date(trip.date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <Card className={cn("transition-all duration-300", highlight ? "ring-2 ring-accent shadow-2xl transform scale-[1.01]" : "hover:shadow-lg")}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <CardTitle className="font-headline text-xl md:text-2xl">{trip.itineraryName}</CardTitle>
          <StatusBadge status={trip.status} />
        </div>
        <CardDescription className="flex items-center gap-1.5 text-sm">
          <ItineraryTypeIcon type={trip.itineraryType} /> {ITINERARY_TYPES[trip.itineraryType]}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <p className="flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-primary" /> <strong>Date:</strong>&nbsp;{formattedDate}</p>
          <p className="flex items-center"><Clock className="h-4 w-4 mr-2 text-primary" /> <strong>Time:</strong>&nbsp;{trip.time}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <p className="flex items-center"><Users className="h-4 w-4 mr-2 text-primary" /> <strong>People:</strong>&nbsp;{trip.numberOfPeople}</p>
          <p className="flex items-center"><CreditCard className="h-4 w-4 mr-2 text-primary" /> <strong>Total:</strong>&nbsp;{trip.totalPrice.toLocaleString()} VND</p>
        </div>
        {trip.pickupAddress && <p className="flex items-start"><MapPin className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" /> <strong>Pickup:</strong>&nbsp;{trip.pickupAddress}</p>}
        {trip.dropoffAddress && <p className="flex items-start"><MapPin className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" /> <strong>Dropoff:</strong>&nbsp;{trip.dropoffAddress}</p>}
         {trip.notes && <p className="text-xs text-muted-foreground italic"><strong>Note:</strong> {trip.notes}</p>}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-end gap-3">
        {trip.status === 'pending_payment' && (
          <>
            {trip.transferProofImageUrl ? (
              <Badge variant="outline" className="text-green-600 border-green-500">Proof Uploaded - Awaiting Confirmation</Badge>
            ) : (
              <Button onClick={() => setIsUploadDialogOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
                <CreditCard className="mr-2 h-4 w-4" /> Upload Payment Proof
              </Button>
            )}
          </>
        )}
        {/* Add more actions here if needed, e.g., Cancel Trip, View Details */}
      </CardFooter>
      {isUploadDialogOpen && (
        <UploadProofDialog
          tripId={trip.id}
          isOpen={isUploadDialogOpen}
          onOpenChange={setIsUploadDialogOpen}
        />
      )}
    </Card>
  );
}
