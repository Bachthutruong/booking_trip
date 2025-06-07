'use server';

import { getItinerariesCollection } from '@/lib/mongodb';
import type { Itinerary, ItineraryFormValues } from '@/lib/types';
import { ObjectId } from 'mongodb';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Helper to convert MongoDB document to app's Itinerary type
function mapDocumentToItinerary(doc: any): Itinerary {
  if (!doc) return null as any;
  return {
    ...doc,
    id: doc._id.toString(),
    _id: doc._id, // Keep original _id if needed internally
  };
}

export async function getItineraries(): Promise<Itinerary[]> {
  const itinerariesCollection = await getItinerariesCollection();
  const itineraries = await itinerariesCollection.find({}).sort({ name: 1 }).toArray();
  return itineraries.map(mapDocumentToItinerary);
}

export async function getItineraryById(id: string): Promise<Itinerary | null> {
  const itinerariesCollection = await getItinerariesCollection();
  let itineraryDoc;
  if (ObjectId.isValid(id)) {
    itineraryDoc = await itinerariesCollection.findOne({ _id: new ObjectId(id) });
  } else {
    // Fallback for user-friendly ID if it's not an ObjectId
    itineraryDoc = await itinerariesCollection.findOne({ id: id });
  }
  return itineraryDoc ? mapDocumentToItinerary(itineraryDoc) : null;
}


// Admin actions for Itineraries
const itineraryFormSchema = z.object({
  name: z.string().min(3, "Name is required and must be at least 3 characters."),
  type: z.enum(['airport_pickup', 'airport_dropoff', 'tourism']),
  pricePerPerson: z.coerce.number().min(0, "Price must be a positive number."),
  description: z.string().min(10, "Description is required and must be at least 10 characters."),
  imageUrl: z.string().url("Must be a valid URL.").optional().or(z.literal('')),
  availableTimes: z.string().min(1, "Available times are required (comma-separated, e.g., 08:00,09:00).")
    .regex(/^(\d{2}:\d{2})(,\s*\d{2}:\d{2})*$/, "Times must be in HH:MM format, comma-separated."),
});

export async function createItinerary(values: ItineraryFormValues): Promise<{ success: boolean; message: string; itineraryId?: string }> {
  const validation = itineraryFormSchema.safeParse(values);
  if (!validation.success) {
    return { success: false, message: validation.error.errors.map(e => e.message).join(', ') };
  }
  const data = validation.data;

  const itinerariesCollection = await getItinerariesCollection();
  const newItineraryObjectId = new ObjectId();
  const newItinerary: Itinerary = {
    _id: newItineraryObjectId,
    id: newItineraryObjectId.toString(),
    name: data.name,
    type: data.type,
    pricePerPerson: data.pricePerPerson,
    description: data.description,
    imageUrl: data.imageUrl || `https://placehold.co/600x400.png?text=${encodeURIComponent(data.name.substring(0, 15))}`,
    availableTimes: data.availableTimes.split(',').map(t => t.trim()).filter(t => t),
  };

  try {
    await itinerariesCollection.insertOne(newItinerary as any);
    revalidatePath('/admin/itineraries');
    revalidatePath('/admin/itineraries/new');
    revalidatePath(`/admin/itineraries/${newItinerary.id}/edit`);
    revalidatePath('/create-trip');
    revalidatePath('/');
    return { success: true, message: 'Itinerary created successfully.', itineraryId: newItinerary.id };
  } catch (error) {
    console.error('Error creating itinerary:', error);
    return { success: false, message: 'An error occurred while creating the itinerary.' };
  }
}

export async function updateItinerary(id: string, values: ItineraryFormValues): Promise<{ success: boolean; message: string, itineraryId?: string }> {
  const validation = itineraryFormSchema.safeParse(values);
  if (!validation.success) {
    return { success: false, message: validation.error.errors.map(e => e.message).join(', ') };
  }
  const data = validation.data;

  let objectIdToUpdate: ObjectId;
  if (ObjectId.isValid(id)) {
    objectIdToUpdate = new ObjectId(id);
  } else {
    const currentItinerary = await getItineraryById(id); // Try to find by string id
    if (!currentItinerary || !currentItinerary._id) {
      return { success: false, message: "Itinerary not found or invalid ID." };
    }
    objectIdToUpdate = currentItinerary._id;
  }


  const itinerariesCollection = await getItinerariesCollection();
  const updateData: Partial<Omit<Itinerary, '_id' | 'id'>> = {
    name: data.name,
    type: data.type,
    pricePerPerson: data.pricePerPerson,
    description: data.description,
    imageUrl: data.imageUrl || `https://placehold.co/600x400.png?text=${encodeURIComponent(data.name.substring(0, 15))}`,
    availableTimes: data.availableTimes.split(',').map(t => t.trim()).filter(t => t),
  };

  try {
    const result = await itinerariesCollection.updateOne({ _id: objectIdToUpdate }, { $set: updateData });
    if (result.matchedCount > 0) {
      revalidatePath('/admin/itineraries');
      revalidatePath(`/admin/itineraries/${id}/edit`); // Use original id for revalidation path
      revalidatePath(`/admin/itineraries/${objectIdToUpdate.toString()}/edit`);
      revalidatePath('/create-trip');
      revalidatePath('/');
      return { success: true, message: 'Itinerary updated successfully.', itineraryId: id };
    }
    return { success: false, message: 'Itinerary not found or no changes made.' };
  } catch (error) {
    console.error('Error updating itinerary:', error);
    return { success: false, message: 'An error occurred while updating the itinerary.' };
  }
}

export async function deleteItinerary(id: string): Promise<{ success: boolean; message: string }> {
  let objectIdToDelete: ObjectId;
  if (ObjectId.isValid(id)) {
    objectIdToDelete = new ObjectId(id);
  } else {
    const itinerary = await getItineraryById(id);
    if (!itinerary || !itinerary._id) {
      return { success: false, message: "Itinerary not found or invalid ID." };
    }
    objectIdToDelete = itinerary._id;
  }

  const itinerariesCollection = await getItinerariesCollection();
  try {
    // TODO: Before deleting, check if this itinerary is used in any Trips.
    // If so, prevent deletion or handle accordingly (e.g., soft delete, anonymize trips).
    // For now, direct deletion.
    const result = await itinerariesCollection.deleteOne({ _id: objectIdToDelete });
    if (result.deletedCount > 0) {
      revalidatePath('/admin/itineraries');
      revalidatePath('/create-trip');
      revalidatePath('/');
      return { success: true, message: 'Itinerary deleted successfully.' };
    }
    return { success: false, message: 'Itinerary not found.' };
  } catch (error) {
    console.error('Error deleting itinerary:', error);
    return { success: false, message: 'An error occurred while deleting the itinerary.' };
  }
}
