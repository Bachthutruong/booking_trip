
'use server';

import { getTripsCollection, getItinerariesCollection } from '@/lib/mongodb';
import { discountCodesDB, districtSurchargesDB, additionalServicesDB } from '@/lib/data'; // Keep using these for now
import type { CreateTripFormValues, Itinerary, Trip, Participant, JoinTripFormValues, DiscountCode } from '@/lib/types';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Helper to map MongoDB document to Trip type
function mapDocumentToTrip(doc: any): Trip {
  if (!doc) return null as any;
  return {
    ...doc,
    id: doc._id.toString(),
    _id: doc._id,
  };
}
async function getItineraryFromDb(itineraryId: string): Promise<Itinerary | null> {
  const itinerariesCollection = await getItinerariesCollection();
  let itineraryDoc;
  if (ObjectId.isValid(itineraryId)) {
    itineraryDoc = await itinerariesCollection.findOne({ _id: new ObjectId(itineraryId) });
  } else {
    // Fallback for user-friendly ID if not an ObjectId (e.g. from old system or direct URL)
    itineraryDoc = await itinerariesCollection.findOne({ id: itineraryId });
  }
  
  if (!itineraryDoc) return null;
  return {
    ...itineraryDoc,
    id: itineraryDoc._id.toString(),
  } as Itinerary;
}


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
  return Math.max(0, price);
};


const createTripSchema = z.object({
  itineraryId: z.string().min(1, "Itinerary is required."),
  date: z.string().min(1, "Date is required."), 
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
  discountCode: z.string().optional(),
});


export async function createTrip(values: CreateTripFormValues & { discountCode?: string }): Promise<{ success: boolean; message: string; tripId?: string }> {
  const validation = createTripSchema.safeParse({
    ...values,
    date: typeof values.date === 'string' ? values.date : values.date.toISOString().split('T')[0],
    numberOfPeople: Number(values.numberOfPeople)
  });

  if (!validation.success) {
    return { success: false, message: validation.error.errors.map(e => e.message).join(', ') };
  }
  const data = validation.data;

  const itinerary = await getItineraryFromDb(data.itineraryId);
  if (!itinerary) {
    return { success: false, message: 'Selected itinerary not found.' };
  }

  if (itinerary.type === 'airport_pickup' && !data.dropoffAddress) {
    return { success: false, message: 'Dropoff address is required for airport pickups.' };
  }
  if ((itinerary.type === 'airport_dropoff' || itinerary.type === 'tourism') && !data.pickupAddress) {
    return { success: false, message: 'Pickup address is required for this itinerary type.' };
  }
  
  let appliedDiscount: DiscountCode | null = null;
  if (data.discountCode) {
    appliedDiscount = discountCodesDB.find(dc => dc.code.toUpperCase() === data.discountCode!.toUpperCase() && dc.isActive) || null;
  }

  const newTripObjectId = new ObjectId();
  const totalPrice = calculateTotalPrice(
    itinerary, 
    data.numberOfPeople, 
    data.district, 
    data.additionalServiceIds,
    appliedDiscount
  );

  const newTripData: Omit<Trip, '_id' | 'id'> = {
    itineraryId: itinerary.id, // Store the user-friendly ID of the itinerary
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
    participants: [],
    totalPrice,
    district: data.district,
    additionalServiceIds: data.additionalServiceIds || [],
    creatorUserId: data.contactPhone,
    createdAt: new Date().toISOString(),
  };

  const tripsCollection = await getTripsCollection();
  const result = await tripsCollection.insertOne({
    _id: newTripObjectId,
    id: newTripObjectId.toString(), // Store user-friendly ID as well
    ...newTripData
  });

  if (result.insertedId) {
    revalidatePath('/my-trips');
    revalidatePath('/join-trip');
    return { success: true, message: 'Trip created successfully! Please proceed to payment.', tripId: newTripObjectId.toString() };
  }
  return { success: false, message: 'Failed to create trip.' };
}

export async function getUserTrips(contactPhone: string): Promise<Trip[]> {
  const tripsCollection = await getTripsCollection();
  const userTripDocs = await tripsCollection.find({
    $or: [
      { contactPhone: contactPhone },
      { 'participants.phone': contactPhone }
    ]
  }).sort({ createdAt: -1 }).toArray();
  return userTripDocs.map(mapDocumentToTrip);
}

export async function getTripById(tripId: string): Promise<Trip | null> {
    const tripsCollection = await getTripsCollection();
    let tripDoc;
    if (ObjectId.isValid(tripId)) {
        tripDoc = await tripsCollection.findOne({ _id: new ObjectId(tripId) });
    } else {
        tripDoc = await tripsCollection.findOne({ id: tripId }); // Fallback for user-friendly ID
    }
    return tripDoc ? mapDocumentToTrip(tripDoc) : null;
}


export async function uploadTransferProof(tripId: string, imageUrl: string): Promise<{ success: boolean; message: string }> {
  if (!ObjectId.isValid(tripId) && !(await getTripById(tripId))) { // Check both ObjectId and user-friendly ID cases
      return { success: false, message: 'Invalid Trip ID format or trip not found.' };
  }

  const tripsCollection = await getTripsCollection();
  const currentTrip = await getTripById(tripId);
  if (!currentTrip) {
      return { success: false, message: 'Trip not found.' };
  }
  
  const result = await tripsCollection.updateOne(
    { _id: new ObjectId(currentTrip._id) }, // Use the actual MongoDB _id for update
    { $set: { transferProofImageUrl: imageUrl } }
  );

  if (result.matchedCount > 0) {
    console.log(`Admin Notification: Transfer proof uploaded for Trip ID: ${tripId}. Image URL: ${imageUrl}`);
    revalidatePath('/my-trips');
    return { success: true, message: 'Transfer proof uploaded. Admin will verify shortly.' };
  }
  return { success: false, message: 'Failed to upload transfer proof.' };
}

export async function confirmPaymentByAdmin(tripId: string): Promise<{ success: boolean; message: string }> {
  const tripsCollection = await getTripsCollection();
  const currentTrip = await getTripById(tripId);
  if (!currentTrip) {
    return { success: false, message: 'Trip not found.' };
  }
  if (currentTrip.status !== 'pending_payment' && !currentTrip.transferProofImageUrl) {
     return { success: false, message: 'Trip is not awaiting payment or no proof submitted.' };
  }

  const result = await tripsCollection.updateOne(
    { _id: new ObjectId(currentTrip._id) },
    { $set: { status: 'payment_confirmed' } }
  );

  if (result.matchedCount > 0) {
    revalidatePath('/my-trips');
    revalidatePath('/join-trip');
    console.log(`Admin Action: Payment confirmed for Trip ID: ${tripId}.`);
    return { success: true, message: 'Payment confirmed successfully.' };
  }
  return { success: false, message: 'Failed to confirm payment.' };
}


export async function getConfirmedTrips(): Promise<Trip[]> {
  const tripsCollection = await getTripsCollection();
  const confirmedTripDocs = await tripsCollection.find({
    status: 'payment_confirmed',
    date: { $gte: new Date().toISOString().split('T')[0] } // Ensure date is today or in future
  }).sort({ date: 1 }).toArray();
  return confirmedTripDocs.map(mapDocumentToTrip);
}


const joinTripSchema = z.object({
  tripId: z.string().min(1),
  name: z.string().min(1, "Name is required."),
  phone: z.string().min(1, "Phone is required.").regex(/^\+?[0-9\s-]{10,15}$/, "Invalid phone number format."),
  numberOfPeople: z.number().min(1, "At least one person is required."),
  address: z.string().min(1, "Address is required."),
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

  const tripsCollection = await getTripsCollection();
  const trip = await getTripById(data.tripId);

  if (!trip) {
    return { success: false, message: 'Trip not found or no longer available.' };
  }
  if (trip.status !== 'payment_confirmed') {
    return { success: false, message: 'This trip is not confirmed for joining.' };
  }

  const itinerary = await getItineraryFromDb(trip.itineraryId);
  if (!itinerary) {
    return { success: false, message: 'Itinerary details for this trip are missing.' };
  }

  let appliedDiscount: DiscountCode | null = null;
  if (data.discountCode) {
    appliedDiscount = discountCodesDB.find(dc => dc.code.toUpperCase() === data.discountCode!.toUpperCase() && dc.isActive) || null;
  }

  // const participantPrice = calculateTotalPrice(itinerary, data.numberOfPeople, undefined, undefined, appliedDiscount);

  const newParticipant: Participant = {
    id: `participant_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: data.name,
    phone: data.phone,
    numberOfPeople: data.numberOfPeople,
    address: data.address,
    discountCode: appliedDiscount ? appliedDiscount.code : undefined,
    notes: data.notes,
    pricePaid: 0, 
  };

  const result = await tripsCollection.updateOne(
    { _id: new ObjectId(trip._id) },
    { $push: { participants: newParticipant } }
  );

  if (result.matchedCount > 0) {
    revalidatePath('/my-trips');
    revalidatePath(`/join-trip`);
    return { success: true, message: `Successfully joined trip ${trip.itineraryName}! You will be contacted for payment details for your share.` };
  }
  return { success: false, message: 'Failed to join trip.' };
}

export async function getTripsForUserFeedback(userIdentifier: string): Promise<{id: string, name: string}[]> {
    const tripsCollection = await getTripsCollection();
    const userTripDocs = await tripsCollection.find({
      contactPhone: userIdentifier, // Assuming userIdentifier is phone
      $or: [{ status: 'completed' }, { status: 'payment_confirmed' }]
    }).toArray();
    
    return userTripDocs.map(trip => ({
        id: trip._id.toString(),
        name: `${trip.itineraryName} on ${trip.date}`
    }));
}
