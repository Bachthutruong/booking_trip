
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
    _id: doc._id,
  };
}

export async function getItineraries(): Promise<Itinerary[]> {
  const itinerariesCollection = await getItinerariesCollection();
  const itineraries = await itinerariesCollection.find({}).toArray();
  return itineraries.map(mapDocumentToItinerary);
}

export async function getItineraryById(id: string): Promise<Itinerary | null> {
  if (!ObjectId.isValid(id)) {
    // Attempt to find by user-friendly ID if it's not an ObjectId
    const itinerariesCollection = await getItinerariesCollection();
    const itineraryDoc = await itinerariesCollection.findOne({ id: id });
    if (itineraryDoc) {
      return mapDocumentToItinerary(itineraryDoc);
    }
    // If still not found, or if original ID was meant to be an ObjectId but invalid, return null
    return null; 
  }
  const itinerariesCollection = await getItinerariesCollection();
  const itineraryDoc = await itinerariesCollection.findOne({ _id: new ObjectId(id) });
  return itineraryDoc ? mapDocumentToItinerary(itineraryDoc) : null;
}


// Admin actions for Itineraries
const itineraryFormSchema = z.object({
  name: z.string().min(3, "Name is required and must be at least 3 characters."),
  type: z.enum(['airport_pickup', 'airport_dropoff', 'tourism']),
  pricePerPerson: z.coerce.number().min(0, "Price must be a positive number."),
  description: z.string().min(10, "Description is required and must be at least 10 characters."),
  imageUrl: z.string().url("Must be a valid URL.").optional().or(z.literal('')),
  availableTimes: z.string().min(1, "Available times are required (comma-separated)."),
});

export async function createItinerary(values: ItineraryFormValues): Promise<{ success: boolean; message: string; itineraryId?: string }> {
  const validation = itineraryFormSchema.safeParse(values);
  if (!validation.success) {
    return { success: false, message: validation.error.errors.map(e => e.message).join(', ') };
  }
  const data = validation.data;

  const itinerariesCollection = await getItinerariesCollection();
  const newItineraryId = new ObjectId();
  const newItinerary: Omit<Itinerary, '_id' | 'id'> & { _id: ObjectId, id: string } = {
    _id: newItineraryId,
    id: newItineraryId.toString(), // Using ObjectId string as the user-friendly ID
    name: data.name,
    type: data.type,
    pricePerPerson: data.pricePerPerson,
    description: data.description,
    imageUrl: data.imageUrl || `https://placehold.co/600x400.png?text=${encodeURIComponent(data.name.substring(0,15))}`,
    availableTimes: data.availableTimes.split(',').map(t => t.trim()).filter(t => t),
  };

  try {
    const result = await itinerariesCollection.insertOne(newItinerary as any); // Cast to any to handle _id type difference if strict
    if (result.insertedId) {
      revalidatePath('/admin/itineraries');
      revalidatePath('/create-trip');
      revalidatePath('/');
      return { success: true, message: 'Itinerary created successfully.', itineraryId: newItinerary.id };
    }
    return { success: false, message: 'Failed to create itinerary.' };
  } catch (error) {
    console.error('Error creating itinerary:', error);
    return { success: false, message: 'An error occurred while creating the itinerary.' };
  }
}

export async function updateItinerary(id: string, values: ItineraryFormValues): Promise<{ success: boolean; message: string }> {
  const validation = itineraryFormSchema.safeParse(values);
  if (!validation.success) {
    return { success: false, message: validation.error.errors.map(e => e.message).join(', ') };
  }
  const data = validation.data;

  if (!ObjectId.isValid(id)) {
    return { success: false, message: "Invalid Itinerary ID format." };
  }

  const itinerariesCollection = await getItinerariesCollection();
  const updateData: Partial<Itinerary> = {
    name: data.name,
    type: data.type,
    pricePerPerson: data.pricePerPerson,
    description: data.description,
    imageUrl: data.imageUrl || `https://placehold.co/600x400.png?text=${encodeURIComponent(data.name.substring(0,15))}`,
    availableTimes: data.availableTimes.split(',').map(t => t.trim()).filter(t => t),
  };

  try {
    const result = await itinerariesCollection.updateOne({ _id: new ObjectId(id) }, { $set: updateData });
    if (result.matchedCount > 0) {
      revalidatePath('/admin/itineraries');
      revalidatePath(`/admin/itineraries/${id}/edit`);
      revalidatePath('/create-trip');
      revalidatePath('/');
      return { success: true, message: 'Itinerary updated successfully.' };
    }
    return { success: false, message: 'Itinerary not found or no changes made.' };
  } catch (error) {
    console.error('Error updating itinerary:', error);
    return { success: false, message: 'An error occurred while updating the itinerary.' };
  }
}

export async function deleteItinerary(id: string): Promise<{ success: boolean; message: string }> {
  if (!ObjectId.isValid(id)) {
    return { success: false, message: "Invalid Itinerary ID format." };
  }
  const itinerariesCollection = await getItinerariesCollection();
  try {
    const result = await itinerariesCollection.deleteOne({ _id: new ObjectId(id) });
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
