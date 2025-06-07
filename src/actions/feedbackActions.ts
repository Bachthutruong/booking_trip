
'use server';

import { getFeedbackCollection } from '@/lib/mongodb';
import type { Feedback, FeedbackFormValues } from '@/lib/types';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const feedbackSchema = z.object({
  name: z.string().min(1, "Name is required."),
  email: z.string().email("Invalid email address."),
  tripId: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters long."),
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
      return { success: true, message: 'Thank you for your feedback!' };
    }
    return { success: false, message: 'Failed to submit feedback.' };
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return { success: false, message: 'An unexpected error occurred while submitting feedback.' };
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
