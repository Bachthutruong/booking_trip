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
import { getAdditionalServicesByIds } from '@/actions/configActions'; // Import the new function
import ImagePreviewDialog from '@/components/common/ImagePreviewDialog';
import PaymentProofPreviewButton from '@/components/admin/PaymentProofPreviewButton'; // New import
import { ConfirmPaymentButton as ClientConfirmPaymentButton } from '@/components/admin/ConfirmPaymentButton'; // Import the client component
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'; // New import
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'; // New import

// Cosmetic change to trigger TypeScript re-evaluation
const WandIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-3.54 3.54a2 2 0 0 1-2.83-2.83l.35-.35" /><path d="M14.73 2.39 5.86 11.26" />
  </svg>
);

export default async function AdminTripDetailPage({ params }: { params: { tripId: string } }) {
  const trip = await getTripById(params.tripId);
  console.log(trip, 'tripppppp');

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

  const totalGuests = trip.participants.reduce((sum, p) => sum + p.numberOfPeople, 0);
  const selectedAdditionalServices = trip.additionalServiceIds && trip.additionalServiceIds.length > 0
    ? await getAdditionalServicesByIds(trip.additionalServiceIds)
    : [];

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
              {selectedAdditionalServices.map(service => (
                <li key={service.id}>{service.name} (+{service.price.toLocaleString()} VND)</li>
              ))}
            </ul>
          </CardSection>
        )}

        {trip.participants.length > 0 && (
          <CardSection title="Joined Participants" icon={<Users />}>
            <div className="space-y-3">
              {trip.participants.map(p => (
                <Accordion type="single" collapsible key={p.id} className="w-full">
                  <AccordionItem value={p.id}>
                    <AccordionTrigger className="flex items-center justify-between gap-4 group-hover:no-underline p-4">
                      <div className="flex flex-col flex-grow min-w-0">
                        <strong className="font-medium">{p.name}</strong> ({p.numberOfPeople} person(s))
                        <p className="text-xs text-muted-foreground">Phone: {p.phone} | Address: {p.address}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge
                          variant={p.status === 'payment_confirmed' ? 'default' : 'outline'}
                          className={cn("capitalize px-2 py-1 text-xs",
                            p.status === 'payment_confirmed' ? 'bg-green-500 text-white' : 'border-yellow-500 text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:border-yellow-600 dark:bg-yellow-900/30')}
                        >
                          {TRIP_STATUSES[p.status]} ({p.pricePaid.toLocaleString()} VND)
                        </Badge>
                        {p.status === 'pending_payment' && p.transferProofImageUrl && (
                          <PaymentProofPreviewButton imageUrl={p.transferProofImageUrl} />
                        )}
                        {p.status === 'pending_payment' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="default" size="sm" className="bg-green-500 text-white hover:bg-green-600">
                                <CheckCircle className="mr-2 h-4 w-4" /> Confirm Payment
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirm Payment for {p.name}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will mark the participant's payment as confirmed.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction asChild>
                                  <ClientConfirmPaymentButton tripId={trip.id} participantId={p.id} isMainBooker={false} />
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pl-4 py-2 border-l-2 border-primary/50 space-y-2 text-sm">
                        {p.email && <p><strong className="font-medium text-muted-foreground">Email:</strong> {p.email}</p>}
                        {p.dob && <p><strong className="font-medium text-muted-foreground">Date of Birth:</strong> {format(new Date(p.dob), "MMM dd, yyyy")}</p>}
                        {p.identityNumber && <p><strong className="font-medium text-muted-foreground">Identity No.:</strong> {p.identityNumber}</p>}
                        {p.discountCode && p.discountCode.code && (
                          <p><strong className="font-medium text-muted-foreground">Discount Code:</strong> <Badge variant="secondary">{p.discountCode.code} ({p.discountCode.type === 'percentage' ? `${p.discountCode.value}%` : `${p.discountCode.value.toLocaleString()} VND`})</Badge></p>
                        )}
                        {p.additionalServices && p.additionalServices.length > 0 && (
                          <div>
                            <strong className="font-medium text-muted-foreground">Services:</strong>
                            <ul className="list-disc list-inside ml-4">
                              {p.additionalServices.map(service => (
                                <li key={service.id}>{service.name} (+{service.price.toLocaleString()} VND)</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {p.notes && <p><strong className="font-medium text-muted-foreground">Notes:</strong> {p.notes}</p>}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ))}
            </div>
          </CardSection>
        )}

        {/* Consolidated Payment Proof Section */}
        {/* This section is removed as individual participant proof is now handled */}

        <CardFooter className="border-t pt-6">
          {/* Add other actions like "Cancel Trip" or "Edit Trip" for admin if needed */}
          <p className="text-xs text-muted-foreground">Created At: {format(new Date(trip.createdAt), "MMM dd, yyyy HH:mm")}</p>
        </CardFooter>
      </Card>
    </div>
  );
}
