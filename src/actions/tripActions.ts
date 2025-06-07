'use server';

import { getTripsCollection, getItinerariesCollection, getDiscountCodesCollection, getDistrictSurchargesCollection, getAdditionalServicesCollection } from '@/lib/mongodb';
import type { CreateTripFormValues, Itinerary, Trip, Participant, JoinTripFormValues, DiscountCode, DistrictSurcharge, AdditionalService } from '@/lib/types';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { format, addWeeks, isBefore } from 'date-fns';

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
    const serviceObjectIds = serviceIds.filter(id => ObjectId.isValid(id)).map(id => new ObjectId(id));
    const services = await additionalServicesCol.find({ _id: { $in: serviceObjectIds } }).toArray();
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

export async function getItineraryDetailsForCalculation(itineraryId: string, districtName?: string): Promise<{ pricePerPerson: number; districtSurchargeAmount: number } | null> {
  const itinerariesCollection = await getItinerariesCollection();
  const districtSurchargesCol = await getDistrictSurchargesCollection();

  let itineraryDoc;
  if (ObjectId.isValid(itineraryId)) {
    itineraryDoc = await itinerariesCollection.findOne({ _id: new ObjectId(itineraryId) });
  } else {
    itineraryDoc = await itinerariesCollection.findOne({ id: itineraryId });
  }

  if (!itineraryDoc) {
    return null;
  }

  let districtSurchargeAmount = 0;
  if (districtName) {
    const districtSurcharge = await districtSurchargesCol.findOne({ districtName: districtName });
    if (districtSurcharge) {
      districtSurchargeAmount = districtSurcharge.surchargeAmount;
    }
  }

  return {
    pricePerPerson: itineraryDoc.pricePerPerson,
    districtSurchargeAmount: districtSurchargeAmount,
  };
}

const createTripSchema = z.object({
  itineraryId: z.string().min(1, "Itinerary is required."),
  date: z.string()
    .min(1, "Date is required.")
    .refine((dateString) => {
      const selectedDate = new Date(dateString);
      const minDate = addWeeks(new Date(), 1); // Current date + 1 week
      // Set hours, minutes, seconds, milliseconds to 0 for accurate date comparison
      selectedDate.setHours(0, 0, 0, 0);
      minDate.setHours(0, 0, 0, 0);

      return !isBefore(selectedDate, minDate);
    }, "Date must be at least one week from today."), // Add date validation
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
    numberOfPeople: Number(values.numberOfPeople),
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
    date: data.date,
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
    creatorUserId: data.contactPhone,
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
      if (data.discountCode) {
        const discountCodesCol = await getDiscountCodesCollection();
        await discountCodesCol.updateOne({ code: data.discountCode.toUpperCase() }, { $inc: { timesUsed: 1 } });
      }
      revalidatePath('/my-trips');
      revalidatePath('/admin/trips');
      return { success: true, message: 'Trip created successfully! Please proceed to payment.', tripId: newTripObjectId.toString() };
    }
    return { success: false, message: 'Failed to create trip.' };
  } catch (error) {
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
  const currentTrip = await getTripById(tripId);
  if (!currentTrip || !currentTrip._id) {
    return { success: false, message: 'Trip not found or invalid Trip ID.' };
  }
  if (!imageUrl) {
    return { success: false, message: 'Image URL is required.' };
  }

  const tripsCollection = await getTripsCollection();
  const result = await tripsCollection.updateOne(
    { _id: new ObjectId(currentTrip._id) },
    { $set: { transferProofImageUrl: imageUrl, status: 'pending_payment' } }
  );

  if (result.matchedCount > 0) {
    console.log(`Admin Notification: Transfer proof uploaded for Trip ID: ${tripId}. Image URL: ${imageUrl}`);
    revalidatePath('/my-trips');
    revalidatePath(`/my-trips?tripId=${tripId}`);
    revalidatePath('/admin/trips');
    revalidatePath(`/admin/trips/${tripId}`);
    return { success: true, message: 'Transfer proof uploaded. Admin will verify shortly.' };
  }
  return { success: false, message: 'Failed to update trip with transfer proof.' };
}

export async function confirmMainBookerPayment(tripId: string): Promise<{ success: boolean; message: string }> {
  const currentTrip = await getTripById(tripId);
  if (!currentTrip || !currentTrip._id) {
    return { success: false, message: 'Trip not found.' };
  }

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
    console.log(`Admin Action: Main booker payment confirmed for Trip ID: ${tripId}.`);
    return { success: true, message: 'Main booker payment confirmed and trip updated.' };
  }
  return { success: false, message: 'Failed to confirm main booker payment.' };
}

export async function confirmParticipantPayment(tripId: string, participantId: string): Promise<{ success: boolean; message: string }> {
  const tripsCollection = await getTripsCollection();
  const result = await tripsCollection.updateOne(
    { _id: new ObjectId(tripId), 'participants.id': participantId },
    { $set: { 'participants.$.status': 'payment_confirmed' } }
  );

  if (result.matchedCount > 0 && result.modifiedCount > 0) {
    revalidatePath('/my-trips');
    revalidatePath('/join-trip');
    revalidatePath('/admin/trips');
    revalidatePath(`/admin/trips/${tripId}`);
    console.log(`Admin Action: Payment confirmed for participant ${participantId} in Trip ID: ${tripId}.`);
    return { success: true, message: 'Participant payment confirmed and trip updated.' };
  }
  return { success: false, message: 'Failed to confirm participant payment or participant not found.' };
}

export async function getConfirmedTrips(): Promise<Trip[]> {
  const tripsCollection = await getTripsCollection();
  const confirmedTripDocs = await tripsCollection.find({
    status: 'payment_confirmed',
    date: { $gte: format(new Date(), "yyyy-MM-dd") }
  }).sort({ date: 1, time: 1 }).toArray();
  return confirmedTripDocs.map(mapDocumentToTrip);
}


const joinTripSchema = z.object({
  tripId: z.string().min(1, "Trip ID is required."),
  name: z.string().min(2, "Name must be at least 2 characters.").max(100),
  phone: z.string().regex(/^\+?[0-9\s-]{10,15}$/, "Invalid phone number format."),
  numberOfPeople: z.coerce.number().min(1, "At least one person is required.").max(10, "Max 10 people to join."),
  address: z.string().min(5, "Address must be at least 5 characters.").max(200),
  discountCode: z.string().optional(),
  notes: z.string().max(500, "Notes cannot exceed 500 characters.").optional(),
  district: z.string().optional(),
  pricePaid: z.number().min(0, "Price paid cannot be negative."), // Ensure this is passed from client
});

export async function joinTrip(values: JoinTripFormValues): Promise<{ success: boolean; message: string }> {
  const validation = joinTripSchema.safeParse(values);

  if (!validation.success) {
    return { success: false, message: validation.error.errors.map(e => e.message).join(', ') };
  }

  const data = validation.data;

  const tripsCollection = await getTripsCollection();
  const currentTrip = await getTripById(data.tripId);

  if (!currentTrip || !currentTrip._id) {
    return { success: false, message: 'Trip not found.' };
  }

  const newParticipant: Participant = {
    id: new ObjectId().toString(),
    name: data.name,
    phone: data.phone,
    numberOfPeople: data.numberOfPeople,
    address: data.address,
    discountCode: data.discountCode,
    notes: data.notes,
    district: data.district,
    pricePaid: data.pricePaid, // Use pricePaid from client
    status: 'pending_payment', // Set initial status for new participant
  };

  try {
    const result = await tripsCollection.updateOne(
      { _id: new ObjectId(currentTrip._id) },
      { $push: { participants: newParticipant }, $inc: { totalPrice: data.pricePaid } }
    );

    if (result.matchedCount > 0) {
      revalidatePath('/my-trips');
      revalidatePath(`/my-trips?phone=${data.phone}`);
      revalidatePath('/admin/trips');
      revalidatePath(`/admin/trips/${data.tripId}`);
      return { success: true, message: 'Successfully joined the trip! Your payment is pending verification.' };
    }
    return { success: false, message: 'Failed to join the trip.' };
  } catch (error) {
    console.error("Error joining trip:", error);
    return { success: false, message: 'An unexpected error occurred while joining the trip.' };
  }
}

export async function getTripsForUserFeedback(userIdentifier: string): Promise<{ id: string, name: string }[]> {
  if (!userIdentifier) return [];
  const tripsCollection = await getTripsCollection();
  const userTripDocs = await tripsCollection.find({
    $and: [
      { $or: [{ contactPhone: userIdentifier }, { 'participants.phone': userIdentifier }] },
      { $or: [{ status: 'completed' }, { status: 'payment_confirmed' }] }
    ]
  }).sort({ date: -1 }).toArray();

  return userTripDocs.map(trip => ({
    id: trip.id,
    name: `${trip.itineraryName} on ${format(new Date(trip.date), "MMM dd, yyyy")}`
  }));
}

export async function deleteTrip(tripId: string): Promise<{ success: boolean; message: string }> {
  const tripsCollection = await getTripsCollection();
  const result = await tripsCollection.deleteOne({ _id: new ObjectId(tripId) });

  if (result.deletedCount > 0) {
    revalidatePath('/my-trips');
    revalidatePath('/admin/trips');
    return { success: true, message: 'Trip deleted successfully.' };
  }
  return { success: false, message: 'Failed to delete trip.' };
}
