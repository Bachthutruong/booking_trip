'use server';

import { getAdditionalServicesCollection } from '@/lib/mongodb';
import type { AdditionalService, AdditionalServiceFormValues } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { ObjectId } from 'mongodb';

export async function getAllAdditionalServices(): Promise<AdditionalService[]> {
    try {
        const collection = await getAdditionalServicesCollection();
        const services = await collection.find({}).sort({ name: 1 }).toArray();
        return services.map(doc => ({
            ...doc,
            id: doc._id.toString(),
        })) as AdditionalService[];
    } catch (error) {
        console.error('获取附加服务时出错', error);
        return [];
    }
}

export async function createAdditionalService(values: AdditionalServiceFormValues): Promise<{ success: boolean; message: string; serviceId?: string }> {
    try {
        const collection = await getAdditionalServicesCollection();
        const newObjectId = new ObjectId();
        const newService: AdditionalService = {
            _id: newObjectId,
            id: newObjectId.toString(),
            name: values.name,
            price: values.price,
            description: values.description || '',
            applicableTo: values.applicableTo,
            iconName: values.iconName || undefined,
        };

        await collection.insertOne(newService as any);
        revalidatePath('/admin/services');
        revalidatePath('/admin/services/new');
        return { success: true, message: '附加服务创建成功。', serviceId: newService.id };
    } catch (error: any) {
        console.error('创建附加服务时出错', error);
        if (error.code === 11000) { // Duplicate key error
            return { success: false, message: '此名称已存在附加服务。' };
        }
        return { success: false, message: error.message || '发生意外错误。' };
    }
}

export async function getAdditionalServiceById(id: string): Promise<AdditionalService | null> {
    try {
        const collection = await getAdditionalServicesCollection();
        if (!ObjectId.isValid(id)) {
            return null; // Invalid ObjectId format
        }
        const service = await collection.findOne({ _id: new ObjectId(id) });
        return service ? { ...service, id: service._id.toString() } as AdditionalService : null;
    } catch (error) {
        console.error('获取附加服务时出错', error);
        return null;
    }
}

export async function updateAdditionalService(id: string, values: AdditionalServiceFormValues): Promise<{ success: boolean; message: string; serviceId?: string }> {
    try {
        const collection = await getAdditionalServicesCollection();
        if (!ObjectId.isValid(id)) {
            return { success: false, message: '无效的ID格式。' };
        }
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    name: values.name,
                    price: values.price,
                    description: values.description || '',
                    applicableTo: values.applicableTo,
                    iconName: values.iconName || undefined,
                }
            }
        );
        if (result.matchedCount === 0) {
            return { success: false, message: '附加服务未找到。' };
        }
        revalidatePath('/admin/services');
        revalidatePath(`/admin/services/${id}/edit`);
        return { success: true, message: '附加服务更新成功。', serviceId: id };
    } catch (error: any) {
        console.error('更新附加服务时出错', error);
        if (error.code === 11000) {
            return { success: false, message: '此名称已存在附加服务。' };
        }
        return { success: false, message: error.message || '发生意外错误。' };
    }
}

export async function deleteAdditionalService(id: string): Promise<{ success: boolean; message: string }> {
    try {
        const collection = await getAdditionalServicesCollection();
        if (!ObjectId.isValid(id)) {
            return { success: false, message: '无效的ID格式。' };
        }
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
            return { success: false, message: '附加服务未找到。' };
        }
        revalidatePath('/admin/services');
        return { success: true, message: '附加服务已删除。' };
    } catch (error: any) {
        console.error('删除附加服务时出错', error);
        return { success: false, message: error.message || '删除时发生意外错误。' };
    }
} 