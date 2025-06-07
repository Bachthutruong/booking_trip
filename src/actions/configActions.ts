
'use server';

import { 
  getDistrictSurchargesCollection, 
  getAdditionalServicesCollection, 
  getDiscountCodesCollection 
} from '@/lib/mongodb';
import type { DistrictSurcharge, AdditionalService, DiscountCode, DiscountCodeFormValues, DistrictSurchargeFormValues, AdditionalServiceFormValues, ItineraryType } from '@/lib/types';
import { ObjectId } from 'mongodb';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// --- Helper for MongoDB document mapping ---
function mapMongoDocument<T extends { _id?: ObjectId }>(doc: T): Omit<T, '_id'> & { id: string } {
  const { _id, ...rest } = doc;
  return { ...rest, id: _id!.toString() } as Omit<T, '_id'> & { id: string };
}


// --- District Surcharges ---
export async function getDistrictSurcharges(): Promise<DistrictSurcharge[]> {
  const collection = await getDistrictSurchargesCollection();
  const docs = await collection.find({}).toArray();
  return docs.map(doc => mapMongoDocument(doc as any));
}

const districtSurchargeSchema = z.object({
  districtName: z.string().min(1, "District name is required."),
  surchargeAmount: z.coerce.number().min(0, "Surcharge amount must be a positive number."),
});

export async function createDistrictSurcharge(values: DistrictSurchargeFormValues): Promise<{ success: boolean; message: string; id?: string }> {
  const validation = districtSurchargeSchema.safeParse(values);
  if (!validation.success) {
    return { success: false, message: validation.error.errors.map(e => e.message).join(', ') };
  }
  const collection = await getDistrictSurchargesCollection();
  const newId = new ObjectId();
  const newDoc = { _id: newId, id: newId.toString(), ...validation.data };
  
  try {
    await collection.insertOne(newDoc as any);
    revalidatePath('/admin/districts');
    revalidatePath('/create-trip'); // Pages that use this data
    return { success: true, message: 'District surcharge created.', id: newDoc.id };
  } catch (error) {
    console.error("Error creating district surcharge:", error);
    return { success: false, message: 'Failed to create district surcharge.' };
  }
}

export async function updateDistrictSurcharge(id: string, values: DistrictSurchargeFormValues): Promise<{ success: boolean; message: string }> {
  if (!ObjectId.isValid(id)) return { success: false, message: "Invalid ID format." };
  const validation = districtSurchargeSchema.safeParse(values);
  if (!validation.success) return { success: false, message: validation.error.errors.map(e => e.message).join(', ') };
  
  const collection = await getDistrictSurchargesCollection();
  try {
    const result = await collection.updateOne({ _id: new ObjectId(id) }, { $set: validation.data });
    if (result.matchedCount === 0) return { success: false, message: 'District surcharge not found.' };
    revalidatePath('/admin/districts');
    revalidatePath(`/admin/districts/${id}/edit`);
    revalidatePath('/create-trip');
    return { success: true, message: 'District surcharge updated.' };
  } catch (error) {
    console.error("Error updating district surcharge:", error);
    return { success: false, message: 'Failed to update district surcharge.' };
  }
}

export async function deleteDistrictSurcharge(id: string): Promise<{ success: boolean; message: string }> {
  if (!ObjectId.isValid(id)) return { success: false, message: "Invalid ID format." };
  const collection = await getDistrictSurchargesCollection();
  try {
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return { success: false, message: 'District surcharge not found.' };
    revalidatePath('/admin/districts');
    revalidatePath('/create-trip');
    return { success: true, message: 'District surcharge deleted.' };
  } catch (error) {
    console.error("Error deleting district surcharge:", error);
    return { success: false, message: 'Failed to delete district surcharge.' };
  }
}
export async function getDistrictSurchargeById(id: string): Promise<DistrictSurcharge | null> {
    if (!ObjectId.isValid(id)) return null;
    const collection = await getDistrictSurchargesCollection();
    const doc = await collection.findOne({ _id: new ObjectId(id) });
    return doc ? mapMongoDocument(doc as any) : null;
}


// --- Additional Services ---
export async function getAdditionalServices(): Promise<AdditionalService[]> {
  const collection = await getAdditionalServicesCollection();
  const docs = await collection.find({}).toArray();
  return docs.map(doc => mapMongoDocument(doc as any));
}

const additionalServiceSchema = z.object({
  name: z.string().min(1, "Service name is required."),
  price: z.coerce.number().min(0, "Price must be a positive number."),
  description: z.string().optional(),
  applicableTo: z.array(z.enum(['airport_pickup', 'airport_dropoff', 'tourism'])).min(1, "Select at least one applicable itinerary type."),
  iconName: z.string().optional(),
});

export async function createAdditionalService(values: AdditionalServiceFormValues): Promise<{ success: boolean; message: string; id?: string }> {
  const validation = additionalServiceSchema.safeParse(values);
  if (!validation.success) {
    return { success: false, message: validation.error.errors.map(e => e.message).join(', ') };
  }
  const collection = await getAdditionalServicesCollection();
  const newId = new ObjectId();
  const newDoc = { _id: newId, id: newId.toString(), ...validation.data };
  
  try {
    await collection.insertOne(newDoc as any);
    revalidatePath('/admin/services');
    revalidatePath('/create-trip');
    return { success: true, message: 'Additional service created.', id: newDoc.id };
  } catch (error) {
    console.error("Error creating additional service:", error);
    return { success: false, message: 'Failed to create additional service.' };
  }
}
export async function updateAdditionalService(id: string, values: AdditionalServiceFormValues): Promise<{ success: boolean; message: string }> {
  if (!ObjectId.isValid(id)) return { success: false, message: "Invalid ID format." };
  const validation = additionalServiceSchema.safeParse(values);
  if (!validation.success) return { success: false, message: validation.error.errors.map(e => e.message).join(', ') };
  
  const collection = await getAdditionalServicesCollection();
  try {
    const result = await collection.updateOne({ _id: new ObjectId(id) }, { $set: validation.data });
    if (result.matchedCount === 0) return { success: false, message: 'Service not found.' };
    revalidatePath('/admin/services');
    revalidatePath(`/admin/services/${id}/edit`);
    revalidatePath('/create-trip');
    return { success: true, message: 'Additional service updated.' };
  } catch (error) {
    console.error("Error updating additional service:", error);
    return { success: false, message: 'Failed to update additional service.' };
  }
}

export async function deleteAdditionalService(id: string): Promise<{ success: boolean; message: string }> {
  if (!ObjectId.isValid(id)) return { success: false, message: "Invalid ID format." };
  const collection = await getAdditionalServicesCollection();
  try {
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return { success: false, message: 'Service not found.' };
    revalidatePath('/admin/services');
    revalidatePath('/create-trip');
    return { success: true, message: 'Additional service deleted.' };
  } catch (error) {
    console.error("Error deleting additional service:", error);
    return { success: false, message: 'Failed to delete additional service.' };
  }
}
export async function getAdditionalServiceById(id: string): Promise<AdditionalService | null> {
    if (!ObjectId.isValid(id)) return null;
    const collection = await getAdditionalServicesCollection();
    const doc = await collection.findOne({ _id: new ObjectId(id) });
    return doc ? mapMongoDocument(doc as any) : null;
}


// --- Discount Codes ---
export async function getDiscountCodes(): Promise<DiscountCode[]> {
  const collection = await getDiscountCodesCollection();
  const docs = await collection.find({}).sort({ code: 1 }).toArray();
  return docs.map(doc => mapMongoDocument(doc as any));
}

export async function getDiscountCodeDetails(code: string): Promise<DiscountCode | null> {
  const collection = await getDiscountCodesCollection();
  const doc = await collection.findOne({ code: code.toUpperCase(), isActive: true });
  // Add logic for usageLimit, validFrom, validTo if implemented
  return doc ? mapMongoDocument(doc as any) : null;
}

const discountCodeSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters.").max(20).toUpperCase(),
  type: z.enum(['fixed', 'percentage']),
  value: z.coerce.number().min(0, "Value must be positive."),
  isActive: z.boolean(),
  description: z.string().optional(),
});

export async function createDiscountCode(values: DiscountCodeFormValues): Promise<{ success: boolean; message: string; id?: string }> {
  const validation = discountCodeSchema.safeParse(values);
  if (!validation.success) {
    return { success: false, message: validation.error.errors.map(e => e.message).join(', ') };
  }
  const data = validation.data;
  const collection = await getDiscountCodesCollection();
  
  // Check for duplicate code
  const existing = await collection.findOne({ code: data.code });
  if (existing) {
    return { success: false, message: `Discount code "${data.code}" already exists.` };
  }

  const newId = new ObjectId();
  const newDoc: Omit<DiscountCode, '_id' | 'id'> & { _id: ObjectId, id: string, timesUsed: number } = {
    _id: newId,
    id: newId.toString(),
    ...data,
    timesUsed: 0, // Initialize timesUsed
  };
  
  try {
    await collection.insertOne(newDoc as any);
    revalidatePath('/admin/discounts');
    revalidatePath('/create-trip'); // Invalidate cache for trip creation if it uses discounts
    return { success: true, message: 'Discount code created.', id: newDoc.id };
  } catch (error) {
    console.error("Error creating discount code:", error);
    return { success: false, message: 'Failed to create discount code.' };
  }
}
export async function updateDiscountCode(id: string, values: DiscountCodeFormValues): Promise<{ success: boolean; message: string }> {
  if (!ObjectId.isValid(id)) return { success: false, message: "Invalid ID format." };
  const validation = discountCodeSchema.safeParse(values);
  if (!validation.success) return { success: false, message: validation.error.errors.map(e => e.message).join(', ') };
  
  const collection = await getDiscountCodesCollection();
  try {
    const result = await collection.updateOne({ _id: new ObjectId(id) }, { $set: validation.data });
    if (result.matchedCount === 0) return { success: false, message: 'Discount code not found.' };
    revalidatePath('/admin/discounts');
    revalidatePath(`/admin/discounts/${id}/edit`);
    revalidatePath('/create-trip');
    return { success: true, message: 'Discount code updated.' };
  } catch (error) {
    console.error("Error updating discount code:", error);
    return { success: false, message: 'Failed to update discount code.' };
  }
}

export async function deleteDiscountCode(id: string): Promise<{ success: boolean; message: string }> {
  if (!ObjectId.isValid(id)) return { success: false, message: "Invalid ID format." };
  const collection = await getDiscountCodesCollection();
  try {
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return { success: false, message: 'Discount code not found.' };
    revalidatePath('/admin/discounts');
    revalidatePath('/create-trip');
    return { success: true, message: 'Discount code deleted.' };
  } catch (error) {
    console.error("Error deleting discount code:", error);
    return { success: false, message: 'Failed to delete discount code.' };
  }
}

export async function getDiscountCodeById(id: string): Promise<DiscountCode | null> {
    if (!ObjectId.isValid(id)) return null;
    const collection = await getDiscountCodesCollection();
    const doc = await collection.findOne({ _id: new ObjectId(id) });
    return doc ? mapMongoDocument(doc as any) : null;
}
