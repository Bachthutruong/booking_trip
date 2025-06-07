
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useTransition } from "react";
import { useToast } from "@/hooks/use-toast"; // Corrected path
import { submitFeedback } from '@/actions/feedbackActions';
import { getTripsForUserFeedback } from '@/actions/tripActions';
import type { FeedbackFormValues } from '@/lib/types';
import { Loader2, User, Mail, Hash, MessageCircle, Search, Phone } from "lucide-react";

const feedbackFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(100),
  email: z.string().email("Invalid email address."),
  phoneForTrips: z.string().optional(), // For fetching user's trips
  tripId: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters long.").max(1000),
});

export default function FeedbackForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userTrips, setUserTrips] = useState<{ id: string; name: string }[]>([]);
  const [phoneForTrips, setPhoneForTrips] = useState("");
  const [isFetchingTrips, startFetchingTripsTransition] = useTransition();

  const form = useForm<z.infer<typeof feedbackFormSchema>>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  const handleFetchUserTrips = () => {
    if (!phoneForTrips.trim()) {
      toast({ title: "Phone Number Required", description: "Please enter your phone number to find related trips.", variant: "destructive"});
      return;
    }
    startFetchingTripsTransition(async () => {
      try {
        const trips = await getTripsForUserFeedback(phoneForTrips);
        setUserTrips(trips);
        if (trips.length === 0) {
          toast({ title: "No Trips Found", description: "No completed or confirmed trips found for this phone number." });
        }
      } catch (error) {
        toast({ title: "Error Fetching Trips", description: "Could not fetch your trips.", variant: "destructive" });
      }
    });
  };


  async function onSubmit(values: z.infer<typeof feedbackFormSchema>) {
    setIsSubmitting(true);
    try {
      // Remove phoneForTrips before submitting actual feedback data
      const { phoneForTrips, ...feedbackData } = values;
      const result = await submitFeedback(feedbackData);
      
      if (result.success) {
        toast({
          title: "Feedback Submitted!",
          description: result.message,
        });
        form.reset();
        setUserTrips([]);
        setPhoneForTrips("");
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

        <div className="space-y-2">
            <FormLabel className="flex items-center"><Phone className="h-4 w-4 mr-2 text-primary"/>Your Phone (to find related trips)</FormLabel>
            <div className="flex gap-2">
                <Input 
                    placeholder="Enter phone used for booking" 
                    value={phoneForTrips}
                    onChange={(e) => setPhoneForTrips(e.target.value)}
                    type="tel"
                />
                <Button type="button" variant="outline" onClick={handleFetchUserTrips} disabled={isFetchingTrips || !phoneForTrips.trim()}>
                    {isFetchingTrips ? <Loader2 className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4"/>}
                    <span className="ml-2 hidden sm:inline">Find Trips</span>
                </Button>
            </div>
            <FormDescription>If your feedback is about a specific trip, enter your phone number to select it.</FormDescription>
        </div>
        
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
        <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting || isFetchingTrips}>
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

