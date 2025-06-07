
'use server';

import { getTripsCollection, getItinerariesCollection, getDiscountCodesCollection, getDistrictSurchargesCollection, getAdditionalServicesCollection } from '@/lib/mongodb';
import type { CreateTripFormValues, Itinerary, Trip, Participant, JoinTripFormValues, DiscountCode, DistrictSurcharge, AdditionalService } from '@/lib/types';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { format } from 'date-fns';

// Helper to map MongoDB document to Trip type
function mapDocumentToTrip(doc: any): Trip {
  if (!doc) return null as any;
  return {
    ...doc,
    id: doc._id.toString(),
    _id: doc._id, // Keep original _id if needed internally
  };
}

async function getItineraryFromDb(itineraryId: string): Promise<Itinerary | null> {
  const itinerariesCollection = await getItinerariesCollection();
  let itineraryDoc;
  if (ObjectId.isValid(itineraryId)) {
    itineraryDoc = await itinerariesCollection.findOne({ _id: new ObjectId(itineraryId) });
  } else {
    itineraryDoc = await itinerariesCollection.findOne({ id: itineraryId });
  }
  if (!itineraryDoc) return null;
  return {
    ...itineraryDoc,
    id: itineraryDoc._id.toString(),
  } as Itinerary;
}

async function getDiscountFromDb(code?: string): Promise<DiscountCode | null> {
  if (!code) return null;
  const discountCodesCol = await getDiscountCodesCollection();
  const discount = await discountCodesCol.findOne({ code: code.toUpperCase(), isActive: true });
  // TODO: Add validation for usageLimit, validFrom, validTo if implemented
  return discount ? { ...discount, id: discount._id.toString() } as DiscountCode : null;
}

// Helper function to calculate total price
const calculateTotalPrice = async (
  itinerary: Itinerary,
  numPeople: number,
  districtName?: string,
  serviceIds?: string[],
  discountCodeStr?: string
): Promise<number> => {
  let price = itinerary.pricePerPerson * numPeople;

  if (districtName) {
    const districtSurchargesCol = await getDistrictSurchargesCollection();
    const districtSurcharge = await districtSurchargesCol.findOne({ districtName: districtName });
    if (districtSurcharge) {
      price += districtSurcharge.surchargeAmount;
    }
  }

  if (serviceIds && serviceIds.length > 0) {
    const additionalServicesCol = await getAdditionalServicesCollection();
    const services = await additionalServicesCol.find({ id: { $in: serviceIds } }).toArray();
    services.forEach(service => {
      price += service.price;
    });
  }

  const discount = await getDiscountFromDb(discountCodeStr);
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
  date: z.string().min(1, "Date is required."), // Will be YYYY-MM-DD string from client
  time: z.string().min(1, "Time is required."),
  numberOfPeople: z.number().min(1, "At least one person is required."),
  pickupAddress: z.string().optional(),
  dropoffAddress: z.string().optional(),
  contactName: z.string().min(1, "Contact name is required."),
  contactPhone: z.string().min(1, "Contact phone is required.").regex(/^\+?[0-9\s-]{10,15}$/, "Invalid phone number format."),
  secondaryContact: z.string().optional(), // Combined string "Type: Value"
  notes: z.string().optional(),
  district: z.string().optional(),
  additionalServiceIds: z.array(z.string()).optional(),
  discountCode: z.string().optional(),
});


export async function createTrip(values: CreateTripFormValues & { date: string }): Promise<{ success: boolean; message: string; tripId?: string }> {
  const validation = createTripSchema.safeParse({
    ...values,
    numberOfPeople: Number(values.numberOfPeople), // Ensure it's a number
    // date is already string
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
  
  const totalPrice = await calculateTotalPrice(
    itinerary, 
    data.numberOfPeople, 
    data.district, 
    data.additionalServiceIds,
    data.discountCode
  );

  const newTripObjectId = new ObjectId();
  const newTripData: Omit<Trip, '_id' | 'id'> = {
    itineraryId: itinerary.id,
    itineraryName: itinerary.name,
    itineraryType: itinerary.type,
    date: data.date, // YYYY-MM-DD string
    time: data.time,
    numberOfPeople: data.numberOfPeople,
    pickupAddress: data.pickupAddress,
    dropoffAddress: data.dropoffAddress,
    contactName: data.contactName,
    contactPhone: data.contactPhone,
    secondaryContact: values.secondaryContactType && values.secondaryContactValue ? `${values.secondaryContactType}: ${values.secondaryContactValue}` : undefined,
    notes: data.notes,
    status: 'pending_payment',
    participants: [],
    totalPrice,
    district: data.district,
    additionalServiceIds: data.additionalServiceIds || [],
    discountCode: data.discountCode,
    creatorUserId: data.contactPhone, // Using phone as a simple user identifier
    createdAt: new Date().toISOString(),
  };

  const tripsCollection = await getTripsCollection();
  try {
    const result = await tripsCollection.insertOne({
      _id: newTripObjectId,
      id: newTripObjectId.toString(),
      ...newTripData
    });

    if (result.insertedId) {
      // TODO: If discount code was used, increment its timesUsed count in DB
      revalidatePath('/my-trips');
      revalidatePath('/admin/trips');
      return { success: true, message: 'Trip created successfully! Please proceed to payment.', tripId: newTripObjectId.toString() };
    }
    return { success: false, message: 'Failed to create trip.' };
  } catch(error) {
    console.error("Error creating trip:", error);
    return { success: false, message: 'An unexpected error occurred while creating the trip.' };
  }
}

export async function getUserTrips(contactPhone: string): Promise<Trip[]> {
  if (!contactPhone) return [];
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
        // Fallback for user-friendly ID if it's not an ObjectId
        tripDoc = await tripsCollection.findOne({ id: tripId }); 
    }
    return tripDoc ? mapDocumentToTrip(tripDoc) : null;
}

export async function getAllTrips(): Promise<Trip[]> {
  const tripsCollection = await getTripsCollection();
  const tripDocs = await tripsCollection.find({}).sort({ createdAt: -1 }).toArray();
  return tripDocs.map(mapDocumentToTrip);
}


export async function uploadTransferProof(tripId: string, imageUrl: string): Promise<{ success: boolean; message: string }> {
  const currentTrip = await getTripById(tripId); // This handles both ObjectId and string ID
  if (!currentTrip || !currentTrip._id) {
      return { success: false, message: 'Trip not found or invalid Trip ID.' };
  }
  
  const tripsCollection = await getTripsCollection();
  const result = await tripsCollection.updateOne(
    { _id: new ObjectId(currentTrip._id) }, // Use the actual MongoDB _id for update
    { $set: { transferProofImageUrl: imageUrl, status: 'pending_payment' } } // Keep status as pending_payment or specific admin review status
  );

  if (result.matchedCount > 0) {
    console.log(`Admin Notification: Transfer proof uploaded for Trip ID: ${tripId}. Image URL: ${imageUrl}`);
    revalidatePath('/my-trips');
    revalidatePath(`/my-trips?tripId=${tripId}`); // Revalidate specific trip if on that page
    revalidatePath('/admin/trips');
    revalidatePath(`/admin/trips/${tripId}`);
    return { success: true, message: 'Transfer proof uploaded. Admin will verify shortly.' };
  }
  return { success: false, message: 'Failed to upload transfer proof.' };
}

export async function confirmPaymentByAdmin(tripId: string): Promise<{ success: boolean; message: string }> {
  const currentTrip = await getTripById(tripId);
  if (!currentTrip || !currentTrip._id) {
    return { success: false, message: 'Trip not found.' };
  }
  // Admin can confirm even if proof wasn't "required" by the system, e.g. cash payment.
  // if (currentTrip.status !== 'pending_payment' && !currentTrip.transferProofImageUrl) {
  //    return { success: false, message: 'Trip is not awaiting payment or no proof submitted.' };
  // }

  const tripsCollection = await getTripsCollection();
  const result = await tripsCollection.updateOne(
    { _id: new ObjectId(currentTrip._id) },
    { $set: { status: 'payment_confirmed' } }
  );

  if (result.matchedCount > 0) {
    revalidatePath('/my-trips');
    revalidatePath('/join-trip');
    revalidatePath('/admin/trips');
    revalidatePath(`/admin/trips/${tripId}`);
    console.log(`Admin Action: Payment confirmed for Trip ID: ${tripId}.`);
    // TODO: Send notification to user (e.g., via email if secondaryContact is email)
    return { success: true, message: 'Payment confirmed successfully.' };
  }
  return { success: false, message: 'Failed to confirm payment.' };
}


export async function getConfirmedTrips(): Promise<Trip[]> {
  const tripsCollection = await getTripsCollection();
  const confirmedTripDocs = await tripsCollection.find({
    status: 'payment_confirmed',
    date: { $gte: format(new Date(), "yyyy-MM-dd") } // Ensure date is today or in future
  }).sort({ date: 1, time: 1 }).toArray();
  return confirmedTripDocs.map(mapDocumentToTrip);
}


const joinTripSchema = z.object({
  tripId: z.string().min(1),
  name: z.string().min(1, "Name is required."),
  phone: z.string().min(1, "Phone is required.").regex(/^\+?[0-9\s-]{10,15}$/, "Invalid phone number format."),
  numberOfPeople: z.number().min(1, "At least one person is required."),
  address: z.string().min(1, "Address is required for pickup/dropoff coordination."), // Participant's pickup/dropoff
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

  const trip = await getTripById(data.tripId);

  if (!trip || !trip._id) {
    return { success: false, message: 'Trip not found or no longer available.' };
  }
  if (trip.status !== 'payment_confirmed') {
    return { success: false, message: 'This trip is not confirmed or available for joining.' };
  }

  const itinerary = await getItineraryFromDb(trip.itineraryId);
  if (!itinerary) {
    return { success: false, message: 'Itinerary details for this trip are missing.' };
  }

  // Calculate price for this participant (could be 0 if admin handles payment or main booker covers)
  // For simplicity now, pricePaid for participant is 0. Admin can coordinate payment.
  // More complex: calculate individual share based on itinerary.pricePerPerson * data.numberOfPeople and apply discount.
  const participantPrice = 0; 
  // const participantPrice = await calculateTotalPrice(itinerary, data.numberOfPeople, undefined, undefined, data.discountCode);


  const newParticipant: Participant = {
    id: `participant_${new ObjectId().toString()}`, // Unique ID for participant
    name: data.name,
    phone: data.phone,
    numberOfPeople: data.numberOfPeople,
    address: data.address,
    discountCode: data.discountCode, // Store for record, actual discount applied to main trip or handled by admin
    notes: data.notes,
    pricePaid: participantPrice, 
  };

  const tripsCollection = await getTripsCollection();
  const result = await tripsCollection.updateOne(
    { _id: new ObjectId(trip._id) },
    { $push: { participants: newParticipant } }
  );

  if (result.matchedCount > 0) {
    revalidatePath('/my-trips'); // User might see this trip if they join
    revalidatePath(`/join-trip`);
    revalidatePath('/admin/trips'); // Admin sees updated participant list
    revalidatePath(`/admin/trips/${trip.id}`);
    // TODO: Notify trip creator and admin about the new participant
    return { success: true, message: `Successfully requested to join trip ${trip.itineraryName}! The trip organizer or admin will contact you regarding payment and confirmation.` };
  }
  return { success: false, message: 'Failed to join trip.' };
}

export async function getTripsForUserFeedback(userIdentifier: string): Promise<{id: string, name: string}[]> {
    if (!userIdentifier) return [];
    const tripsCollection = await getTripsCollection();
    // Fetch trips where the user is the creator or a participant, and trip is completed or confirmed
    const userTripDocs = await tripsCollection.find({
      $and: [
        { $or: [{ contactPhone: userIdentifier }, { 'participants.phone': userIdentifier }] },
        { $or: [{ status: 'completed' }, { status: 'payment_confirmed' }] }
      ]
    }).sort({ date: -1 }).toArray();
    
    return userTripDocs.map(trip => ({
        id: trip.id, // Use the string ID
        name: `${trip.itineraryName} on ${format(new Date(trip.date), "MMM dd, yyyy")}`
    }));
}

// Admin action to get all trips (already exists, can be used by admin trip management page)
// export async function getAllTrips(): Promise<Trip[]> - defined above
