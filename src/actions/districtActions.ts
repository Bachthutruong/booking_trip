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
        console.error(' 获取地区附加费时出错:', error);
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
        return { success: true, message: '地区附加费已创建成功。', districtId: newSurcharge.id };
    } catch (error: any) {
        console.error('创建地区附加费时出错:', error);
        if (error.code === 11000) { // Duplicate key error
            return { success: false, message: '此地区名称已存在附加费。' };
        }
        return { success: false, message: error.message || '发生意外错误。' };
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
        console.error('获取地区附加费时出错:', error);
        return null;
    }
}

export async function updateDistrictSurcharge(id: string, values: DistrictSurchargeFormValues): Promise<{ success: boolean; message: string; districtId?: string }> {
    try {
        const collection = await getDistrictSurchargesCollection();
        if (!ObjectId.isValid(id)) {
            return { success: false, message: '无效的ID格式。' };
        }
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { districtName: values.districtName, surchargeAmount: values.surchargeAmount } }
        );
        if (result.matchedCount === 0) {
            return { success: false, message: '地区附加费未找到。' };
        }
        revalidatePath('/admin/districts');
        revalidatePath(`/admin/districts/${id}/edit`);
        return { success: true, message: '地区附加费已更新成功。', districtId: id };
    } catch (error: any) {
        console.error('更新地区附加费时出错:', error);
        if (error.code === 11000) {
            return { success: false, message: '此地区名称已存在附加费。' };
        }
        return { success: false, message: error.message || '发生意外错误。' };
    }
}

export async function deleteDistrictSurcharge(id: string): Promise<{ success: boolean; message: string }> {
    try {
        const collection = await getDistrictSurchargesCollection();
        if (!ObjectId.isValid(id)) {
            return { success: false, message: '无效的ID格式。' };
        }
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
            return { success: false, message: '地区附加费未找到。' };
        }
        revalidatePath('/admin/districts');
        return { success: true, message: '地区附加费已删除。' };
    } catch (error: any) {
        console.error('删除地区附加费时出错:', error);
        return { success: false, message: error.message || '删除时发生意外错误。' };
    }
} 