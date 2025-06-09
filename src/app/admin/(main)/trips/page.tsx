import { getTripsPaginated } from '@/actions/tripActions';
import { useSearchParams } from 'next/navigation';
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

export default async function AdminTripsPage({ searchParams }: { searchParams?: { status?: string; search?: string; page?: string } }) {
  const statusFilter = searchParams?.status ?? '';
  const searchTerm = searchParams?.search?.toLowerCase() ?? '';
  const page = parseInt(searchParams?.page || '1', 10);
  const PAGE_SIZE = 20;

  // Lazy load paginated trips
  const skip = (page - 1) * PAGE_SIZE;
  const trips = await getTripsPaginated(PAGE_SIZE, skip);
  // Không có tổng số trips, nên disable số trang nếu chưa có count API
  const pagedTrips = trips;
  console.log(pagedTrips, 'pagedTrips');
  // Không có totalTrips, totalPages, currentPage nếu chưa có count
  // Nếu muốn chuẩn, cần thêm API count trips
  // Tạm thời chỉ có nút next/prev nếu trips.length === PAGE_SIZE
  const hasNextPage = trips.length === PAGE_SIZE;
  const currentPage = page;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold font-headline">Manage Trip Bookings</h1>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Booking List</CardTitle>
          <CardDescription>View and manage all customer trip bookings.</CardDescription>
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
          {pagedTrips.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No trips found matching your criteria.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Itinerary</TableHead>
                    <TableHead>Main Booker</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="min-w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedTrips.map((trip) => (
                    <TableRow key={trip.id}>
                      <TableCell className="font-medium">
                        {trip.itineraryName}
                        <Badge variant="outline" className="ml-2 text-xs">{trip.itineraryType ? trip.itineraryType.charAt(0).toUpperCase() + trip.itineraryType.slice(1) : ''}</Badge>
                      </TableCell>
                      <TableCell>
                        {trip.contactName}<br />
                        <span className="text-xs text-muted-foreground">{trip.contactPhone}</span>
                      </TableCell>
                      <TableCell>
                        {trip.date ? format(new Date(trip.date), "MMM dd, yyyy") : ''}<br />
                        <span className="text-xs text-muted-foreground">{trip.time}</span>
                      </TableCell>
                      <TableCell>{trip.totalPrice?.toLocaleString?.() || 0} 元</TableCell>
                      <TableCell>
                        <Badge
                          variant={trip.overallStatus === 'payment_confirmed' ? 'default' : trip.overallStatus === 'pending_payment' ? 'outline' : 'secondary'}
                          className={trip.overallStatus === 'payment_confirmed' ? 'bg-green-500 text-white' : trip.overallStatus === 'pending_payment' ? 'border-yellow-500 text-yellow-600' : ''}
                        >
                          {trip.overallStatus === 'payment_confirmed' ? 'Paid' : trip.overallStatus === 'pending_payment' ? 'Pending Payment' : 'Completed'}
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
          {/* Pagination controls */}
          <div className="flex justify-center items-center gap-2 mt-6">
            <Button asChild variant="outline" size="sm" disabled={currentPage === 1}>
              <Link href={`/admin/trips?page=${currentPage - 1}`}>Previous</Link>
            </Button>
            <span className="text-sm">Page {currentPage}</span>
            <Button asChild variant="outline" size="sm" disabled={pagedTrips.length < PAGE_SIZE}>
              <Link href={`/admin/trips?page=${currentPage + 1}`}>Next</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
