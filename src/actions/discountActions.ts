'use server';

import { getDiscountCodesCollection } from '@/lib/mongodb';
import type { DiscountCode, DiscountCodeFormValues } from '@/lib/types'; // Assuming you have a DiscountCode type
import { revalidatePath } from 'next/cache';
import { ObjectId } from 'mongodb'; // Import ObjectId

// Placeholder for fetching all discount codes
export async function getAllDiscountCodes(): Promise<DiscountCode[]> {
    try {
        const discountCodesCollection = await getDiscountCodesCollection();
        const discountCodes = await discountCodesCollection.find({}).sort({ createdAt: -1 }).toArray();
        // You might need to map _id to id if your DiscountCode type uses 'id'
        return discountCodes.map(doc => ({
            ...doc,
            id: doc._id.toString(),
        })) as DiscountCode[];
    } catch (error) {
        console.error('Error fetching discount codes:', error);
        return [];
    }
}

// New server action to create a discount code
export async function createDiscountCode(values: DiscountCodeFormValues): Promise<{ success: boolean; message: string; discountCodeId?: string }> {
    try {
        const discountCodesCollection = await getDiscountCodesCollection();
        const newDiscountCodeObjectId = new ObjectId();

        const newDiscountCode: DiscountCode = {
            _id: newDiscountCodeObjectId,
            id: newDiscountCodeObjectId.toString(),
            code: values.code.toUpperCase(), // Store code as uppercase
            type: values.type,
            value: values.value,
            discountPercentage: values.type === 'percentage' ? values.value : 0, // Set percentage value
            isActive: values.isActive,
            description: values.description || '',
            usageLimit: values.usageLimit || undefined,
            usedCount: 0, // Initialize usedCount
            expiryDate: values.expiryDate || undefined,
            validFrom: new Date().toISOString(), // Assuming creation date is validFrom
            validTo: values.expiryDate || undefined, // Use expiryDate as validTo for simplicity
        };

        await discountCodesCollection.insertOne(newDiscountCode as any);

        revalidatePath('/admin/discounts');
        revalidatePath('/admin/discounts/new');
        revalidatePath(`/admin/discounts/${newDiscountCode.id}/edit`);

            return { success: true, message: '优惠码已创建成功。', discountCodeId: newDiscountCode.id };
    } catch (error: any) {
        console.error('创建优惠码时出错:', error);
        // Check for duplicate code error (MongoDB duplicate key error code 11000)
        if (error.code === 11000) {
            return { success: false, message: '此名称已存在优惠码。' };
        }
        return { success: false, message: error.message || '创建优惠码时发生意外错误。' };
    }
}

// New server action to get a discount code by ID
export async function getDiscountCodeById(id: string): Promise<DiscountCode | null> {
    const discountCodesCollection = await getDiscountCodesCollection();
    let discountCodeDoc;
    if (ObjectId.isValid(id)) {
        discountCodeDoc = await discountCodesCollection.findOne({ _id: new ObjectId(id) });
    } else {
        // Fallback for user-friendly ID if it's not an ObjectId
        discountCodeDoc = await discountCodesCollection.findOne({ id: id });
    }
    return discountCodeDoc ? {
        ...discountCodeDoc,
        id: discountCodeDoc._id.toString(),
        // Ensure date objects are converted to ISO strings if needed for form initialData
        expiryDate: discountCodeDoc.expiryDate || null,
        validFrom: discountCodeDoc.validFrom || null,
        validTo: discountCodeDoc.validTo || null,
        // Ensure usageLimit is a number or undefined/null
        usageLimit: typeof discountCodeDoc.usageLimit === 'string'
            ? parseInt(discountCodeDoc.usageLimit, 10) || undefined // Convert to number, or undefined if invalid
            : discountCodeDoc.usageLimit, // Keep as number or undefined/null
    } as DiscountCode : null;
}

// New server action to update a discount code
export async function updateDiscountCode(id: string, values: DiscountCodeFormValues): Promise<{ success: boolean; message: string, discountCodeId?: string }> {
    let objectIdToUpdate: ObjectId;
    if (ObjectId.isValid(id)) {
        objectIdToUpdate = new ObjectId(id);
    } else {
        const currentDiscountCode = await getDiscountCodeById(id); // Try to find by string id
        if (!currentDiscountCode || !currentDiscountCode._id) {
            return { success: false, message: "优惠码未找到或无效ID。" };
        }
        objectIdToUpdate = currentDiscountCode._id;
    }

    const discountCodesCollection = await getDiscountCodesCollection();
    const updateData: Partial<Omit<DiscountCode, '_id' | 'id' | 'usedCount' | 'createdAt' | 'validFrom'>> = {
        code: values.code.toUpperCase(),
        type: values.type,
        value: values.value,
        discountPercentage: values.type === 'percentage' ? values.value : 0,
        isActive: values.isActive,
        description: values.description || '',
        usageLimit: values.usageLimit === '' ? undefined : values.usageLimit,
        expiryDate: values.expiryDate || undefined,
        validTo: values.expiryDate || undefined,
    };

    try {
        const result = await discountCodesCollection.updateOne({ _id: objectIdToUpdate }, { $set: updateData });
        if (result.matchedCount > 0) {
            revalidatePath('/admin/discounts');
            revalidatePath(`/admin/discounts/${id}/edit`);
            return { success: true, message: '优惠码已更新成功。', discountCodeId: id };
        }
        return { success: false, message: '优惠码未找到或未进行任何更改。' };
    } catch (error: any) {
        console.error('更新优惠码时出错:', error);
        if (error.code === 11000) {
            return { success: false, message: '此名称已存在优惠码。' };
        }
        return { success: false, message: error.message || '更新优惠码时发生意外错误。' };
    }
} 