'use server';

import { getTripsCollection, getItinerariesCollection, getDiscountCodesCollection, getDistrictSurchargesCollection, getAdditionalServicesCollection } from '@/lib/mongodb';
import type { CreateTripFormValues, Itinerary, Trip, Participant, JoinTripFormValues, DiscountCode, DistrictSurcharge, AdditionalService, TripStatus } from '@/lib/types';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { format, addWeeks, isBefore } from 'date-fns';

// Helper to map MongoDB document to Trip type
async function mapDocumentToTrip(doc: any): Promise<Trip> {
  if (!doc) return null as any;

  const populatedParticipants = await Promise.all(doc.participants.map(async (p: any) => {
    let populatedAdditionalServices: AdditionalService[] = [];
    if (p.additionalServiceIds && p.additionalServiceIds.length > 0) {
      const additionalServicesCol = await getAdditionalServicesCollection();
      const serviceObjectIds = p.additionalServiceIds.filter((id: string) => ObjectId.isValid(id)).map((id: string) => new ObjectId(id));
      populatedAdditionalServices = await additionalServicesCol.find({ _id: { $in: serviceObjectIds } }).toArray();
    }

    let populatedDiscountCode: DiscountCode | undefined;
    if (p.discountCodeString) {
      populatedDiscountCode = await getDiscountFromDb(p.discountCodeString);
    }

    return {
      id: p.id ? p.id.toString() : new ObjectId().toString(),
      name: p.name,
      phone: p.phone,
      numberOfPeople: p.numberOfPeople,
      address: p.address,
      email: p.email,
      dob: p.dob,
      identityNumber: p.identityNumber,
      additionalServiceIds: p.additionalServiceIds || [],
      additionalServices: populatedAdditionalServices,
      discountCodeString: p.discountCodeString,
      discountCode: populatedDiscountCode,
      notes: p.notes,
      pricePaid: p.pricePaid,
      district: p.district,
      status: p.status || 'pending_payment',
      transferProofImageUrl: p.transferProofImageUrl && p.transferProofImageUrl.trim() !== '' ? p.transferProofImageUrl : undefined,
    };
  }));

  // For older documents where main booker's proof might be at root level, move it to the first participant if needed
  if (doc.transferProofImageUrl && doc.transferProofImageUrl.trim() !== '' && populatedParticipants.length > 0 && !populatedParticipants[0].transferProofImageUrl) {
    populatedParticipants[0].transferProofImageUrl = doc.transferProofImageUrl;
  }

  const { _id, ...restOfDoc } = doc;

  const partialTrip: Omit<Trip, 'overallStatus'> = {
    id: _id.toString(),
    itineraryId: restOfDoc.itineraryId ? restOfDoc.itineraryId.toString() : '',
    itineraryName: restOfDoc.itineraryName,
    itineraryType: restOfDoc.itineraryType,
    date: restOfDoc.date,
    time: restOfDoc.time,
    numberOfPeople: restOfDoc.numberOfPeople,
    pickupAddress: restOfDoc.pickupAddress,
    dropoffAddress: restOfDoc.dropoffAddress,
    contactName: restOfDoc.contactName,
    contactPhone: restOfDoc.contactPhone,
    secondaryContact: restOfDoc.secondaryContact,
    notes: restOfDoc.notes,
    status: restOfDoc.status,
    creatorUserId: restOfDoc.creatorUserId,
    participants: populatedParticipants,
    totalPrice: restOfDoc.totalPrice,
    district: restOfDoc.district,
    additionalServiceIds: restOfDoc.additionalServiceIds || [],
    discountCode: restOfDoc.discountCode,
    createdAt: restOfDoc.createdAt,
  };

  // Populate additional services for the trip itself
  let tripPopulatedAdditionalServices: AdditionalService[] = [];
  if (restOfDoc.additionalServiceIds && restOfDoc.additionalServiceIds.length > 0) {
    const additionalServicesCol = await getAdditionalServicesCollection();
    const serviceObjectIds = restOfDoc.additionalServiceIds.filter((id: string) => ObjectId.isValid(id)).map((id: string) => new ObjectId(id));
    tripPopulatedAdditionalServices = await additionalServicesCol.find({ _id: { $in: serviceObjectIds } }).toArray();
  }

  const trip: Trip = {
    ...partialTrip,
    overallStatus: getOverallTripStatus(partialTrip as Trip),
    additionalServices: tripPopulatedAdditionalServices, // Assign populated services
  };

  return trip;
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

async function getDiscountFromDb(code?: string): Promise<DiscountCode | undefined> {
  if (!code) return undefined;
  const discountCodesCol = await getDiscountCodesCollection();
  const discount = await discountCodesCol.findOne({ code: code.toUpperCase(), isActive: true });
  return discount ? { ...discount, id: discount._id.toString() } as DiscountCode : undefined;
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

const getOverallTripStatus = (trip: Trip): TripStatus => {
  // Scenario 1: No participants array, or empty participants array (likely old data)
  if (!trip.participants || trip.participants.length === 0) {
    // If it's an old trip, and its 'status' is already confirmed or completed/cancelled, respect that.
    // Otherwise, assume it's pending payment by default if no participants.
    if (trip.status === 'payment_confirmed' || trip.status === 'completed' || trip.status === 'cancelled') {
      return trip.status;
    }
    // If it's an old trip and status is not confirmed/completed/cancelled, treat as pending.
    return 'pending_payment';
  }

  // Scenario 2: Participants exist, derive status from them.
  // Check for any cancelled participants first - high priority
  if (trip.participants.some(p => p.status === 'cancelled')) {
    return 'cancelled';
  }

  // If any participant is still pending payment
  if (trip.participants.some(p => p.status === 'pending_payment')) {
    return 'pending_payment';
  }

  // If all participants are confirmed (and not cancelled or pending)
  if (trip.participants.every(p => p.status === 'payment_confirmed' || p.status === 'completed')) {
    const tripDate = new Date(trip.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (tripDate < today) {
      return 'completed';
    }
    return 'payment_confirmed';
  }

  // Fallback for very unusual states, should ideally not be reached for new trips
  return trip.status;
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

  const tripsCollection = await getTripsCollection();
  const newTripObjectId = new ObjectId();

  const newTrip: Trip = {
    _id: newTripObjectId,
    id: newTripObjectId.toString(),
    itineraryId: data.itineraryId,
    itineraryName: itinerary.name,
    itineraryType: itinerary.type,
    date: new Date(data.date).toISOString(), // Store as ISO string
    time: data.time,
    numberOfPeople: data.numberOfPeople,
    pickupAddress: data.pickupAddress || '',
    dropoffAddress: data.dropoffAddress || '',
    contactName: data.contactName,
    contactPhone: data.contactPhone,
    secondaryContact: data.secondaryContact || '',
    notes: data.notes || '',
    status: 'pending_payment',
    creatorUserId: 'admin_placeholder_user_id', // Or actual admin user ID
    participants: [], // Initialize with empty array
    totalPrice: totalPrice,
    district: data.district || '',
    additionalServiceIds: data.additionalServiceIds || [],
    discountCode: data.discountCode, // Keep the string for consistency in storage
    createdAt: new Date().toISOString(),
    overallStatus: 'pending_payment',
  };

  // Add main booker as the first participant
  const populatedMainBookerDiscountCode = data.discountCode ? await getDiscountFromDb(data.discountCode) : undefined;
  const mainBookerParticipant: Participant = {
    id: new ObjectId().toString(),
    name: data.contactName,
    phone: data.contactPhone,
    numberOfPeople: data.numberOfPeople,
    address: data.pickupAddress || data.dropoffAddress || '',
    additionalServiceIds: data.additionalServiceIds || [],
    discountCodeString: data.discountCode || undefined,
    discountCode: populatedMainBookerDiscountCode,
    notes: data.notes || '',
    pricePaid: totalPrice,
    district: data.district || '',
    status: 'pending_payment',
    transferProofImageUrl: undefined,
  };
  newTrip.participants.push(mainBookerParticipant);

  try {
    await tripsCollection.insertOne(newTrip);

    // Increment usedCount for the discount code if it was used
    if (data.discountCode) {
      const discountCodesCollection = await getDiscountCodesCollection();
      await discountCodesCollection.updateOne(
        { code: data.discountCode.toUpperCase() },
        { $inc: { usedCount: 1 } }
      );
      revalidatePath('/admin/discounts'); // Revalidate the discounts page
    }

    revalidatePath('/admin/trips'); // Revalidate the trips list page
    revalidatePath(`/admin/trips/${newTrip.id}`); // Revalidate the newly created trip detail page

    return { success: true, message: 'Trip created successfully.', tripId: newTrip.id };
  } catch (error: any) {
    console.error('Error creating trip:', error);
    return { success: false, message: error.message || 'An error occurred while creating the trip.' };
  }
}

export async function getUserTrips(phone: string, name: string): Promise<Trip[]> {
  if (!phone || !name) return [];
  const tripsCollection = await getTripsCollection();
  const userTripDocs = await tripsCollection.find({
    $or: [
      { $and: [{ contactPhone: phone }, { contactName: name }] },
      { participants: { $elemMatch: { phone: phone, name: name } } }
    ]
  }).sort({ createdAt: -1 }).toArray();
  return await Promise.all(userTripDocs.map(mapDocumentToTrip));
}

export async function getTripById(tripId: string): Promise<Trip | null> {
  const tripsCollection = await getTripsCollection();
  let tripDoc;
  if (ObjectId.isValid(tripId)) {
    tripDoc = await tripsCollection.findOne({ _id: new ObjectId(tripId) });
  } else {
    tripDoc = await tripsCollection.findOne({ id: tripId });
  }
  return tripDoc ? await mapDocumentToTrip(tripDoc) : null;
}

export async function getAllTrips(): Promise<Trip[]> {
  const tripsCollection = await getTripsCollection();
  const tripDocs = await tripsCollection.find({}).sort({ createdAt: -1 }).toArray();
  return await Promise.all(tripDocs.map(mapDocumentToTrip));
}


export async function uploadTransferProof(tripId: string, imageUrl: string, participantId?: string): Promise<{ success: boolean; message: string }> {
  const tripsCollection = await getTripsCollection();
  // Find the trip first to ensure it exists
  const doc = await tripsCollection.findOne({ id: tripId });
  const currentTrip = doc ? await mapDocumentToTrip(doc) : null;

  if (!currentTrip) {
    return { success: false, message: "Trip not found." };
  }

  let updateQuery: any;

  if (participantId) {
    // Update a specific participant's transferProofImageUrl
    updateQuery = {
      $set: {
        "participants.$[elem].transferProofImageUrl": imageUrl,
        // "participants.$[elem].status": "payment_confirmed" // Remove automatic status update
      }
    };
    const result = await tripsCollection.updateOne(
      { id: tripId, "participants.id": participantId }, // Use id for trip and participant id
      updateQuery,
      { arrayFilters: [{ "elem.id": participantId }] }
    );

    if (result.matchedCount === 0) {
      return { success: false, message: "Participant not found in trip." };
    }
  } else {
    // Update the main booker's transferProofImageUrl (assuming first participant is main booker)
    // This directly updates the first participant's proof
    updateQuery = {
      $set: {
        "participants.0.transferProofImageUrl": imageUrl,
        // "participants.0.status": "payment_confirmed" // Remove automatic status update
      }
    };
    await tripsCollection.updateOne({ id: tripId }, updateQuery); // Use id for trip
  }

  revalidatePath('/my-trips');
  revalidatePath('/admin/trips');
  return { success: true, message: "Transfer proof uploaded successfully!" };
}

export async function confirmMainBookerPayment(tripId: string): Promise<{ success: boolean; message: string }> {
  const tripsCollection = await getTripsCollection();
  const doc = await tripsCollection.findOne({ id: tripId });
  const currentTrip = doc ? await mapDocumentToTrip(doc) : null;

  if (!currentTrip) {
    return { success: false, message: "Trip not found." };
  }

  // Assuming the main booker is always the first participant (index 0)
  if (currentTrip.participants.length === 0) {
    return { success: false, message: "No main booker participant found." };
  }

  // Check if status is already confirmed to avoid unnecessary updates
  if (currentTrip.participants[0].status === 'payment_confirmed') {
    return { success: true, message: "Main booker payment already confirmed." };
  }

  const result = await tripsCollection.updateOne(
    { id: tripId }, // Use id for trip
    { $set: { "participants.0.status": "payment_confirmed", overallStatus: getOverallTripStatus({ ...currentTrip, participants: [{ ...currentTrip.participants[0], status: 'payment_confirmed' }] }) } }
  );

  if (result.matchedCount === 0) {
    return { success: false, message: "Failed to confirm main booker payment." };
  }

  revalidatePath('/my-trips');
  revalidatePath('/admin/trips');
  return { success: true, message: "Main booker payment confirmed successfully!" };
}

export async function confirmParticipantPayment(tripId: string, participantId: string): Promise<{ success: boolean; message: string }> {
  const tripsCollection = await getTripsCollection();
  const doc = await tripsCollection.findOne({ id: tripId });
  const currentTrip = doc ? await mapDocumentToTrip(doc) : null;

  if (!currentTrip) {
    return { success: false, message: "Trip not found." };
  }

  const participantIndex = currentTrip.participants.findIndex(p => p.id === participantId);

  if (participantIndex === -1) {
    return { success: false, message: "Participant not found." };
  }

  if (currentTrip.participants[participantIndex].status === 'payment_confirmed') {
    return { success: true, message: "Participant payment already confirmed." };
  }

  const result = await tripsCollection.updateOne(
    { id: tripId, "participants.id": participantId }, // Use id for trip and participant id
    { $set: { [`participants.${participantIndex}.status`]: "payment_confirmed", overallStatus: getOverallTripStatus({ ...currentTrip, participants: currentTrip.participants.map((p, idx) => idx === participantIndex ? { ...p, status: 'payment_confirmed' } : p) }) } }
  );

  if (result.matchedCount === 0) {
    return { success: false, message: "Failed to confirm participant payment." };
  }

  revalidatePath('/my-trips');
  revalidatePath('/admin/trips');
  return { success: true, message: "Participant payment confirmed successfully!" };
}

export async function getConfirmedTrips(): Promise<Trip[]> {
  const tripsCollection = await getTripsCollection();
  const confirmedTripDocs = await tripsCollection.find({
    overallStatus: 'payment_confirmed',
  }).sort({ date: 1, time: 1 }).toArray();
  return await Promise.all(confirmedTripDocs.map(mapDocumentToTrip));
}

export async function getAllAvailableTrips(): Promise<Trip[]> {
  const tripsCollection = await getTripsCollection();
  const allTripDocs = await tripsCollection.find({}).sort({ date: 1, time: 1 }).toArray();
  return await Promise.all(allTripDocs.map(mapDocumentToTrip));
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
  additionalServiceIds: z.array(z.string()).optional(),
});

export async function joinTrip(values: JoinTripFormValues): Promise<{ success: boolean; message: string }> {
  const validation = joinTripSchema.safeParse(values);

  if (!validation.success) {
    return { success: false, message: validation.error.errors.map(e => e.message).join(', ') };
  }

  const data = validation.data;

  const tripsCollection = await getTripsCollection();
  const currentTrip = await getTripById(data.tripId);

  if (!currentTrip || !currentTrip.id) {
    return { success: false, message: 'Trip not found.' };
  }

  const populatedDiscountCode = data.discountCode ? await getDiscountFromDb(data.discountCode) : undefined;

  const newParticipant: Participant = {
    id: new ObjectId().toString(),
    name: data.name,
    phone: data.phone,
    numberOfPeople: data.numberOfPeople,
    address: data.address,
    additionalServiceIds: data.additionalServiceIds || [],
    discountCodeString: data.discountCode || undefined,
    discountCode: populatedDiscountCode,
    notes: data.notes,
    district: data.district,
    pricePaid: data.pricePaid, // Use pricePaid from client
    status: 'pending_payment', // Set initial status for new participant
  };

  try {
    const result = await tripsCollection.updateOne(
      { _id: new ObjectId(currentTrip.id) },
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
  const result = await tripsCollection.deleteOne({ id: tripId });

  if (result.deletedCount > 0) {
    revalidatePath('/my-trips');
    revalidatePath('/admin/trips');
    return { success: true, message: 'Trip deleted successfully.' };
  }
  return { success: false, message: 'Failed to delete trip.' };
}

export async function submitConfirmMainBookerPayment(tripId: string) {
  await confirmMainBookerPayment(tripId);
  revalidatePath(`/admin/trips/${tripId}`);
}

export async function submitConfirmParticipantPayment(tripId: string, participantId: string) {
  await confirmParticipantPayment(tripId, participantId);
  revalidatePath(`/admin/trips/${tripId}`);
}

export async function submitConfirmMainBookerPaymentFromList(tripId: string) {
  await confirmMainBookerPayment(tripId);
  revalidatePath('/admin/trips'); // Revalidate the list page
}

export async function submitConfirmParticipantPaymentFromList(tripId: string, participantId: string) {
  await confirmParticipantPayment(tripId, participantId);
  revalidatePath('/admin/trips'); // Revalidate the list page
}

// Get paginated trips with minimal fields for admin list
export async function getTripsPaginated(limit: number, skip: number): Promise<any[]> {
  const tripsCollection = await getTripsCollection();
  const tripDocs = await tripsCollection.find({}, {
    projection: {
      _id: 1,
      id: 1,
      itineraryName: 1,
      itineraryType: 1,
      date: 1,
      time: 1,
      contactName: 1,
      contactPhone: 1,
      totalPrice: 1,
      status: 1,
      participants: 1,
      createdAt: 1,
    }
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
  return tripDocs.map(doc => {
    const participants = Array.isArray(doc.participants) ? doc.participants : [];
    const participantsCount = participants.length;
    // overallStatus logic: nếu còn ai chưa thanh toán thì pending_payment, nếu tất cả đã thanh toán thì payment_confirmed, nếu qua ngày thì completed
    let overallStatus = 'pending_payment';
    if (participantsCount > 0) {
      if (participants.every((p: any) => p.status === 'payment_confirmed' || p.status === 'completed')) {
        const tripDate = new Date(doc.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (tripDate < today) {
          overallStatus = 'completed';
        } else {
          overallStatus = 'payment_confirmed';
        }
      }
    }
    return {
      id: doc.id || doc._id?.toString(),
      itineraryName: doc.itineraryName,
      itineraryType: doc.itineraryType,
      date: doc.date,
      time: doc.time,
      contactName: doc.contactName,
      contactPhone: doc.contactPhone,
      totalPrice: doc.totalPrice,
      status: doc.status,
      participantsCount,
      overallStatus,
      createdAt: doc.createdAt,
    };
  });
}
