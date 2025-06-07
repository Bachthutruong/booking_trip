'use client';

import type { Trip } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, Users, MapPin, CreditCard, AlertTriangle, CheckCircle2, Hourglass, Ban, PlaneLanding, PlaneTakeoff, Waypoints, MessageSquare, PhoneCall } from 'lucide-react';
import UploadProofDialog from './UploadProofDialog';
import { useState } from 'react';
import { ITINERARY_TYPES, TRIP_STATUSES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TripListItemProps {
  trip: Trip;
  highlight?: boolean;
  onActionStart?: () => void;
  onActionComplete?: () => void;
  currentUsersPhone?: string;
}

const StatusBadge = ({ status, small = false }: { status: Trip['status']; small?: boolean }) => {
  let icon;
  let variant: "default" | "secondary" | "destructive" | "outline" = "default";
  let className = "";

  switch (status) {
    case 'pending_payment':
      icon = <Hourglass className={cn("mr-1.5", small ? "h-2.5 w-2.5" : "h-3 w-3")} />;
      variant = "outline";
      className = "border-yellow-500 text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:border-yellow-600 dark:bg-yellow-900/30";
      break;
    case 'payment_confirmed':
      icon = <CheckCircle2 className={cn("mr-1.5", small ? "h-2.5 w-2.5" : "h-3 w-3")} />;
      variant = "default";
      className = "bg-green-500 text-white hover:bg-green-600";
      break;
    case 'completed':
      icon = <CheckCircle2 className={cn("mr-1.5", small ? "h-2.5 w-2.5" : "h-3 w-3")} />;
      variant = "secondary";
      className = "bg-blue-500 text-white hover:bg-blue-600";
      break;
    case 'cancelled':
      icon = <Ban className={cn("mr-1.5", small ? "h-2.5 w-2.5" : "h-3 w-3")} />;
      variant = "destructive";
      break;
    default:
      icon = <AlertTriangle className={cn("mr-1.5", small ? "h-2.5 w-2.5" : "h-3 w-3")} />;
  }
  return <Badge variant={variant} className={cn("capitalize px-2 py-1", small ? "text-xs" : "text-sm", className)}>{icon}{TRIP_STATUSES[status]}</Badge>;
};

const ParticipantStatusBadge = ({ status, pricePaid, transferProofImageUrl, participantId, tripId, onActionStart, onActionComplete }: { status: Trip['status']; pricePaid: number; transferProofImageUrl?: string; participantId: string; tripId: string; onActionStart?: () => void; onActionComplete?: () => void; }) => {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  if (status === 'payment_confirmed') {
    return <Badge variant="default" className="bg-green-500 text-white text-xs px-2 py-1"><CheckCircle2 className="h-2.5 w-2.5 mr-1" /> Paid ({pricePaid.toLocaleString()} VND)</Badge>;
  } else if (status === 'pending_payment') {
    const hasProofUploaded = transferProofImageUrl && transferProofImageUrl.trim() !== '';
    return (
      <div className="flex items-center gap-1">
        <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:border-yellow-600 dark:bg-yellow-900/30 text-xs px-2 py-1">
          <Hourglass className="h-2.5 w-2.5 mr-1" /> Pending ({pricePaid.toLocaleString()} VND)
        </Badge>
        {hasProofUploaded ? (
          <Button onClick={() => setIsUploadDialogOpen(true)} variant="outline" className="text-green-600 border-green-500 bg-green-50 dark:text-green-400 dark:border-green-600 dark:bg-green-900/30 text-xs h-6 px-2 py-1">
            <CheckCircle2 className="h-3 w-3 mr-1" />Proof Uploaded
          </Button>
        ) : (
          <Button onClick={() => setIsUploadDialogOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs h-6 px-2 py-1">
            <CreditCard className="mr-1 h-3 w-3" /> Upload Proof
          </Button>
        )}
        {isUploadDialogOpen && (
          <UploadProofDialog
            tripId={tripId}
            participantId={participantId}
            isOpen={isUploadDialogOpen}
            onOpenChange={setIsUploadDialogOpen}
            onUploadSuccess={() => {
              if (onActionComplete) onActionComplete();
            }}
            onUploadStart={onActionStart}
          />
        )}
      </div>
    );
  }
  return null;
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

const getOverallTripStatus = (trip: Trip): Trip['status'] => {
  if (trip.participants.length === 0) {
    return trip.status; // Fallback if for some reason no participants (shouldn't happen with creator always added)
  }

  const allConfirmed = trip.participants.every(p => p.status === 'payment_confirmed');
  const anyPending = trip.participants.some(p => p.status === 'pending_payment');
  const allCompleted = trip.participants.every(p => p.status === 'completed');
  const anyCancelled = trip.participants.some(p => p.status === 'cancelled');

  if (allConfirmed) {
    // Check if trip date is in the past to mark as completed
    const tripDate = new Date(trip.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    if (tripDate < today) {
      return 'completed';
    }
    return 'payment_confirmed';
  } else if (anyPending) {
    return 'pending_payment';
  } else if (allCompleted) {
    return 'completed';
  } else if (anyCancelled) {
    return 'cancelled'; // If any participant cancelled, the trip could be considered cancelled or require review
  }
  return trip.status; // Default to existing trip status if no clear derived status
};

export default function TripListItem({ trip, highlight = false, onActionStart, onActionComplete, currentUsersPhone }: TripListItemProps) {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const overallStatus = getOverallTripStatus(trip); // Calculate overall status

  const formattedDate = format(new Date(trip.date), 'EEE, MMM dd, yyyy');

  // Find the current user's participant entry based on the phone number from searchParams
  const currentUserParticipant = trip.participants.find(p => p.phone === currentUsersPhone);

  return (
    <Card className={cn("transition-all duration-300", highlight ? "ring-2 ring-accent shadow-2xl transform scale-[1.01]" : "hover:shadow-lg")}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
          <div className="flex-grow">
            <CardTitle className="font-headline text-xl md:text-2xl">{trip.itineraryName}</CardTitle>
            <CardDescription className="flex items-center gap-1.5 text-sm mt-1">
              <ItineraryTypeIcon type={trip.itineraryType} /> {ITINERARY_TYPES[trip.itineraryType]}
            </CardDescription>
          </div>
          <StatusBadge status={overallStatus} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
          <p className="flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-primary flex-shrink-0" /> <strong>Date:</strong>&nbsp;{formattedDate}</p>
          <p className="flex items-center"><Clock className="h-4 w-4 mr-2 text-primary flex-shrink-0" /> <strong>Time:</strong>&nbsp;{trip.time}</p>
          <p className="flex items-center"><Users className="h-4 w-4 mr-2 text-primary flex-shrink-0" /> <strong>Total Guests:</strong>&nbsp;{trip.participants.reduce((sum, p) => sum + p.numberOfPeople, 0)}</p>
          <p className="flex items-center"><CreditCard className="h-4 w-4 mr-2 text-primary flex-shrink-0" /> <strong>Total Price:</strong>&nbsp;{trip.totalPrice.toLocaleString()} VND</p>
        </div>
        <p className="flex items-center"><PhoneCall className="h-4 w-4 mr-2 text-primary flex-shrink-0" /> <strong>Main Contact:</strong>&nbsp;{trip.contactName} ({trip.contactPhone})</p>
        {trip.pickupAddress && <p className="flex items-start"><MapPin className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" /> <strong>Pickup:</strong>&nbsp;{trip.pickupAddress}</p>}
        {trip.dropoffAddress && <p className="flex items-start"><MapPin className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" /> <strong>Dropoff:</strong>&nbsp;{trip.dropoffAddress}</p>}
        {trip.district && <p className="text-xs text-muted-foreground"><strong>District:</strong> {trip.district}</p>}
        {trip.additionalServices && trip.additionalServices.length > 0 && (
          <p className="text-xs text-muted-foreground"><strong>Services:</strong> {trip.additionalServices.map(s => s.name).join(', ')}</p>
        )}
        {trip.notes && <p className="text-xs text-muted-foreground italic flex items-start"><MessageSquare className="h-3 w-3 mr-1.5 mt-0.5 text-primary flex-shrink-0" /> {trip.notes}</p>}

        {trip.participants.length > 0 && (
          <div className="pt-2 mt-2 border-t">
            <h4 className="text-xs font-semibold text-muted-foreground mb-1">Participants:</h4>
            <ul className="list-disc list-inside pl-1 space-y-0.5 text-xs">
              {trip.participants.map(p => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-x-2">
                  <span>{p.name} ({p.numberOfPeople} guest(s), Phone: {p.phone})</span>
                  <ParticipantStatusBadge
                    status={p.status}
                    pricePaid={p.pricePaid}
                    transferProofImageUrl={p.transferProofImageUrl}
                    participantId={p.id}
                    tripId={trip.id}
                    onActionStart={onActionStart}
                    onActionComplete={onActionComplete}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}

      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-4 border-t">
        {overallStatus === 'payment_confirmed' && new Date(trip.date) >= new Date(new Date().setHours(0, 0, 0, 0)) && (
          <p className="text-sm text-green-600 font-medium">Your trip is confirmed!</p>
        )}
        {overallStatus === 'completed' && (
          <p className="text-sm text-blue-600 font-medium">This trip has been completed.</p>
        )}
        {overallStatus === 'cancelled' && (
          <p className="text-sm text-destructive font-medium">This trip has been cancelled.</p>
        )}
      </CardFooter>
      {/* This dialog is now specifically for the current user (participant) if they are the one viewing/uploading for themselves. */}
      {isUploadDialogOpen && currentUserParticipant && (
        <UploadProofDialog
          tripId={trip.id}
          participantId={currentUserParticipant.id} // Pass current user's participant ID
          isOpen={isUploadDialogOpen}
          onOpenChange={setIsUploadDialogOpen}
          onUploadSuccess={() => {
            if (onActionComplete) onActionComplete();
          }}
          onUploadStart={onActionStart}
        />
      )}
    </Card>
  );
}
