import { getTripById, confirmMainBookerPayment, confirmParticipantPayment } from '@/actions/tripActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, CardSection } from '@/components/ui/card-ext'; // Using extended Card for sections
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, Clock, Users, MapPin, Phone, Mail, FileText, CreditCard, CheckCircle, DollarSign, Image as ImageIcon, UserCircle } from 'lucide-react';
import { ITINERARY_TYPES, TRIP_STATUSES } from '@/lib/constants';
import { format } from 'date-fns';
import NextImage from 'next/image'; // Using NextImage for optimization
import { cn } from '@/lib/utils';

async function ConfirmPaymentButton({ tripId }: { tripId: string }) {
  const action = async () => {
    "use server";
    await confirmMainBookerPayment(tripId);
    // Revalidation is handled by the action itself
  };
  return (
    <form action={action}>
      <Button type="submit" className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white">
        <CheckCircle className="mr-2 h-4 w-4" /> Confirm Main Booker Payment
      </Button>
    </form>
  );
}

async function ConfirmParticipantPaymentButton({ tripId, participantId }: { tripId: string; participantId: string }) {
  const action = async () => {
    "use server";
    await confirmParticipantPayment(tripId, participantId);
  };
  return (
    <form action={action} className="inline-block ml-2">
      <Button type="submit" size="sm" variant="outline" className="bg-green-100 hover:bg-green-200 text-green-700 border-green-300">
        <CheckCircle className="mr-1 h-3 w-3" /> Confirm Payment
      </Button>
    </form>
  );
}

export default async function AdminTripDetailPage({ params }: { params: { tripId: string } }) {
  const trip = await getTripById(params.tripId);

  if (!trip) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto text-center py-10">
        <p className="text-destructive text-lg">Trip not found.</p>
        <Button variant="outline" asChild>
          <Link href="/admin/trips"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Trip List</Link>
        </Button>
      </div>
    );
  }

  const totalGuests = trip.numberOfPeople + trip.participants.reduce((sum, p) => sum + p.numberOfPeople, 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Button variant="outline" asChild className="mb-4">
        <Link href="/admin/trips"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Trip List</Link>
      </Button>

      <Card className="shadow-xl">
        <CardHeader className="border-b">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center">
            <div>
              <CardTitle className="font-headline text-2xl md:text-3xl">{trip.itineraryName}</CardTitle>
              <CardDescription className="text-base">
                Trip ID: {trip.id} &bull; {ITINERARY_TYPES[trip.itineraryType]}
              </CardDescription>
            </div>
            <Badge
              variant={trip.status === 'payment_confirmed' ? 'default' : trip.status === 'pending_payment' ? 'outline' : 'secondary'}
              className={`mt-2 sm:mt-0 text-lg px-4 py-2 ${trip.status === 'payment_confirmed' ? 'bg-green-500 text-white' : trip.status === 'pending_payment' ? 'border-yellow-500 text-yellow-600' : ''}`}
            >
              {TRIP_STATUSES[trip.status]}
            </Badge>
          </div>
        </CardHeader>

        <CardSection title="Booking Details" icon={<CalendarDays />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <p><strong className="font-medium text-muted-foreground">Date:</strong> {format(new Date(trip.date), "EEEE, MMM dd, yyyy")}</p>
            <p><strong className="font-medium text-muted-foreground">Time:</strong> {trip.time}</p>
            <p><strong className="font-medium text-muted-foreground">Total Guests:</strong> {totalGuests}</p>
            <p><strong className="font-medium text-muted-foreground">Total Price:</strong> {trip.totalPrice.toLocaleString()} VND</p>
            {trip.pickupAddress && <p className="md:col-span-2"><strong className="font-medium text-muted-foreground">Pickup Address:</strong> {trip.pickupAddress}</p>}
            {trip.dropoffAddress && <p className="md:col-span-2"><strong className="font-medium text-muted-foreground">Dropoff Address:</strong> {trip.dropoffAddress}</p>}
            {trip.district && <p><strong className="font-medium text-muted-foreground">District:</strong> {trip.district}</p>}
            {trip.discountCode && <p><strong className="font-medium text-muted-foreground">Discount Code:</strong> <Badge variant="secondary">{trip.discountCode}</Badge></p>}
          </div>
        </CardSection>

        <CardSection title="Contact Information" icon={<UserCircle />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <p><strong className="font-medium text-muted-foreground">Booked By:</strong> {trip.contactName}</p>
            <p><strong className="font-medium text-muted-foreground">Phone:</strong> {trip.contactPhone}</p>
            {trip.secondaryContact && <p><strong className="font-medium text-muted-foreground">Secondary Contact:</strong> {trip.secondaryContact}</p>}
          </div>
          {trip.notes && <p className="mt-2 text-sm italic"><strong className="font-medium text-muted-foreground not-italic">Notes:</strong> {trip.notes}</p>}
        </CardSection>

        {trip.additionalServiceIds && trip.additionalServiceIds.length > 0 && (
          <CardSection title="Additional Services" icon={<WandIcon />}>
            <ul className="list-disc list-inside text-sm">
              {trip.additionalServiceIds.map(service => <li key={service}>{service}</li>)} {/* Ideally, fetch service names */}
            </ul>
          </CardSection>
        )}

        {trip.participants.length > 0 && (
          <CardSection title="Joined Participants" icon={<Users />}>
            <div className="space-y-3">
              {trip.participants.map(p => (
                <div key={p.id} className="p-3 border rounded-md bg-muted/30 text-sm flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p><strong className="font-medium">{p.name}</strong> ({p.numberOfPeople} person(s))</p>
                    <p className="text-xs text-muted-foreground">Phone: {p.phone} | Address: {p.address}</p>
                    {p.notes && <p className="text-xs italic mt-1">Note: {p.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={p.status === 'payment_confirmed' ? 'default' : 'outline'}
                      className={cn("capitalize px-2 py-1 text-xs",
                        p.status === 'payment_confirmed' ? 'bg-green-500 text-white' : 'border-yellow-500 text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:border-yellow-600 dark:bg-yellow-900/30')}
                    >
                      {TRIP_STATUSES[p.status]} ({p.pricePaid.toLocaleString()} VND)
                    </Badge>
                    {p.status === 'pending_payment' && (
                      <ConfirmParticipantPaymentButton tripId={trip.id} participantId={p.id} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardSection>
        )}

        {trip.status === 'pending_payment' && (
          <CardSection title="Main Booker Payment Verification" icon={<DollarSign />}>
            {trip.transferProofImageUrl ? (
              <div className="space-y-4">
                <p className="text-sm">Payment proof has been uploaded by the main booker.</p>
                <div className="border rounded-md overflow-hidden max-w-md">
                  <NextImage src={trip.transferProofImageUrl} alt="Payment Proof" width={600} height={400} className="object-contain" data-ai-hint="payment proof" />
                </div>
                <ConfirmPaymentButton tripId={trip.id} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No payment proof has been uploaded by the main booker yet.</p>
            )}
          </CardSection>
        )}
        {trip.status === 'payment_confirmed' && trip.transferProofImageUrl && (
          <CardSection title="Main Booker Payment Proof" icon={<ImageIcon />}>
            <div className="border rounded-md overflow-hidden max-w-md">
              <NextImage src={trip.transferProofImageUrl} alt="Payment Proof" width={600} height={400} className="object-contain" data-ai-hint="payment proof" />
            </div>
            <p className="text-sm text-green-600 mt-2">Main booker payment has been confirmed for this trip.</p>
          </CardSection>
        )}

        <CardFooter className="border-t pt-6">
          {/* Add other actions like "Cancel Trip" or "Edit Trip" for admin if needed */}
          <p className="text-xs text-muted-foreground">Created At: {format(new Date(trip.createdAt), "MMM dd, yyyy HH:mm")}</p>
        </CardFooter>
      </Card>
    </div>
  );
}


const WandIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-3.54 3.54a2 2 0 0 1-2.83-2.83l.35-.35" /><path d="M14.73 2.39 5.86 11.26" />
  </svg>
);
