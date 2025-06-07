'use server';

import { itinerariesDB, tripsDB, discountCodesDB, districtSurchargesDB, additionalServicesDB } from '@/lib/data';
import type { CreateTripFormValues, Itinerary, Trip, Participant, JoinTripFormValues, DiscountCode } from '@/lib/types';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Helper function to calculate total price
const calculateTotalPrice = (
  itinerary: Itinerary,
  numPeople: number,
  districtName?: string,
  serviceIds?: string[],
  discount?: DiscountCode | null
): number => {
  let price = itinerary.pricePerPerson * numPeople;

  if (districtName) {
    const districtSurcharge = districtSurchargesDB.find(d => d.districtName === districtName);
    if (districtSurcharge) {
      price += districtSurcharge.surchargeAmount;
    }
  }

  if (serviceIds) {
    serviceIds.forEach(serviceId => {
      const service = additionalServicesDB.find(s => s.id === serviceId);
      if (service) {
        price += service.price;
      }
    });
  }

  if (discount) {
    if (discount.type === 'fixed') {
      price -= discount.value;
    } else if (discount.type === 'percentage') {
      price -= price * (discount.value / 100);
    }
  }
  return Math.max(0, price); // Ensure price is not negative
};


const createTripSchema = z.object({
  itineraryId: z.string().min(1, "Itinerary is required."),
  date: z.string().min(1, "Date is required."), // Assuming date is already a string YYYY-MM-DD
  time: z.string().min(1, "Time is required."),
  numberOfPeople: z.number().min(1, "At least one person is required."),
  pickupAddress: z.string().optional(),
  dropoffAddress: z.string().optional(),
  contactName: z.string().min(1, "Contact name is required."),
  contactPhone: z.string().min(1, "Contact phone is required.").regex(/^\+?[0-9\s-]{10,15}$/, "Invalid phone number format."),
  secondaryContact: z.string().optional(),
  notes: z.string().optional(),
  district: z.string().optional(),
  additionalServiceIds: z.array(z.string()).optional(),
  discountCode: z.string().optional(), // User might enter a discount code
});


export async function createTrip(values: CreateTripFormValues & { discountCode?: string }): Promise<{ success: boolean; message: string; tripId?: string }> {
  const validation = createTripSchema.safeParse({
    ...values,
    date: typeof values.date === 'string' ? values.date : values.date.toISOString().split('T')[0], // Ensure date is string
    numberOfPeople: Number(values.numberOfPeople) // Ensure number
  });

  if (!validation.success) {
    return { success: false, message: validation.error.errors.map(e => e.message).join(', ') };
  }

  const data = validation.data;

  const itinerary = itinerariesDB.find(itn => itn.id === data.itineraryId);
  if (!itinerary) {
    return { success: false, message: 'Selected itinerary not found.' };
  }

  // Validate address based on itinerary type
  if (itinerary.type === 'airport_pickup' && !data.dropoffAddress) {
    return { success: false, message: 'Dropoff address is required for airport pickups.' };
  }
  if ((itinerary.type === 'airport_dropoff' || itinerary.type === 'tourism') && !data.pickupAddress) {
    return { success: false, message: 'Pickup address is required for this itinerary type.' };
  }
  
  let appliedDiscount: DiscountCode | null = null;
  if (data.discountCode) {
    appliedDiscount = discountCodesDB.find(dc => dc.code.toUpperCase() === data.discountCode!.toUpperCase() && dc.isActive) || null;
    if (!appliedDiscount) {
        // Optionally, inform user if discount code is invalid but proceed without it, or return error
        // For now, just proceed without discount if invalid
    }
  }

  const newTripId = `trip_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const totalPrice = calculateTotalPrice(
    itinerary, 
    data.numberOfPeople, 
    data.district, 
    data.additionalServiceIds,
    appliedDiscount
  );

  const newTrip: Trip = {
    id: newTripId,
    itineraryId: itinerary.id,
    itineraryName: itinerary.name,
    itineraryType: itinerary.type,
    date: data.date,
    time: data.time,
    numberOfPeople: data.numberOfPeople,
    pickupAddress: data.pickupAddress,
    dropoffAddress: data.dropoffAddress,
    contactName: data.contactName,
    contactPhone: data.contactPhone,
    secondaryContact: data.secondaryContact,
    notes: data.notes,
    status: 'pending_payment',
    participants: [], // Initially no additional participants beyond the creator
    totalPrice,
    district: data.district,
    additionalServiceIds: data.additionalServiceIds || [],
    creatorUserId: data.contactPhone, // Using phone as a simple identifier
    createdAt: new Date().toISOString(),
  };

  tripsDB.push(newTrip);
  revalidatePath('/my-trips');
  revalidatePath('/join-trip');
  
  return { success: true, message: 'Trip created successfully! Please proceed to payment.', tripId: newTrip.id };
}

export async function getUserTrips(contactPhone: string): Promise<Trip[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const userTrips = tripsDB.filter(trip => trip.contactPhone === contactPhone || trip.participants.some(p => p.phone === contactPhone));
  return JSON.parse(JSON.stringify(userTrips.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() )));
}

export async function getTripById(tripId: string): Promise<Trip | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const trip = tripsDB.find(t => t.id === tripId);
    return trip ? JSON.parse(JSON.stringify(trip)) : null;
}


export async function uploadTransferProof(tripId: string, imageUrl: string): Promise<{ success: boolean; message: string }> {
  const tripIndex = tripsDB.findIndex(trip => trip.id === tripId);
  if (tripIndex === -1) {
    return { success: false, message: 'Trip not found.' };
  }

  // In a real app, you'd upload the image to storage and save the URL.
  // Here, we're just updating the mock data.
  tripsDB[tripIndex].transferProofImageUrl = imageUrl;
  // Optionally change status, e.g. to 'payment_review' if admin needs to verify
  // For now, let's assume admin will see this and manually confirm.
  // The prompt says "thông báo cho quản trị viên", which could be an email/notification.
  // Here, we'll just log it.
  console.log(`Admin Notification: Transfer proof uploaded for Trip ID: ${tripId}. Image URL: ${imageUrl}`);
  
  revalidatePath('/my-trips');
  return { success: true, message: 'Transfer proof uploaded. Admin will verify shortly.' };
}

export async function confirmPaymentByAdmin(tripId: string): Promise<{ success: boolean; message: string }> {
  const tripIndex = tripsDB.findIndex(trip => trip.id === tripId);
  if (tripIndex === -1) {
    return { success: false, message: 'Trip not found.' };
  }
  if (tripsDB[tripIndex].status !== 'pending_payment' && !tripsDB[tripIndex].transferProofImageUrl) {
     return { success: false, message: 'Trip is not awaiting payment or no proof submitted.' };
  }

  tripsDB[tripIndex].status = 'payment_confirmed';
  revalidatePath('/my-trips');
  revalidatePath('/join-trip'); // So it appears in joinable trips
  
  console.log(`Admin Action: Payment confirmed for Trip ID: ${tripId}.`);
  return { success: true, message: 'Payment confirmed successfully.' };
}


export async function getConfirmedTrips(): Promise<Trip[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  // Add logic here to filter trips that are confirmed and can still be joined (e.g., not full, date is in future)
  const confirmed = tripsDB.filter(trip => trip.status === 'payment_confirmed' && new Date(trip.date) >= new Date());
  return JSON.parse(JSON.stringify(confirmed.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())));
}


const joinTripSchema = z.object({
  tripId: z.string().min(1),
  name: z.string().min(1, "Name is required."),
  phone: z.string().min(1, "Phone is required.").regex(/^\+?[0-9\s-]{10,15}$/, "Invalid phone number format."),
  numberOfPeople: z.number().min(1, "At least one person is required."),
  address: z.string().min(1, "Address is required."), // Pickup address for the joiner
  discountCode: z.string().optional(),
  notes: z.string().optional(),
});

export async function joinTrip(values: JoinTripFormValues): Promise<{ success: boolean; message: string }> {
  const validation = joinTripSchema.safeParse({
      ...values,
      numberOfPeople: Number(values.numberOfPeople)
  });

  if (!validation.success) {
    return { success: false, message: validation.error.errors.map(e => e.message).join(', ') };
  }
  const data = validation.data;

  const tripIndex = tripsDB.findIndex(trip => trip.id === data.tripId);
  if (tripIndex === -1) {
    return { success: false, message: 'Trip not found or no longer available.' };
  }

  const trip = tripsDB[tripIndex];
  if (trip.status !== 'payment_confirmed') {
    return { success: false, message: 'This trip is not confirmed for joining.' };
  }
  // Optional: Check if trip is full or date has passed.

  const itinerary = itinerariesDB.find(itn => itn.id === trip.itineraryId);
  if (!itinerary) {
    return { success: false, message: 'Itinerary details for this trip are missing.' }; // Should not happen
  }

  let appliedDiscount: DiscountCode | null = null;
  if (data.discountCode) {
    appliedDiscount = discountCodesDB.find(dc => dc.code.toUpperCase() === data.discountCode!.toUpperCase() && dc.isActive) || null;
  }

  // Calculate price for this participant
  // For simplicity, let's assume discount for joiner applies only to their share
  // and district/additional services are part of the main trip booking.
  // A more complex system might prorate or have specific joiner fees.
  const participantPrice = calculateTotalPrice(itinerary, data.numberOfPeople, undefined, undefined, appliedDiscount);


  const newParticipant: Participant = {
    id: `participant_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: data.name,
    phone: data.phone,
    numberOfPeople: data.numberOfPeople,
    address: data.address,
    discountCode: appliedDiscount ? appliedDiscount.code : undefined,
    notes: data.notes,
    pricePaid: 0, // This would be updated upon their payment for their part
  };

  tripsDB[tripIndex].participants.push(newParticipant);
  // The total price of the trip might need recalculation or this participant pays separately.
  // For now, we assume the joiner handles their payment separately.
  // The main trip creator's `totalPrice` remains for their initial booking.

  revalidatePath('/my-trips');
  revalidatePath(`/join-trip`);

  return { success: true, message: `Successfully joined trip ${trip.itineraryName}! You will be contacted for payment details for your share.` };
}

// Mock action to get trips for feedback form (simplified)
export async function getTripsForUserFeedback(userIdentifier: string): Promise<{id: string, name: string}[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    // In a real app, 'userIdentifier' could be an email or phone from an authenticated session.
    // For this example, let's assume it's contactPhone.
    const userTrips = tripsDB
        .filter(trip => trip.contactPhone === userIdentifier && (trip.status === 'completed' || trip.status === 'payment_confirmed'))
        .map(trip => ({ id: trip.id, name: `${trip.itineraryName} on ${trip.date}` }));
    return JSON.parse(JSON.stringify(userTrips));
}
