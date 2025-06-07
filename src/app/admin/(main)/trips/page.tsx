import { getAllTrips, confirmMainBookerPayment, confirmParticipantPayment, submitConfirmMainBookerPaymentFromList, submitConfirmParticipantPaymentFromList } from '@/actions/tripActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Eye, CheckCircle, CircleDollarSign, Filter, Users, CalendarDays, ClockIcon } from 'lucide-react';
import { TRIP_STATUSES, ITINERARY_TYPES } from '@/lib/constants';
import { format } from 'date-fns';
import Image from 'next/image';
import { Participant, Trip, TripStatus } from '@/lib/types';
import { ConfirmPaymentButton } from '@/components/admin/ConfirmPaymentButton';

interface ConfirmPaymentButtonProps {
  tripId: string;
  participantId?: string; // Optional: if confirming a specific participant
  isMainBooker: boolean; // Flag to distinguish main booker from other participants
}

const getOverallTripStatus = (trip: Trip): TripStatus => {
  if (trip.participants.length === 0) {
    return trip.status; // Fallback if no participants (shouldn't happen with creator always added)
  }

  const allConfirmed = trip.participants.every(p => p.status === 'payment_confirmed');
  const anyPending = trip.participants.some(p => p.status === 'pending_payment');
  const allCompleted = trip.participants.every(p => p.status === 'completed');
  const anyCancelled = trip.participants.some(p => p.status === 'cancelled');

  if (allConfirmed) {
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
    return 'cancelled';
  }
  return trip.status; // Default to existing trip status if no clear derived status
};

export default async function AdminTripsPage({
  searchParams,
}: {
  searchParams?: { status?: string; search?: string };
}) {
  const statusFilter = searchParams?.status ?? '';
  const searchTerm = searchParams?.search?.toLowerCase() ?? '';

  let trips = await getAllTrips();

  // Convert trips to plain JavaScript objects to avoid passing non-plain objects to client components
  trips = JSON.parse(JSON.stringify(trips));

  trips = trips.map(trip => ({ ...trip, overallStatus: getOverallTripStatus(trip) }));

  if (statusFilter && TRIP_STATUSES[statusFilter as keyof typeof TRIP_STATUSES]) {
    trips = trips.filter(trip => trip.overallStatus === statusFilter);
  }

  if (searchTerm) {
    trips = trips.filter(trip =>
      trip.itineraryName.toLowerCase().includes(searchTerm) ||
      trip.contactName.toLowerCase().includes(searchTerm) ||
      trip.contactPhone.includes(searchTerm) ||
      trip.id.toLowerCase().includes(searchTerm) ||
      trip.participants.some(p => p.name.toLowerCase().includes(searchTerm) || p.phone.includes(searchTerm))
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold font-headline">Manage Trip Bookings ({trips.length})</h1>
        {/* Add Filter Component Here if needed */}
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Booking List</CardTitle>
          <CardDescription>View and manage all customer trip bookings.</CardDescription>
          {/* Basic Search Form */}
          <form method="GET" className="mt-4 flex gap-2">
            <input type="text" name="search" placeholder="Search name, phone, itinerary..." defaultValue={searchParams?.search ? String(searchParams.search) : ''} className="border p-2 rounded-md flex-grow text-sm" />
            <select name="status" defaultValue={searchParams?.status ?? ''} className="border p-2 rounded-md text-sm">
              <option value="">All Statuses</option>
              {Object.entries(TRIP_STATUSES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <Button type="submit"><Filter className="mr-2 h-4 w-4" />Filter</Button>
            <Button variant="outline" asChild><Link href="/admin/trips">Clear</Link></Button>
          </form>
        </CardHeader>
        <CardContent>
          {trips.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No trips found matching your criteria.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Itinerary</TableHead>
                    <TableHead>Main Booker</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Total Guests</TableHead>
                    <TableHead>Total Price</TableHead>
                    <TableHead>Overall Status</TableHead>
                    <TableHead className="min-w-[200px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trips.map((trip) => (
                    <TableRow key={trip.id} className={trip.overallStatus === 'pending_payment' ? 'bg-yellow-50/50 hover:bg-yellow-100/50' : ''}>
                      <TableCell className="font-medium">
                        {trip.itineraryName}
                        <Badge variant="outline" className="ml-2 text-xs">{ITINERARY_TYPES[trip.itineraryType]}</Badge>
                      </TableCell>
                      <TableCell>
                        {trip.contactName}<br />
                        <span className="text-xs text-muted-foreground">{trip.contactPhone}</span>
                        {trip.participants[0]?.status === 'pending_payment' && trip.participants[0]?.transferProofImageUrl && (
                          <div className="mt-1">
                            <ConfirmPaymentButton tripId={trip.id} isMainBooker={true} />
                            <p className="text-xs text-muted-foreground mt-1">Proof Uploaded</p>
                            <Image src={trip.participants[0].transferProofImageUrl} alt="Transfer Proof" width={80} height={80} className="mt-2 rounded" />
                          </div>
                        )}
                        {trip.participants[0]?.status === 'pending_payment' && !trip.participants[0]?.transferProofImageUrl && (
                          <Badge variant="outline" className="text-xs border-orange-400 text-orange-500 mt-1">No Proof Yet</Badge>
                        )}
                        {trip.participants[0] && (
                          <Badge
                            variant={trip.participants[0].status === 'payment_confirmed' ? 'default' : trip.participants[0].status === 'pending_payment' ? 'outline' : 'secondary'}
                            className={`mt-1 ${trip.participants[0].status === 'payment_confirmed' ? 'bg-green-500 text-white' : trip.participants[0].status === 'pending_payment' ? 'border-yellow-500 text-yellow-600' : ''}`}
                          >
                            {TRIP_STATUSES[trip.participants[0].status ?? 'pending_payment' as keyof typeof TRIP_STATUSES]} ({trip.participants[0].pricePaid?.toLocaleString() || '0'} VND)
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {trip.participants.slice(1).length > 0 ? (
                          <ul className="list-disc list-inside pl-1 space-y-1 text-xs">
                            {trip.participants.slice(1).map(p => (
                              <li key={p.id} className="flex flex-col items-start">
                                <span>{p.name} ({p.numberOfPeople} guest(s))</span>
                                <span className="text-muted-foreground">{p.phone}</span>
                                <Badge
                                  variant={p.status === 'payment_confirmed' ? 'default' : p.status === 'pending_payment' ? 'outline' : 'secondary'}
                                  className={`mt-1 ${p.status === 'payment_confirmed' ? 'bg-green-500 text-white' : p.status === 'pending_payment' ? 'border-yellow-500 text-yellow-600' : ''}`}
                                >
                                  {TRIP_STATUSES[p.status]} ({p.pricePaid.toLocaleString()} VND)
                                </Badge>
                                {p.status === 'pending_payment' && (
                                  <div className="mt-1">
                                    <ConfirmPaymentButton tripId={trip.id} participantId={p.id} isMainBooker={false} />
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-muted-foreground text-xs">No additional participants</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(trip.date), "MMM dd, yyyy")}<br />
                        <span className="text-xs text-muted-foreground">{trip.time}</span>
                      </TableCell>
                      <TableCell className="text-center">{trip.participants.reduce((sum, p) => sum + p.numberOfPeople, 0)}</TableCell>
                      <TableCell>{trip.totalPrice.toLocaleString()} VND</TableCell>
                      <TableCell>
                        <Badge
                          variant={(trip.overallStatus ?? 'pending_payment') === 'payment_confirmed' ? 'default' : (trip.overallStatus ?? 'pending_payment') === 'pending_payment' ? 'outline' : 'secondary'}
                          className={(trip.overallStatus ?? 'pending_payment') === 'payment_confirmed' ? 'bg-green-500 text-white' : (trip.overallStatus ?? 'pending_payment') === 'pending_payment' ? 'border-yellow-500 text-yellow-600' : ''}
                        >
                          {TRIP_STATUSES[(trip.overallStatus ?? 'pending_payment') as TripStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell className="space-y-1 sm:space-y-0 sm:space-x-2 text-right">
                        <Button variant="outline" size="sm" asChild title="View Details">
                          <Link href={`/admin/trips/${trip.id}`}>
                            <Eye className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" /> View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
