'use server';

import { getTripsCollection, getItinerariesCollection, getDiscountCodesCollection, getDistrictSurchargesCollection, getAdditionalServicesCollection } from '@/lib/mongodb';
import type { CreateTripFormValues, Itinerary, Trip, Participant, JoinTripFormValues, DiscountCode, DistrictSurcharge, AdditionalService, TripStatus } from '@/lib/types';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { format, addWeeks, isBefore } from 'date-fns';
import { verifyAdminToken } from './adminAuthActions';
import redis from '@/lib/redis';

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
      id: p.id ? p.id.toString() : '',
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
      confirmedBy: p.confirmedBy,
      confirmedAt: p.confirmedAt,
      isDeleted: p.isDeleted || false,
    };
  }));

  // For older documents where main booker's proof might be at root level, move it to the first participant if needed
  if (doc.transferProofImageUrl && doc.transferProofImageUrl.trim() !== '' && populatedParticipants.length > 0 && !populatedParticipants[0].transferProofImageUrl) {
    populatedParticipants[0].transferProofImageUrl = doc.transferProofImageUrl;
  }

  const { _id, ...restOfDoc } = doc;

  const partialTrip: Omit<Trip, 'overallStatus'> = {
    id: doc.id,
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
    handoverComment: restOfDoc.handoverComment || '',
    isDeleted: restOfDoc.isDeleted || false,
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

// Helper function to generate sequential booking ID
async function generateSequentialBookingId(date: Date): Promise<string> {
  const tripsCollection = await getTripsCollection();
  const dateStr = format(date, 'yyyy_MM_dd');

  // Find the last booking ID for today
  const lastBooking = await tripsCollection
    .find({ id: { $regex: `^${dateStr}_` } })
    .sort({ id: -1 })
    .limit(1)
    .toArray();

  let sequence = 1;
  if (lastBooking.length > 0) {
    const lastId = lastBooking[0].id;
    const lastSequence = parseInt(lastId.split('_')[3]);
    sequence = lastSequence + 1;
  }

  // Format sequence number with leading zeros
  const sequenceStr = sequence.toString().padStart(4, '0');
  return `${dateStr}_${sequenceStr}`;
}

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
  const bookingDate = new Date(data.date);
  const bookingId = await generateSequentialBookingId(bookingDate);

  const newTrip: Trip = {
    _id: newTripObjectId,
    id: bookingId,
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
    id: `${bookingId}_P1`,
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
    const result = await tripsCollection.insertOne(newTrip);
    await redis.keys('trips:*').then(keys => keys.length && redis.del(...keys));

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
  }, {
    projection: {
      _id: 1,
      id: 1,
      itineraryId: 1,
      itineraryName: 1,
      itineraryType: 1,
      date: 1,
      time: 1,
      numberOfPeople: 1,
      pickupAddress: 1,
      dropoffAddress: 1,
      contactName: 1,
      contactPhone: 1,
      secondaryContact: 1,
      notes: 1,
      status: 1,
      creatorUserId: 1,
      participants: 1,
      totalPrice: 1,
      district: 1,
      additionalServiceIds: 1,
      discountCode: 1,
      createdAt: 1,
      handoverComment: 1,
      isDeleted: 1,
    }
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray();
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

  // Lấy thông tin admin xác nhận
  const admin = await verifyAdminToken();
  const confirmedBy = admin.isAuthenticated && admin.username ? admin.username : 'Unknown Admin';
  const confirmedAt = new Date().toISOString();

  const result = await tripsCollection.updateOne(
    { id: tripId }, // Use id for trip
    {
      $set: {
        "participants.0.status": "payment_confirmed",
        "participants.0.confirmedBy": confirmedBy,
        "participants.0.confirmedAt": confirmedAt,
        overallStatus: getOverallTripStatus({ ...currentTrip, participants: [{ ...currentTrip.participants[0], status: 'payment_confirmed' }] })
      }
    }
  );

  if (result.matchedCount === 0) {
    return { success: false, message: "Failed to confirm main booker payment." };
  }

  revalidatePath('/my-trips');
  revalidatePath('/admin/trips');
  return { success: true, message: "主预订人付款已确认成功！" };
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

  // Lấy thông tin admin xác nhận
  const admin = await verifyAdminToken();
  const confirmedBy = admin.isAuthenticated && admin.username ? admin.username : 'Unknown Admin';
  const confirmedAt = new Date().toISOString();

  const result = await tripsCollection.updateOne(
    { id: tripId, "participants.id": participantId }, // Use id for trip and participant id
    {
      $set: {
        [`participants.${participantIndex}.status`]: "payment_confirmed",
        [`participants.${participantIndex}.confirmedBy`]: confirmedBy,
        [`participants.${participantIndex}.confirmedAt`]: confirmedAt,
        overallStatus: getOverallTripStatus({ ...currentTrip, participants: currentTrip.participants.map((p, idx) => idx === participantIndex ? { ...p, status: 'payment_confirmed' } : p) })
      }
    }
  );

  if (result.matchedCount === 0) {
    return { success: false, message: "确认参与者付款失败。" };
  }

  revalidatePath('/my-trips');
  revalidatePath('/admin/trips');
  return { success: true, message: "参与者付款已确认成功！" };
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
  tripId: z.string().min(1, "行程ID是必需的。"),
  name: z.string().min(2, "姓名必须至少有2个字符。").max(100),
  phone: z.string().regex(/^\+?[0-9\s-]{10,15}$/, "无效的电话号码格式。"),
  numberOfPeople: z.coerce.number().min(1, "至少需要一个人。").max(10, "最多只能加入10人。"),
  address: z.string().min(5, "地址必须至少有5个字符。").max(200),
  discountCode: z.string().optional(),
  notes: z.string().max(500, "备注不能超过500个字符。").optional(),
  district: z.string().optional(),
  pricePaid: z.number().min(0, "付款金额不能为负。"), // Ensure this is passed from client
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

  // Generate participant ID based on trip ID and participant count
  const participantNumber = currentTrip.participants.length + 1;
  const participantId = `${currentTrip.id}_P${participantNumber}`;

  const newParticipant: Participant = {
    id: participantId,
    name: data.name,
    phone: data.phone,
    numberOfPeople: data.numberOfPeople,
    address: data.address,
    additionalServiceIds: data.additionalServiceIds || [],
    discountCodeString: data.discountCode || undefined,
    discountCode: populatedDiscountCode,
    notes: data.notes,
    district: data.district,
    pricePaid: data.pricePaid,
    status: 'pending_payment',
    transferProofImageUrl: undefined,
  };

  try {
    const result = await tripsCollection.updateOne(
      { id: currentTrip.id },
      { $push: { participants: newParticipant }, $inc: { totalPrice: data.pricePaid } }
    );

    if (result.matchedCount > 0) {
      revalidatePath('/my-trips');
      revalidatePath(`/my-trips?phone=${data.phone}`);
      revalidatePath('/admin/trips');
      revalidatePath(`/admin/trips/${data.tripId}`);
      return { success: true, message: '成功加入行程！您的付款正在等待验证。' };
    }
    return { success: false, message: '加入行程失败。' };
  } catch (error) {
    console.error("加入行程时出错:", error);
    return { success: false, message: '加入行程时发生意外错误。' };
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

export async function deleteTrip(tripId: string, currentUser: { id: string, username: string, role: 'admin' | 'staff' }): Promise<{ success: boolean; message: string }> {
  const tripsCollection = await getTripsCollection();
  const trip = await tripsCollection.findOne({ id: tripId });
  if (!trip) {
    return { success: false, message: '行程未找到。' };
  }
  // Nếu đã xác nhận chuyển khoản, chỉ admin mới được xóa
  const isConfirmed = trip.status === 'payment_confirmed' || trip.overallStatus === 'payment_confirmed';
  if (isConfirmed && currentUser.role !== 'admin') {
    return { success: false, message: '只有管理员才能删除已确认的行程。' };
  }
  // Nếu đã bị xóa rồi
  if (trip.isDeleted) {
    return { success: false, message: '行程已删除。' };
  }
  const now = new Date().toISOString();
  const result = await tripsCollection.updateOne(
    { id: tripId },
    { $set: { isDeleted: true, deletedAt: now, deletedBy: currentUser.username } }
  );
  await redis.keys('trips:*').then(keys => keys.length && redis.del(...keys));
  if (result.modifiedCount > 0) {
    revalidatePath('/my-trips');
    revalidatePath('/admin/trips');
    revalidatePath('/admin/trips/deleted');
    return { success: true, message: '行程已成功软删除。' };
  }
  return { success: false, message: '删除行程失败。' };
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

// Hàm tính trạng thái tổng giống UI
function calcOverallStatus(trip: any): string {
  const participants = Array.isArray(trip.participants) ? trip.participants : [];
  if (participants.length === 0) return trip.status || 'pending_payment';
  if (participants.some((p: any) => p.status === 'cancelled')) return 'cancelled';
  if (participants.some((p: any) => p.status === 'pending_payment')) return 'pending_payment';
  if (participants.every((p: any) => p.status === 'payment_confirmed' || p.status === 'completed')) {
    const tripDate = new Date(trip.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (tripDate < today) return 'completed';
    return 'payment_confirmed';
  }
  return trip.status || 'pending_payment';
}

export async function getTripsPaginated(limit: number, skip: number, searchTerm?: string, statusFilter?: string): Promise<any[]> {
  const cacheKey = `trips:${limit}:${skip}:${searchTerm || ''}:${statusFilter || ''}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const tripsCollection = await getTripsCollection();
  const filter: any = { isDeleted: { $ne: true } };
  if (searchTerm && searchTerm.trim() !== '') {
    const regex = new RegExp(searchTerm, 'i');
    filter.$or = [
      { id: regex },
      { _id: { $regex: regex } },
      { contactName: regex },
      { contactPhone: regex },
      { itineraryName: regex },
    ];
  }
  if (statusFilter === 'pending_payment' || statusFilter === 'payment_confirmed') {
    filter['overallStatus'] = statusFilter;
  }
  const tripDocs = await tripsCollection.find(filter, {
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
      overallStatus: 1,
    }
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
  const result = tripDocs.map(doc => {
    const participants = Array.isArray(doc.participants) ? doc.participants : [];
    const participantsCount = participants.length;
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
      overallStatus: doc.overallStatus,
      createdAt: doc.createdAt,
    };
  });
  await redis.set(cacheKey, JSON.stringify(result), 'EX', 30);
  return result;
}

export async function getTripsCount(searchTerm?: string, statusFilter?: string): Promise<number> {
  const tripsCollection = await getTripsCollection();
  const filter: any = { isDeleted: { $ne: true } };
  if (searchTerm && searchTerm.trim() !== '') {
    const regex = new RegExp(searchTerm, 'i');
    filter.$or = [
      { id: regex },
      { _id: { $regex: regex } },
      { contactName: regex },
      { contactPhone: regex },
      { itineraryName: regex },
    ];
  }
  if (statusFilter === 'pending_payment' || statusFilter === 'payment_confirmed') {
    filter['overallStatus'] = statusFilter;
  }
  return await tripsCollection.countDocuments(filter);
}

export async function updateTripComment(tripId: string, comment: string): Promise<{ success: boolean; message: string }> {
  const tripsCollection = await getTripsCollection();
  const result = await tripsCollection.updateOne(
    { id: tripId },
    { $set: { handoverComment: comment, updatedAt: new Date().toISOString() } }
  );
  if (result.matchedCount === 0) {
    return { success: false, message: 'Trip not found.' };
  }
  revalidatePath('/admin/trips');
  revalidatePath(`/admin/trips/${tripId}`);
  return { success: true, message: 'Comment updated successfully.' };
}

// Returns all participants who have uploaded a transfer proof but are still pending payment
export async function getParticipantsWithProofNotConfirmed() {
  const tripsCollection = await getTripsCollection();
  const tripDocs = await tripsCollection.find({ isDeleted: { $ne: true } }).toArray();
  const result: Array<{
    tripId: string;
    itineraryName: string;
    participantId: string;
    name: string;
    phone: string;
    pricePaid: number;
    transferProofImageUrl: string;
    isMainBooker: boolean;
  }> = [];
  for (const trip of tripDocs) {
    if (!Array.isArray(trip.participants)) continue;
    for (let i = 0; i < trip.participants.length; i++) {
      const p = trip.participants[i];
      if (
        p.status === 'pending_payment' &&
        p.transferProofImageUrl &&
        p.transferProofImageUrl.trim() !== ''
      ) {
        result.push({
          tripId: trip.id || trip._id?.toString(),
          itineraryName: trip.itineraryName,
          participantId: p.id,
          name: p.name,
          phone: p.phone,
          pricePaid: p.pricePaid,
          transferProofImageUrl: p.transferProofImageUrl,
          isMainBooker: i === 0,
        });
      }
    }
  }
  return result;
}

// Returns all participants who are still pending payment and have NOT uploaded a transfer proof
export async function getParticipantsNotPaid() {
  const tripsCollection = await getTripsCollection();
  const tripDocs = await tripsCollection.find({ isDeleted: { $ne: true } }).toArray();
  const result: Array<{
    tripId: string;
    itineraryName: string;
    participantId: string;
    name: string;
    phone: string;
    isMainBooker: boolean;
  }> = [];
  for (const trip of tripDocs) {
    if (!Array.isArray(trip.participants)) continue;
    for (let i = 0; i < trip.participants.length; i++) {
      const p = trip.participants[i];
      if (
        p.status === 'pending_payment' &&
        (!p.transferProofImageUrl || p.transferProofImageUrl.trim() === '')
      ) {
        result.push({
          tripId: trip.id || trip._id?.toString(),
          itineraryName: trip.itineraryName,
          participantId: p.id,
          name: p.name,
          phone: p.phone,
          isMainBooker: i === 0,
        });
      }
    }
  }
  return result;
}

export async function getJoinableTripsPaginated(limit: number, skip: number, searchTerm?: string, typeFilter?: string): Promise<{ trips: Trip[], total: number }> {
  const tripsCollection = await getTripsCollection();
  const filter: any = {
    isDeleted: { $ne: true },
    overallStatus: 'payment_confirmed'
  };

  if (searchTerm && searchTerm.trim() !== '') {
    const regex = new RegExp(searchTerm, 'i');
    filter.$or = [
      { itineraryName: regex },
      { date: regex },
      { pickupAddress: regex },
      { dropoffAddress: regex },
      { contactName: regex }
    ];
  }

  if (typeFilter) {
    filter.itineraryType = typeFilter;
  }

  const total = await tripsCollection.countDocuments(filter);
  const tripDocs = await tripsCollection.find(filter, {
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
      overallStatus: 1,
    }
  })
    .sort({ date: 1, time: 1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  // Không gọi mapDocumentToTrip nữa!
  // Chỉ map sang Trip đơn giản (nếu cần)
  const trips = tripDocs.map(doc => ({
    id: doc.id,
    itineraryId: doc.itineraryId || '',
    itineraryName: doc.itineraryName,
    itineraryType: doc.itineraryType,
    date: doc.date,
    time: doc.time,
    numberOfPeople: doc.numberOfPeople || 0,
    pickupAddress: doc.pickupAddress || '',
    dropoffAddress: doc.dropoffAddress || '',
    contactName: doc.contactName,
    contactPhone: doc.contactPhone,
    secondaryContact: doc.secondaryContact || '',
    notes: doc.notes || '',
    status: doc.status,
    creatorUserId: doc.creatorUserId || '',
    participants: doc.participants || [],
    totalPrice: doc.totalPrice || 0,
    district: doc.district || '',
    additionalServiceIds: doc.additionalServiceIds || [],
    discountCode: doc.discountCode || '',
    createdAt: doc.createdAt,
    overallStatus: doc.overallStatus,
    isDeleted: doc.isDeleted || false,
    handoverComment: doc.handoverComment || '',
  }));

  return { trips, total };
}

// Lấy danh sách joinable trips summary (nhẹ, chỉ trả về trường cơ bản)
export async function getJoinableTripSummaryList(limit: number = 20): Promise<Array<{
  id: string;
  itineraryName: string;
  itineraryType: string;
  date: string;
  time: string;
  contactName: string;
  totalPrice: number;
  participantsCount: number;
  overallStatus: string;
  createdAt: string;
}>> {
  const tripsCollection = await getTripsCollection();
  const filter: any = {
    isDeleted: { $ne: true },
  };
  const tripDocs = await tripsCollection.find(filter, {
    projection: {
      id: 1,
      itineraryName: 1,
      itineraryType: 1,
      date: 1,
      time: 1,
      contactName: 1,
      totalPrice: 1,
      participants: 1,
      overallStatus: 1,
      createdAt: 1,
    }
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
  return tripDocs.map(doc => ({
    id: doc.id,
    itineraryName: doc.itineraryName,
    itineraryType: doc.itineraryType,
    date: doc.date,
    time: doc.time,
    contactName: doc.contactName,
    totalPrice: doc.totalPrice,
    participantsCount: Array.isArray(doc.participants) ? doc.participants.length : 0,
    overallStatus: doc.overallStatus,
    createdAt: doc.createdAt,
  }));
}

// --- Chat-like comments for trips ---

/**
 * Get all comments for a trip (for chat-like notes)
 */
export async function getTripComments(tripId: string): Promise<Array<{comment: string, username: string, createdAt: string}>> {
  const tripsCollection = await getTripsCollection();
  const trip = await tripsCollection.findOne({ id: tripId });
  if (!trip) return [];
  // Migrate from handoverComment if needed
  if (!(trip as any).comments && (trip as any).handoverComment) {
    const migrated = [{ comment: (trip as any).handoverComment, username: '系统', createdAt: (trip as any).updatedAt || (trip as any).createdAt || new Date().toISOString() }];
    await tripsCollection.updateOne({ id: tripId }, { $set: { comments: migrated, updatedAt: new Date().toISOString() } });
    return migrated;
  }
  return (trip as any).comments || [];
}

/**
 * Add a new comment to a trip
 */
export async function addTripComment(tripId: string, comment: string, username: string): Promise<{ success: boolean; message: string; comments?: any[] }> {
  if (!comment.trim() || !username) return { success: false, message: '缺少内容或用户名' };
  const tripsCollection = await getTripsCollection();
  const newComment = { comment, username, createdAt: new Date().toISOString() };
  const result = await tripsCollection.updateOne(
    { id: tripId },
    { $push: { comments: newComment }, $set: { updatedAt: new Date().toISOString() } }
  );
  if (result.matchedCount === 0) return { success: false, message: 'Trip not found.' };
  const trip = await tripsCollection.findOne({ id: tripId });
  return { success: true, message: '评论已添加', comments: (trip as any)?.comments || [] };
}
