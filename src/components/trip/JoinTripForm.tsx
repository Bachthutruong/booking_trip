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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast"; // Corrected import path
import { joinTrip, getItineraryDetailsForCalculation } from '@/actions/tripActions';
import type { Trip, JoinTripFormValues, DistrictSurcharge } from '@/lib/types';
import { Loader2, Users, MapPin, Phone, FileText, TicketPercent } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const joinTripFormSchema = z.object({
  tripId: z.string(), // Hidden, will be set from props
  name: z.string().min(2, "Name must be at least 2 characters.").max(100),
  phone: z.string().regex(/^\+?[0-9\s-]{10,15}$/, "Invalid phone number format."),
  numberOfPeople: z.coerce.number().min(1, "At least one person is required.").max(10, "Max 10 people to join."), // Or some other reasonable limit
  address: z.string().min(5, "Address must be at least 5 characters.").max(200), // Their pickup address
  discountCode: z.string().optional(),
  notes: z.string().max(500, "Notes cannot exceed 500 characters.").optional(),
  district: z.string().optional(), // Add district field
});

interface JoinTripFormProps {
  trip: Trip;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  districts: DistrictSurcharge[]; // Add districts prop
}

export default function JoinTripForm({ trip, isOpen, onOpenChange, districts }: JoinTripFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [priceCalculationLoading, setPriceCalculationLoading] = useState(true); // New state for loading

  const form = useForm<z.infer<typeof joinTripFormSchema>>({
    resolver: zodResolver(joinTripFormSchema),
    defaultValues: {
      tripId: trip.id,
      numberOfPeople: 1,
      notes: "",
      district: districts.find(d => d.surchargeAmount === 0)?.districtName || districts[0]?.districtName || "", // Default district
    },
  });

  // Watch for changes in numberOfPeople and district
  const numberOfPeople = form.watch("numberOfPeople");
  const selectedDistrict = form.watch("district");

  // Effect to recalculate price when inputs change
  useEffect(() => {
    const calculatePrice = async () => {
      setPriceCalculationLoading(true);
      try {
        const result = await getItineraryDetailsForCalculation(trip.itineraryId, selectedDistrict);
        if (result) {
          let newPrice = result.pricePerPerson * numberOfPeople;
          newPrice += result.districtSurchargeAmount;
          // TODO: Implement discount code calculation here if needed on client side
          setCalculatedPrice(newPrice);
        } else {
          setCalculatedPrice(0);
        }
      } catch (error) {
        console.error("Error calculating price:", error);
        setCalculatedPrice(0);
      } finally {
        setPriceCalculationLoading(false);
      }
    };

    if (trip.itineraryId && numberOfPeople > 0) {
      calculatePrice();
    } else {
      setCalculatedPrice(0);
      setPriceCalculationLoading(false);
    }
  }, [numberOfPeople, selectedDistrict, trip.itineraryId]);

  async function onSubmit(values: z.infer<typeof joinTripFormSchema>) {
    setIsSubmitting(true);
    try {
      const submissionData: JoinTripFormValues = {
        ...values,
        pricePaid: calculatedPrice, // Pass the calculated price
      };

      const result = await joinTrip(submissionData);
      if (result.success) {
        toast({
          title: "Successfully Joined!",
          description: result.message, // Use the message from the server action
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

            {/* Conditionally render District field for relevant itinerary types */}
            {(trip.itineraryType === 'airport_pickup' || trip.itineraryType === 'airport_dropoff' || trip.itineraryType === 'tourism') && (
              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-primary" />District (for pickup/dropoff in Hanoi)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a district" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {districts.map((district) => (
                          <SelectItem key={district.districtName} value={district.districtName}>
                            {district.districtName} {district.surchargeAmount > 0 ? `(+${district.surchargeAmount.toLocaleString()} VND)` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Surcharges may apply for some districts.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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

            {/* Display Calculated Price */}
            <div className="flex items-center justify-between text-lg font-semibold py-2 px-4 bg-secondary/20 rounded-md">
              <span className="text-primary">Estimated Total Price:</span>
              {priceCalculationLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <span className="text-right">{calculatedPrice.toLocaleString()} VND</span>
              )}
            </div>

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
