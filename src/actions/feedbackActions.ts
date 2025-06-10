'use server';

import { getFeedbackCollection } from '@/lib/mongodb';
import type { Feedback, FeedbackFormValues } from '@/lib/types';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const feedbackSchema = z.object({
  name: z.string().min(1, "名称是必需的。"),
  email: z.string().email("无效的电子邮件地址。"),
  tripId: z.string().optional(),
  message: z.string().min(10, "消息必须至少有10个字符。"),
});

export async function submitFeedback(values: FeedbackFormValues): Promise<{ success: boolean; message: string }> {
  const validation = feedbackSchema.safeParse(values);

  if (!validation.success) {
    return { success: false, message: validation.error.errors.map(e => e.message).join(', ') };
  }

  const data = validation.data;
  const feedbackCollection = await getFeedbackCollection();
  const newFeedbackObjectId = new ObjectId();

  const newFeedbackData: Omit<Feedback, '_id' | 'id'> = {
    name: data.name,
    email: data.email,
    tripId: data.tripId,
    message: data.message,
    submittedAt: new Date().toISOString(),
  };

  try {
    const result = await feedbackCollection.insertOne({
      _id: newFeedbackObjectId,
      id: newFeedbackObjectId.toString(),
      ...newFeedbackData
    });

    if (result.insertedId) {
      // Potentially revalidate an admin feedback page
      // revalidatePath('/admin/feedback');
      return { success: true, message: '感谢您的反馈！' };
    }
    return { success: false, message: '提交反馈失败。' };
  } catch (error) {
    console.error("提交反馈时出错:", error);
    return { success: false, message: '提交反馈时发生意外错误。' };
  }
}

// Admin action to get all feedback (example)
export async function getAllFeedback(): Promise<Feedback[]> {
  const feedbackCollection = await getFeedbackCollection();
  const feedbackDocs = await feedbackCollection.find({}).sort({ submittedAt: -1 }).toArray();
  return feedbackDocs.map(doc => ({
    ...doc,
    id: doc._id.toString(),
  })) as Feedback[];
}

export async function getFeedbackById(id: string): Promise<Feedback | null> {
  try {
    const collection = await getFeedbackCollection();
    const feedback = await collection.findOne({ _id: new ObjectId(id) });
    if (!feedback) {
      return null;
    }
    return { ...feedback, id: feedback._id.toHexString() };
  } catch (error) {
    console.error(`获取反馈时出错 ${id}:`, error);
    return null;
  }
}

export async function getFeedbackPaginated(limit: number, skip: number): Promise<{ feedback: Feedback[]; total: number }> {
  const feedbackCollection = await getFeedbackCollection();
  const total = await feedbackCollection.countDocuments();
  const feedbackDocs = await feedbackCollection.find({})
    .sort({ submittedAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
  return {
    feedback: feedbackDocs.map(doc => ({ ...doc, id: doc._id.toString() })) as Feedback[],
    total,
  };
}
