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

export async function getItineraries(limit: number = 0): Promise<Itinerary[]> {
  const itinerariesCollection = await getItinerariesCollection();
  const cursor = itinerariesCollection.find({}, { projection: { _id: 1, name: 1, type: 1, pricePerPerson: 1, description: 1, imageUrl: 1, availableTimes: 1 } }).sort({ name: 1 });
  if (limit > 0) cursor.limit(limit);
  const itineraries = await cursor.toArray();
  return itineraries.map(doc => {
    return {
      ...doc,
      id: doc._id.toString(),
      _id: doc._id,
      availableTimes: Array.isArray(doc.availableTimes) ? doc.availableTimes : [],
    };
  });
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
  name: z.string().min(3, "名称是必需的，并且至少有3个字符。"),
  type: z.enum(['airport_pickup', 'airport_dropoff', 'tourism']),
  pricePerPerson: z.coerce.number().min(0, "价格必须是正数。"),
  description: z.string().min(10, "描述是必需的，并且至少有10个字符。"),
  imageUrl: z.string().url("必须是有效的URL。").optional().or(z.literal('')),
  availableTimes: z.string().min(1, "可用时间（逗号分隔，例如：08:00,09:00）是必需的。")
    .regex(/^(\d{2}:\d{2})(,\s*\d{2}:\d{2})*$/, "时间必须以HH:MM格式，逗号分隔。"),
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
    return { success: true, message: '行程已创建成功。', itineraryId: newItinerary.id };
  } catch (error) {
    console.error('创建行程时出错:', error);
    return { success: false, message: '创建行程时发生意外错误。' };
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
      return { success: true, message: '行程已更新成功。', itineraryId: id };
    }
    return { success: false, message: '行程未找到或未更改。' };
  } catch (error) {
    console.error('更新行程时出错:', error);
    return { success: false, message: '更新行程时发生意外错误。' };
  }
}

export async function deleteItinerary(id: string): Promise<{ success: boolean; message: string }> {
  let objectIdToDelete: ObjectId;
  if (ObjectId.isValid(id)) {
    objectIdToDelete = new ObjectId(id);
  } else {
    const itinerary = await getItineraryById(id);
    if (!itinerary || !itinerary._id) {
      return { success: false, message: "行程未找到或无效ID。" };
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
      return { success: true, message: '行程已删除成功。' };
    }
    return { success: false, message: '行程未找到。' };
  } catch (error) {
    console.error('删除行程时出错:', error);
    return { success: false, message: '删除行程时发生意外错误。' };
  }
}
