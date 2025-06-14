'use client';

import type { Trip } from '@/lib/types';
import type { DistrictSurcharge } from '@/lib/types';
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
  districts?: DistrictSurcharge[];
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
    return <Badge variant="default" className="bg-green-500 text-white text-xs px-2 py-1"><CheckCircle2 className="h-2.5 w-2.5 mr-1" /> 已支付 ({pricePaid.toLocaleString()} 元)</Badge>;
  } else if (status === 'pending_payment') {
    const hasProofUploaded = transferProofImageUrl && transferProofImageUrl.trim() !== '';
    return (
      <div className="flex items-center gap-1">
        <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:border-yellow-600 dark:bg-yellow-900/30 text-xs px-2 py-1">
          <Hourglass className="h-2.5 w-2.5 mr-1" /> 待付款 ({pricePaid.toLocaleString()} 元)
        </Badge>
        {hasProofUploaded ? (
          <Button onClick={() => setIsUploadDialogOpen(true)} variant="outline" className="text-green-600 border-green-500 bg-green-50 dark:text-green-400 dark:border-green-600 dark:bg-green-900/30 text-xs h-6 px-2 py-1">
            <CheckCircle2 className="h-3 w-3 mr-1" /> 已上传证明
          </Button>
        ) : (
          <Button onClick={() => setIsUploadDialogOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs h-6 px-2 py-1">
            <CreditCard className="mr-1 h-3 w-3" /> 上傳轉帳證明
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

// Helper to mask name (e.g. 翟***)
function maskName(name: string) {
  if (!name) return '';
  if (name.length <= 1) return name + '***';
  return name[0] + '***';
}

// Helper to mask phone (e.g. 09*****16)
function maskPhone(phone: string) {
  if (!phone) return '';
  if (phone.length <= 4) return '****';
  return phone.slice(0, 2) + '*****' + phone.slice(-2);
}

export default function TripListItem({ trip, highlight = false, onActionStart, onActionComplete, currentUsersPhone, districts }: TripListItemProps) {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const overallStatus = getOverallTripStatus(trip); // Calculate overall status

  const formattedDate = format(new Date(trip.date), 'EEE, MMM dd, yyyy');
  console.log(trip, 'trip');

  // Find the current user's participant entry based on the phone number from searchParams
  const currentUserParticipant = trip.participants.find(p => p.phone === currentUsersPhone);
  const isCurrentUserMainContact = currentUsersPhone === trip.contactPhone;

  // Helper to mask sensitive info for main booker
  function maskIfNotMainContact(value: string | number | undefined) {
    if (isCurrentUserMainContact) return value;
    if (typeof value === 'number') return '***';
    if (!value) return '';
    return '***';
  }

  // Helper to mask array (for services)
  function maskServicesIfNotMainContact(services: any[] | undefined) {
    if (isCurrentUserMainContact) return services?.map(s => s.name).join(', ');
    if (services && services.length > 0) return '***';
    return '';
  }

  // Helper to mask notes
  function maskNotesIfNotMainContact(notes: string | undefined) {
    if (isCurrentUserMainContact) return notes;
    if (notes && notes.length > 0) return '***';
    return '';
  }

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
          <p className="flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-primary flex-shrink-0" /> <strong>日期:</strong>&nbsp;{formattedDate}</p>
          <p className="flex items-center"><Clock className="h-4 w-4 mr-2 text-primary flex-shrink-0" /> <strong>時間:</strong>&nbsp;{trip.time}</p>
          <p className="flex items-center"><Users className="h-4 w-4 mr-2 text-primary flex-shrink-0" /> <strong>總人數:</strong>&nbsp;{trip.participants.reduce((sum, p) => sum + (p.numberOfPeople || 0), 0)}</p>
          {/* <p className="flex items-center"><CreditCard className="h-4 w-4 mr-2 text-primary flex-shrink-0" /> <strong>总价:</strong>&nbsp;{maskIfNotMainContact(currentUserParticipant ? currentUserParticipant.pricePaid.toLocaleString() : 0)} 元</p> */}
        </div>
        {/* Only show main contact if current user is main contact */}
        {/* {isCurrentUserMainContact && (
          <p className="flex items-center"><PhoneCall className="h-4 w-4 mr-2 text-primary flex-shrink-0" /> <strong>主联系人:</strong>&nbsp;{trip.contactName} ({trip.contactPhone})</p>
        )} */}
        {/* {trip.pickupAddress && <p className="flex items-start"><MapPin className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" /> <strong>接机地址:</strong>&nbsp;{maskIfNotMainContact(trip.pickupAddress)}</p>} */}
        {/* {trip.dropoffAddress && <p className="flex items-start"><MapPin className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" /> <strong>送机地址:</strong>&nbsp;{maskIfNotMainContact(trip.dropoffAddress)}</p>} */}
        {/* {trip.district && <p className="text-xs text-muted-foreground"><strong>区域:</strong> {maskIfNotMainContact(trip.district)}</p>} */}
        {/* {trip.additionalServices && trip.additionalServices.length > 0 && (
          <p className="text-xs text-muted-foreground"><strong>额外服务:</strong> {maskServicesIfNotMainContact(trip.additionalServices)}</p>
        )} */}
        {trip.notes && <p className="text-xs text-muted-foreground italic flex items-start"><MessageSquare className="h-3 w-3 mr-1.5 mt-0.5 text-primary flex-shrink-0" /> {maskNotesIfNotMainContact(trip.notes)}</p>}

        {trip.participants.length > 0 && (
          <div className="pt-2 mt-2 border-t">
            <h4 className="text-xs font-semibold text-muted-foreground mb-1">行程參與者:</h4>
            <ul className="list-disc list-inside pl-1 space-y-0.5 text-xs">
              {trip.participants.map(p => {
                const isCurrentUser = currentUsersPhone && p.phone === currentUsersPhone;
                const displayName = isCurrentUser ? p.name : maskName(p.name);
                const displayPhone = isCurrentUser ? p.phone : maskPhone(p.phone);
                const districtName = isCurrentUser ? (p.district || trip.district || '') : '*****';
                const address = isCurrentUser ? (p.address || '-') : '*****';
                const additionalServices = isCurrentUser
                  ? (p.additionalServices || []).map((s: any) => `${s.name} (+${typeof s.price === 'number' ? s.price.toLocaleString() : 0} 元)`).join(', ')
                  : '*****';
                let districtSurcharge = 0;
                if (isCurrentUser && districts && (p.district || trip.district)) {
                  const found = districts.find(d => d.districtName === (p.district || trip.district));
                  if (found) districtSurcharge = found.surchargeAmount;
                }
                return (
                  <li key={p.id} className="flex flex-col gap-0.5 border-b last:border-b-0 pb-2 mb-2 last:pb-0 last:mb-0">
                    <div className="flex flex-wrap items-center justify-between gap-x-2">
                      <span>{displayName} ({p.numberOfPeople} 位, 電話: {displayPhone})</span>
                      {isCurrentUser && (
                        <ParticipantStatusBadge
                          status={p.status}
                          pricePaid={p.pricePaid}
                          transferProofImageUrl={p.transferProofImageUrl}
                          participantId={p.id}
                          tripId={trip.id}
                          onActionStart={onActionStart}
                          onActionComplete={onActionComplete}
                        />
                      )}
                    </div>
                    {/* Price breakdown for each participant */}
                    <ul className="ml-2 mt-1 text-xs text-muted-foreground space-y-0.5">
                      <li>行程價格: {isCurrentUser ? p.pricePaid.toLocaleString() + ' 元' : '*****'}</li>
                      <li>區域: {districtName}{isCurrentUser && districtSurcharge > 0 ? ` (+${districtSurcharge.toLocaleString()} 元)` : ''}</li>
                      <li>地址: {address}</li>
                      <li>加購服務: {additionalServices}</li>
                    </ul>
                    {/* Participant note */}
                    {p.notes && (
                      <p className="text-xs text-muted-foreground italic flex items-start mt-1">
                        <MessageSquare className="h-3 w-3 mr-1.5 mt-0.5 text-primary flex-shrink-0" />
                        {isCurrentUser ? p.notes : '***'}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-4 border-t">
        {overallStatus === 'payment_confirmed' && new Date(trip.date) >= new Date(new Date().setHours(0, 0, 0, 0)) && (
          <p className="text-sm text-green-600 font-medium">您的行程已确认！</p>
        )}
        {overallStatus === 'completed' && (
          <p className="text-sm text-blue-600 font-medium">本次行程已完成。</p>
        )}
        {overallStatus === 'cancelled' && (
          <p className="text-sm text-destructive font-medium">本次行程已取消。</p>
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
