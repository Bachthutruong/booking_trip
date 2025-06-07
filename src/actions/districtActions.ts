'use server';

import { getDistrictSurchargesCollection } from '@/lib/mongodb';
import type { DistrictSurcharge, DistrictSurchargeFormValues } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { ObjectId } from 'mongodb';

export async function getAllDistrictSurcharges(): Promise<DistrictSurcharge[]> {
    try {
        const collection = await getDistrictSurchargesCollection();
        const surcharges = await collection.find({}).sort({ districtName: 1 }).toArray();
        return surcharges.map(doc => ({
            ...doc,
            id: doc._id.toString(),
        })) as DistrictSurcharge[];
    } catch (error) {
        console.error('Error fetching district surcharges:', error);
        return [];
    }
}

export async function createDistrictSurcharge(values: DistrictSurchargeFormValues): Promise<{ success: boolean; message: string; districtId?: string }> {
    try {
        const collection = await getDistrictSurchargesCollection();
        const newObjectId = new ObjectId();
        const newSurcharge: DistrictSurcharge = {
            _id: newObjectId,
            id: newObjectId.toString(),
            districtName: values.districtName,
            surchargeAmount: values.surchargeAmount,
        };

        await collection.insertOne(newSurcharge as any);
        revalidatePath('/admin/districts');
        revalidatePath('/admin/districts/new');
        return { success: true, message: 'District surcharge created successfully.', districtId: newSurcharge.id };
    } catch (error: any) {
        console.error('Error creating district surcharge:', error);
        if (error.code === 11000) { // Duplicate key error
            return { success: false, message: 'A surcharge for this district name already exists.' };
        }
        return { success: false, message: error.message || 'An unexpected error occurred.' };
    }
}

export async function getDistrictSurchargeById(id: string): Promise<DistrictSurcharge | null> {
    try {
        const collection = await getDistrictSurchargesCollection();
        if (!ObjectId.isValid(id)) {
            return null; // Invalid ObjectId format
        }
        const surcharge = await collection.findOne({ _id: new ObjectId(id) });
        return surcharge ? { ...surcharge, id: surcharge._id.toString() } as DistrictSurcharge : null;
    } catch (error) {
        console.error('Error fetching district surcharge by ID:', error);
        return null;
    }
}

export async function updateDistrictSurcharge(id: string, values: DistrictSurchargeFormValues): Promise<{ success: boolean; message: string; districtId?: string }> {
    try {
        const collection = await getDistrictSurchargesCollection();
        if (!ObjectId.isValid(id)) {
            return { success: false, message: 'Invalid ID format.' };
        }
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { districtName: values.districtName, surchargeAmount: values.surchargeAmount } }
        );
        if (result.matchedCount === 0) {
            return { success: false, message: 'District surcharge not found.' };
        }
        revalidatePath('/admin/districts');
        revalidatePath(`/admin/districts/${id}/edit`);
        return { success: true, message: 'District surcharge updated successfully.', districtId: id };
    } catch (error: any) {
        console.error('Error updating district surcharge:', error);
        if (error.code === 11000) {
            return { success: false, message: 'A surcharge for this district name already exists.' };
        }
        return { success: false, message: error.message || 'An unexpected error occurred.' };
    }
}

export async function deleteDistrictSurcharge(id: string): Promise<{ success: boolean; message: string }> {
    try {
        const collection = await getDistrictSurchargesCollection();
        if (!ObjectId.isValid(id)) {
            return { success: false, message: 'Invalid ID format.' };
        }
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
            return { success: false, message: 'District surcharge not found.' };
        }
        revalidatePath('/admin/districts');
        return { success: true, message: 'District surcharge deleted successfully.' };
    } catch (error: any) {
        console.error('Error deleting district surcharge:', error);
        return { success: false, message: error.message || 'An unexpected error occurred during deletion.' };
    }
} 