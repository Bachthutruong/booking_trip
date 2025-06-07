'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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
import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { joinTrip } from '@/actions/tripActions';
import type { Trip, JoinTripFormValues } from '@/lib/types';
import { Loader2, Users, MapPin, Phone, FileText, TicketPercent } from "lucide-react";
import { useRouter } from "next/navigation";

const joinTripFormSchema = z.object({
  tripId: z.string(), // Hidden, will be set from props
  name: z.string().min(2, "Name must be at least 2 characters.").max(100),
  phone: z.string().regex(/^\+?[0-9\s-]{10,15}$/, "Invalid phone number format."),
  numberOfPeople: z.coerce.number().min(1, "At least one person is required.").max(10, "Max 10 people to join."), // Or some other reasonable limit
  address: z.string().min(5, "Address must be at least 5 characters.").max(200), // Their pickup address
  discountCode: z.string().optional(),
  notes: z.string().max(500, "Notes cannot exceed 500 characters.").optional(),
});

interface JoinTripFormProps {
  trip: Trip;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function JoinTripForm({ trip, isOpen, onOpenChange }: JoinTripFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof joinTripFormSchema>>({
    resolver: zodResolver(joinTripFormSchema),
    defaultValues: {
      tripId: trip.id,
      numberOfPeople: 1,
      notes: "",
    },
  });

  async function onSubmit(values: z.infer<typeof joinTripFormSchema>) {
    setIsSubmitting(true);
    try {
      const result = await joinTrip(values);
      if (result.success) {
        toast({
          title: "Successfully Joined!",
          description: result.message,
        });
        onOpenChange(false); // Close dialog
        router.push(`/my-trips?phone=${values.phone}`); // Redirect to my-trips with their phone
      } else {
        toast({
          title: "Error Joining Trip",
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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Join Trip: {trip.itineraryName}</DialogTitle>
          <DialogDescription>
            Fill in your details to join this trip on {new Date(trip.date).toLocaleDateString()}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Users className="h-4 w-4 mr-2 text-primary" />Your Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Phone className="h-4 w-4 mr-2 text-primary" />Your Phone Number *</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="e.g., 0912345678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="numberOfPeople"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Users className="h-4 w-4 mr-2 text-primary" />Number of People Joining *</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 1" {...field} min="1" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-primary" />Your Pickup Address *</FormLabel>
                  <FormControl>
                    <Input placeholder="Your address for pickup" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="discountCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><TicketPercent className="h-4 w-4 mr-2 text-primary" />Discount Code (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter if you have one" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><FileText className="h-4 w-4 mr-2 text-primary" />Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any special requests for your group?"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="sm:justify-between gap-2 pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Confirm & Join
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
