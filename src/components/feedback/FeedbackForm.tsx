'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/toast";
import { submitFeedback } from '@/actions/feedbackActions';
import { getTripsForUserFeedback } from '@/actions/tripActions'; // Action to get user's trips
import type { FeedbackFormValues } from '@/lib/types';
import { Loader2, User, Mail, Hash, MessageCircle } from "lucide-react";

const feedbackFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(100),
  email: z.string().email("Invalid email address."),
  tripId: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters long.").max(1000),
});

export default function FeedbackForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userTrips, setUserTrips] = useState<{ id: string; name: string }[]>([]);
  // TODO: In a real app with auth, get user's identifier (e.g., email or phone)
  // For now, we'll fetch all trips or leave it empty.
  // const userIdentifier = "user_phone_or_email"; // Replace with actual user identifier if available

  const form = useForm<z.infer<typeof feedbackFormSchema>>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  // useEffect(() => {
  //   async function fetchUserTrips() {
  //     if (userIdentifier) { // Only fetch if user is identified
  //       const trips = await getTripsForUserFeedback(userIdentifier);
  //       setUserTrips(trips);
  //     }
  //   }
  //   fetchUserTrips();
  // }, [userIdentifier]);


  async function onSubmit(values: z.infer<typeof feedbackFormSchema>) {
    setIsSubmitting(true);
    try {
      const result = await submitFeedback(values);
      if (result.success) {
        toast({
          title: "Feedback Submitted!",
          description: result.message,
        });
        form.reset(); // Reset form on successful submission
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><User className="h-4 w-4 mr-2 text-primary"/>Your Name *</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><Mail className="h-4 w-4 mr-2 text-primary"/>Your Email *</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {userTrips.length > 0 && (
          <FormField
            control={form.control}
            name="tripId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><Hash className="h-4 w-4 mr-2 text-primary"/>Related Trip (Optional)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a trip if applicable" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {userTrips.map(trip => (
                      <SelectItem key={trip.id} value={trip.id}>
                        {trip.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><MessageCircle className="h-4 w-4 mr-2 text-primary"/>Your Feedback *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us about your experience..."
                  className="resize-y min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Submitting...
            </>
          ) : (
            'Send Feedback'
          )}
        </Button>
      </form>
    </Form>
  );
}
