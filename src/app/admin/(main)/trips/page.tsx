import { getAllTrips, confirmPaymentByAdmin } from '@/actions/tripActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Eye, CheckCircle, CircleDollarSign, Filter, Users, CalendarDays, ClockIcon } from 'lucide-react';
import { TRIP_STATUSES, ITINERARY_TYPES } from '@/lib/constants';
import { format } from 'date-fns';
import Image from 'next/image';

async function ConfirmPaymentButton({ tripId }: { tripId: string }) {
  const action = async () => {
    "use server";
    // In a real app, add error handling and toast messages
    await confirmPaymentByAdmin(tripId);
  };
  return (
    <form action={action}>
      <Button type="submit" size="sm" variant="outline" className="bg-green-500 hover:bg-green-600 text-white border-green-600">
        <CheckCircle className="mr-2 h-4 w-4" /> Confirm Payment
      </Button>
    </form>
  );
}

export default async function AdminTripsPage({
  searchParams,
}: {
  searchParams?: { status?: string; search?: string };
}) {
  let trips = await getAllTrips();

  const statusFilter = searchParams?.status ?? '';
  const searchTerm = searchParams?.search?.toLowerCase() ?? '';

  if (statusFilter && TRIP_STATUSES[statusFilter as keyof typeof TRIP_STATUSES]) {
    trips = trips.filter(trip => trip.status === statusFilter);
  }

  if (searchTerm) {
    trips = trips.filter(trip =>
      trip.itineraryName.toLowerCase().includes(searchTerm) ||
      trip.contactName.toLowerCase().includes(searchTerm) ||
      trip.contactPhone.includes(searchTerm) ||
      trip.id.toLowerCase().includes(searchTerm)
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
            <input type="text" name="search" placeholder="Search name, phone, itinerary..." defaultValue={searchParams?.search ?? ''} className="border p-2 rounded-md flex-grow text-sm" />
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
                    <TableHead>Customer</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Guests</TableHead>
                    <TableHead>Total Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="min-w-[200px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trips.map((trip) => (
                    <TableRow key={trip.id}>
                      <TableCell className="font-medium">
                        {trip.itineraryName}
                        <Badge variant="outline" className="ml-2 text-xs">{ITINERARY_TYPES[trip.itineraryType]}</Badge>
                      </TableCell>
                      <TableCell>
                        {trip.contactName}<br />
                        <span className="text-xs text-muted-foreground">{trip.contactPhone}</span>
                      </TableCell>
                      <TableCell>
                        {format(new Date(trip.date), "MMM dd, yyyy")}<br />
                        <span className="text-xs text-muted-foreground">{trip.time}</span>
                      </TableCell>
                      <TableCell className="text-center">{trip.numberOfPeople + trip.participants.reduce((sum, p) => sum + p.numberOfPeople, 0)}</TableCell>
                      <TableCell>{trip.totalPrice.toLocaleString()} VND</TableCell>
                      <TableCell>
                        <Badge
                          variant={trip.status === 'payment_confirmed' ? 'default' : trip.status === 'pending_payment' ? 'outline' : 'secondary'}
                          className={trip.status === 'payment_confirmed' ? 'bg-green-500 text-white' : trip.status === 'pending_payment' ? 'border-yellow-500 text-yellow-600' : ''}
                        >
                          {TRIP_STATUSES[trip.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="space-y-1 sm:space-y-0 sm:space-x-2 text-right">
                        <Button variant="outline" size="sm" asChild title="View Details">
                          <Link href={`/admin/trips/${trip.id}`}>
                            <Eye className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" /> View
                          </Link>
                        </Button>
                        {trip.status === 'pending_payment' && trip.transferProofImageUrl && (
                          <ConfirmPaymentButton tripId={trip.id} />
                        )}
                        {trip.status === 'pending_payment' && !trip.transferProofImageUrl && (
                          <Badge variant="outline" className="text-xs border-orange-400 text-orange-500">No Proof Yet</Badge>
                        )}
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
