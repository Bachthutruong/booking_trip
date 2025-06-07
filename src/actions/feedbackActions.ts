'use server';

import { feedbackDB } from '@/lib/data';
import type { Feedback, FeedbackFormValues } from '@/lib/types';
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

  const newFeedback: Feedback = {
    id: `feedback_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: data.name,
    email: data.email,
    tripId: data.tripId,
    message: data.message,
    submittedAt: new Date().toISOString(),
  };

  feedbackDB.push(newFeedback);
  // console.log('New feedback submitted:', newFeedback);
  
  // Potentially revalidate a path if there's an admin page for feedback
  // revalidatePath('/admin/feedback');

  return { success: true, message: 'Thank you for your feedback!' };
}
