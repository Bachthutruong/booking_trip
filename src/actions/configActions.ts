'use server';

import {
  getDistrictSurchargesCollection,
  getAdditionalServicesCollection,
  getDiscountCodesCollection,
  getTermsCollection
} from '@/lib/mongodb';
import type { DistrictSurcharge, AdditionalService, DiscountCode, DiscountCodeFormValues, DistrictSurchargeFormValues, AdditionalServiceFormValues, ItineraryType, Terms } from '@/lib/types';
import { ObjectId } from 'mongodb';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// --- Helper for MongoDB document mapping ---
function mapMongoDocument<T>(doc: any): T {
  const { _id, ...rest } = doc;
  return { ...rest, id: _id!.toString() } as T;
}


// --- District Surcharges ---
export async function getDistrictSurcharges(): Promise<DistrictSurcharge[]> {
  const collection = await getDistrictSurchargesCollection();
  const docs = await collection.find({}).toArray();
  return docs.map(doc => mapMongoDocument<DistrictSurcharge>(doc));
}

const districtSurchargeSchema = z.object({
  districtName: z.string().min(1, "D地区名称是必需的。"),
  surchargeAmount: z.coerce.number().min(0, "附加费用必须为正数。"),
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
    return { success: true, message: '地区附加费用已创建。  ', id: newDoc.id };
  } catch (error) {
    console.error("创建地区附加费用时出错:", error);
    return { success: false, message: '创建地区附加费用失败。' };
  }
}

export async function updateDistrictSurcharge(id: string, values: DistrictSurchargeFormValues): Promise<{ success: boolean; message: string }> {
  if (!ObjectId.isValid(id)) return { success: false, message: "Invalid ID format." };
  const validation = districtSurchargeSchema.safeParse(values);
  if (!validation.success) return { success: false, message: validation.error.errors.map(e => e.message).join(', ') };

  const collection = await getDistrictSurchargesCollection();
  try {
    const result = await collection.updateOne({ _id: new ObjectId(id) }, { $set: validation.data });
    if (result.matchedCount === 0) return { success: false, message: '地区附加费用未找到。' };
    revalidatePath('/admin/districts');
    revalidatePath(`/admin/districts/${id}/edit`);
    revalidatePath('/create-trip');
    return { success: true, message: '地区附加费用已更新。' };
  } catch (error) {
    console.error("更新地区附加费用时出错:", error);
    return { success: false, message: '更新地区附加费用失败。' };
  }
}

export async function deleteDistrictSurcharge(id: string): Promise<{ success: boolean; message: string }> {
  if (!ObjectId.isValid(id)) return { success: false, message: "Invalid ID format." };
  const collection = await getDistrictSurchargesCollection();
  try {
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return { success: false, message: '地区附加费用未找到。' };
    revalidatePath('/admin/districts');
    revalidatePath('/create-trip');
    return { success: true, message: '地区附加费用已删除。' };
  } catch (error) {
    console.error("删除地区附加费用时出错:", error);
    return { success: false, message: '删除地区附加费用失败。' };
  }
}
export async function getDistrictSurchargeById(id: string): Promise<DistrictSurcharge | null> {
  if (!ObjectId.isValid(id)) return null;
  const collection = await getDistrictSurchargesCollection();
  const doc = await collection.findOne({ _id: new ObjectId(id) });
  return doc ? mapMongoDocument<DistrictSurcharge>(doc) : null;
}


// --- Additional Services ---
export async function getAdditionalServices(): Promise<AdditionalService[]> {
  const collection = await getAdditionalServicesCollection();
  const docs = await collection.find({}).toArray();
  return docs.map(doc => mapMongoDocument<AdditionalService>(doc));
}

const additionalServiceSchema = z.object({
  name: z.string().min(1, "服务名称是必需的。"),
  price: z.coerce.number().min(0, "价格必须为正数。"),
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
    return { success: true, message: '附加服务已创建。', id: newDoc.id };
  } catch (error) {
    console.error("创建附加服务时出错:", error);
    return { success: false, message: '创建附加服务失败。' };
  }
}
export async function updateAdditionalService(id: string, values: AdditionalServiceFormValues): Promise<{ success: boolean; message: string }> {
  if (!ObjectId.isValid(id)) return { success: false, message: "Invalid ID format." };
  const validation = additionalServiceSchema.safeParse(values);
  if (!validation.success) return { success: false, message: validation.error.errors.map(e => e.message).join(', ') };

  const collection = await getAdditionalServicesCollection();
  try {
    const result = await collection.updateOne({ _id: new ObjectId(id) }, { $set: validation.data });
    if (result.matchedCount === 0) return { success: false, message: '附加服务未找到。' };
    revalidatePath('/admin/services');
    revalidatePath(`/admin/services/${id}/edit`);
    revalidatePath('/create-trip');
    return { success: true, message: '附加服务已更新。' };
  } catch (error) {
    console.error("更新附加服务时出错:", error);
    return { success: false, message: '更新附加服务失败。' };
  }
}

export async function deleteAdditionalService(id: string): Promise<{ success: boolean; message: string }> {
  if (!ObjectId.isValid(id)) return { success: false, message: "Invalid ID format." };
  const collection = await getAdditionalServicesCollection();
  try {
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return { success: false, message: '附加服务未找到。' };
    revalidatePath('/admin/services');
    revalidatePath('/create-trip');
    return { success: true, message: '附加服务已删除。' };
  } catch (error) {
    console.error("删除附加服务时出错:", error);
    return { success: false, message: '删除附加服务失败。' };
  }
}
export async function getAdditionalServiceById(id: string): Promise<AdditionalService | null> {
  if (!ObjectId.isValid(id)) return null;
  const collection = await getAdditionalServicesCollection();
  const doc = await collection.findOne({ _id: new ObjectId(id) });
  return doc ? mapMongoDocument<AdditionalService>(doc) : null;
}

export async function getAdditionalServicesByIds(ids: string[]): Promise<AdditionalService[]> {
  if (ids.length === 0) return [];
  const collection = await getAdditionalServicesCollection();
  const objectIds = ids.filter(id => ObjectId.isValid(id)).map(id => new ObjectId(id));
  if (objectIds.length === 0) return [];
  const docs = await collection.find({ _id: { $in: objectIds } }).toArray();
  return docs.map(doc => mapMongoDocument<AdditionalService>(doc));
}


// --- Discount Codes ---
export async function getDiscountCodes(): Promise<DiscountCode[]> {
  const collection = await getDiscountCodesCollection();
  const docs = await collection.find({}).sort({ code: 1 }).toArray();
  return docs.map(doc => mapMongoDocument<DiscountCode>(doc));
}

export async function getDiscountCodeDetails(code: string): Promise<DiscountCode | null> {
  const collection = await getDiscountCodesCollection();
  const doc = await collection.findOne({ code: code.toUpperCase(), isActive: true });
  // Add logic for usageLimit, validFrom, validTo if implemented
  return doc ? mapMongoDocument<DiscountCode>(doc) : null;
}

const discountCodeSchema = z.object({
  code: z.string().min(3, "代码必须至少有3个字符。").max(20).toUpperCase(),
  type: z.enum(['fixed', 'percentage']),
  value: z.coerce.number().min(0, "值必须为正数。"),
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
    return { success: false, message: `优惠码 "${data.code}" 已存在。` };
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
    return { success: true, message: '优惠码已创建。', id: newDoc.id };
  } catch (error) {
    console.error("创建优惠码时出错:", error);
    return { success: false, message: '创建优惠码失败。' };
  }
}
export async function updateDiscountCode(id: string, values: DiscountCodeFormValues): Promise<{ success: boolean; message: string }> {
  if (!ObjectId.isValid(id)) return { success: false, message: "Invalid ID format." };
  const validation = discountCodeSchema.safeParse(values);
  if (!validation.success) return { success: false, message: validation.error.errors.map(e => e.message).join(', ') };

  const collection = await getDiscountCodesCollection();
  try {
    const result = await collection.updateOne({ _id: new ObjectId(id) }, { $set: validation.data });
    if (result.matchedCount === 0) return { success: false, message: '优惠码未找到。' };
    revalidatePath('/admin/discounts');
    revalidatePath(`/admin/discounts/${id}/edit`);
    revalidatePath('/create-trip');
    return { success: true, message: '优惠码已更新。' };
  } catch (error) {
    console.error("更新优惠码时出错:", error);
    return { success: false, message: '更新优惠码失败。' };
  }
}

export async function deleteDiscountCode(id: string): Promise<{ success: boolean; message: string }> {
  if (!ObjectId.isValid(id)) return { success: false, message: "Invalid ID format." };
  const collection = await getDiscountCodesCollection();
  try {
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return { success: false, message: '优惠码未找到。' };
    revalidatePath('/admin/discounts');
    revalidatePath('/create-trip');
    return { success: true, message: '优惠码已删除。' };
  } catch (error) {
    console.error("删除优惠码时出错:", error);
    return { success: false, message: '删除优惠码失败。' };
  }
}

export async function getDiscountCodeById(id: string): Promise<DiscountCode | null> {
  if (!ObjectId.isValid(id)) return null;
  const collection = await getDiscountCodesCollection();
  const doc = await collection.findOne({ _id: new ObjectId(id) });
  return doc ? mapMongoDocument<DiscountCode>(doc) : null;
}

// --- Terms ---
export async function getTerms(): Promise<Terms | null> {
  const collection = await getTermsCollection();
  const doc = await collection.findOne({});
  return doc ? mapMongoDocument<Terms>(doc) : null;
}
