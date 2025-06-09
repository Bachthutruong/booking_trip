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
import type { Trip, JoinTripFormValues, DistrictSurcharge, DiscountCode, AdditionalService } from '@/lib/types';
import { Loader2, Users, MapPin, Phone, FileText, TicketPercent } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDiscountCodeDetails } from "@/actions/configActions"; // Import for discount validation
import { useDebounce } from '@/hooks/use-debounce'; // Assuming a useDebounce hook exists
import { Badge } from '@/components/ui/badge';
import { Checkbox } from "@/components/ui/checkbox";

const joinTripFormSchema = z.object({
  tripId: z.string(), // Hidden, will be set from props
  name: z.string().min(2, "Name must be at least 2 characters.").max(100),
  phone: z.string().regex(/^\+?[0-9\s-]{10,15}$/, "Invalid phone number format."),
  numberOfPeople: z.coerce.number().min(1, "At least one person is required.").max(10, "Max 10 people to join."), // Or some other reasonable limit
  address: z.string().min(5, "Address must be at least 5 characters.").max(200), // Their pickup address
  discountCode: z.string().optional(),
  notes: z.string().max(500, "Notes cannot exceed 500 characters.").optional(),
  district: z.string().optional(), // Add district field
  additionalServiceIds: z.array(z.string()).optional(), // Add additionalServiceIds field
});

interface JoinTripFormProps {
  trip: Trip;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  districts: DistrictSurcharge[]; // Add districts prop
  additionalServices: AdditionalService[]; // Add additionalServices prop
}

export default function JoinTripForm({ trip, isOpen, onOpenChange, districts, additionalServices }: JoinTripFormProps) {
  console.log('Additional Services in JoinTripForm:', additionalServices);
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [initialCalculatedPrice, setInitialCalculatedPrice] = useState(0); // New state for price before discount
  const [priceCalculationLoading, setPriceCalculationLoading] = useState(true);
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);
  const [discountMessage, setDiscountMessage] = useState<string | null>(null);
  const [pricePerPerson, setPricePerPerson] = useState<number>(0);

  const form = useForm<z.infer<typeof joinTripFormSchema>>({
    resolver: zodResolver(joinTripFormSchema),
    defaultValues: {
      tripId: trip.id,
      numberOfPeople: 1,
      notes: "",
      district: districts.find(d => d.surchargeAmount === 0)?.districtName || districts[0]?.districtName || "", // Default district
      additionalServiceIds: [], // Initialize additionalServiceIds
    },
  });

  // Watch for changes in numberOfPeople and district
  const numberOfPeople = form.watch("numberOfPeople");
  const selectedDistrict = form.watch("district");
  const watchDiscountCode = form.watch("discountCode");
  const watchAdditionalServices = form.watch("additionalServiceIds"); // Watch additional services
  const debouncedDiscountCode = useDebounce(watchDiscountCode, 500); // Debounce discount code

  // Effect to validate and apply discount
  useEffect(() => {
    const validateAndApplyDiscount = async () => {
      if (typeof debouncedDiscountCode !== 'string' || debouncedDiscountCode.trim() === '') {
        setAppliedDiscount(null);
        setDiscountMessage(null);
        return;
      }
      const discountDetails = await getDiscountCodeDetails(debouncedDiscountCode);
      if (discountDetails && discountDetails.isActive) {
        setAppliedDiscount(discountDetails);
        setDiscountMessage(`Applied: ${discountDetails.description || discountDetails.code} (${discountDetails.type === 'fixed' ? discountDetails.value.toLocaleString() + ' 元' : discountDetails.value + '%'})`);
      } else {
        setAppliedDiscount(null);
        setDiscountMessage("Invalid or expired discount code.");
      }
    };
    validateAndApplyDiscount();
  }, [debouncedDiscountCode]);

  // Effect to recalculate price when inputs change
  useEffect(() => {
    const calculatePrice = async () => {
      setPriceCalculationLoading(true);
      try {
        const result = await getItineraryDetailsForCalculation(trip.itineraryId, selectedDistrict);
        if (result) {
          let newPrice = result.pricePerPerson * numberOfPeople;
          newPrice += result.districtSurchargeAmount;

          // Calculate additional services price
          let servicesPrice = 0;
          if (watchAdditionalServices) {
            servicesPrice = watchAdditionalServices.reduce((total, serviceId) => {
              const service = additionalServices.find(s => s.id === serviceId);
              return total + (service?.price || 0);
            }, 0);
          }
          newPrice += servicesPrice;

          // Apply discount if available
          let priceAfterDiscount = newPrice;
          if (appliedDiscount) {
            if (appliedDiscount.type === 'fixed') {
              priceAfterDiscount -= appliedDiscount.value;
            } else if (appliedDiscount.type === 'percentage') {
              priceAfterDiscount -= priceAfterDiscount * (appliedDiscount.value / 100);
            }
          }
          setInitialCalculatedPrice(newPrice); // Store price before discount
          setCalculatedPrice(Math.max(0, priceAfterDiscount));
          setPricePerPerson(result.pricePerPerson);
        } else {
          setCalculatedPrice(0);
          setInitialCalculatedPrice(0);
        }
      } catch (error) {
        console.error("Error calculating price:", error);
        setCalculatedPrice(0);
        setInitialCalculatedPrice(0);
      } finally {
        setPriceCalculationLoading(false);
      }
    };

    if (trip.itineraryId && numberOfPeople > 0) {
      calculatePrice();
    } else {
      setCalculatedPrice(0);
      setInitialCalculatedPrice(0);
      setPriceCalculationLoading(false);
    }
  }, [numberOfPeople, selectedDistrict, trip.itineraryId, appliedDiscount, watchAdditionalServices]); // Add watchAdditionalServices to dependencies

  // --- BEGIN: Price breakdown calculation ---
  const priceBreakdown = (() => {
    const numPeople = numberOfPeople || 1;
    const districtSurchargeItem = districts.find(d => d.districtName === selectedDistrict);
    const districtSurchargeAmount = districtSurchargeItem ? districtSurchargeItem.surchargeAmount : 0;
    const districtSurchargeLabel = districtSurchargeItem && districtSurchargeItem.surchargeAmount > 0
      ? `${districtSurchargeItem.districtName}: +${districtSurchargeItem.surchargeAmount.toLocaleString()} 元`
      : null;

    let services: { name: string; price: number }[] = [];
    if (watchAdditionalServices) {
      services = watchAdditionalServices.map(serviceId => {
        const service = additionalServices.find(s => s.id === serviceId);
        return service ? { name: service.name, price: service.price } : null;
      }).filter(Boolean) as { name: string; price: number }[];
    }

    let basePrice = (pricePerPerson || 0) * numPeople;
    let discountValue = 0;
    let discountLabel = null;
    let subtotal = basePrice + districtSurchargeAmount + services.reduce((t, s) => t + s.price, 0);
    if (appliedDiscount) {
      if (appliedDiscount.type === 'fixed') {
        discountValue = appliedDiscount.value;
        discountLabel = `Discount: -${appliedDiscount.value.toLocaleString()} 元`;
      } else if (appliedDiscount.type === 'percentage') {
        discountValue = subtotal * (appliedDiscount.value / 100);
        discountLabel = `Discount: -${appliedDiscount.value}% (-${discountValue.toLocaleString()} 元)`;
      }
    }
    return {
      basePrice,
      numPeople,
      districtSurchargeAmount,
      districtSurchargeLabel,
      services,
      discountValue,
      discountLabel,
      subtotal,
    };
  })();
  // --- END: Price breakdown calculation ---

  async function onSubmit(values: z.infer<typeof joinTripFormSchema>) {
    setIsSubmitting(true);
    try {
      const submissionData: JoinTripFormValues = {
        ...values,
        pricePaid: calculatedPrice, // Pass the calculated price
        discountCode: appliedDiscount ? appliedDiscount.code : undefined, // Pass the applied discount code
        additionalServiceIds: values.additionalServiceIds || [], // Pass selected services
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Join Trip: {trip.itineraryName}</DialogTitle>
          <DialogDescription>
            Fill in your details to join this trip on {new Date(trip.date).toLocaleDateString()}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <div className="mt-8 pt-4 border-t border-dashed border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold font-headline mb-2 flex items-center">
                <TicketPercent className="h-5 w-5 mr-2 text-primary" />
                Estimated Price for You:
              </h3>
              {priceCalculationLoading ? (
                <p className="text-lg text-muted-foreground flex items-center">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> Calculating price...
                </p>
              ) : (
                <>
                  {appliedDiscount && calculatedPrice < initialCalculatedPrice ? (
                    <div className="flex flex-col">
                      <p className="text-sm text-muted-foreground line-through">Original: {initialCalculatedPrice.toLocaleString()} 元</p>
                      <p className="text-3xl font-extrabold text-primary">{calculatedPrice.toLocaleString()} 元</p>
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">{discountMessage}</p>
                    </div>
                  ) : (
                    <p className="text-3xl font-extrabold text-primary">{calculatedPrice.toLocaleString()} 元</p>
                  )}
                  {/* --- BEGIN: Price breakdown details --- */}
                  <div className="mt-4 bg-white dark:bg-muted/30 rounded-lg border p-4 text-xs">
                    <div className="flex justify-between mb-1">
                      <span>Itinerary price ({priceBreakdown.numPeople} person{priceBreakdown.numPeople > 1 ? 's' : ''}):</span>
                      <span>{(priceBreakdown.basePrice).toLocaleString()} 元</span>
                    </div>
                    {priceBreakdown.districtSurchargeLabel && (
                      <div className="flex justify-between mb-1">
                        <span>District surcharge</span>
                        <span>{priceBreakdown.districtSurchargeLabel}</span>
                      </div>
                    )}
                    {priceBreakdown.services.length > 0 && (
                      <div className="mb-1">
                        <span>Additional services:</span>
                        <ul className="ml-4 mt-1">
                          {priceBreakdown.services.map((s, idx) => (
                            <li key={idx} className="flex justify-between">
                              <span>{s.name}</span>
                              <span>+{s.price.toLocaleString()} 元</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                      <span>Subtotal:</span>
                      <span>{priceBreakdown.subtotal.toLocaleString()} 元</span>
                    </div>
                    {priceBreakdown.discountLabel && (
                      <div className="flex justify-between text-green-700 dark:text-green-400">
                        <span>{priceBreakdown.discountLabel}</span>
                        <span>-{priceBreakdown.discountValue.toLocaleString()} 元</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold border-t pt-2 mt-2 text-primary text-base">
                      <span>Total:</span>
                      <span>{calculatedPrice.toLocaleString()} 元</span>
                    </div>
                  </div>
                  {/* --- END: Price breakdown details --- */}
                </>
              )}
              <FormDescription className="mt-2">This is the estimated price for your portion of the trip. Final price may vary.</FormDescription>
            </div>
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
                            {district.districtName} {district.surchargeAmount > 0 ? `(+${district.surchargeAmount.toLocaleString()} 元)` : ''}
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

            {/* Conditionally render additional services field */}
            {additionalServices.length > 0 && (
              <FormField
                control={form.control}
                name="additionalServiceIds"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel className="text-base">Additional Services</FormLabel>
                    <FormDescription>Select any extra services you'd like to include.</FormDescription>
                    {additionalServices.map((service) => (
                      <FormField
                        key={service.id}
                        control={form.control}
                        name="additionalServiceIds"
                        render={({ field: itemField }) => {
                          return (
                            <FormItem
                              key={service.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={itemField.value?.includes(service.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? itemField.onChange([...(itemField.value || []), service.id])
                                      : itemField.onChange(
                                        itemField.value?.filter(
                                          (value) => value !== service.id
                                        )
                                      );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal flex-grow cursor-pointer">
                                {service.name} (+{service.price.toLocaleString()} 元)
                                {service.description && <p className="text-xs text-muted-foreground italic">{service.description}</p>}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
