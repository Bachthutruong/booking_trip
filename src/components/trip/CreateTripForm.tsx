'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { CalendarIcon, Info, Loader2, Users, MapPin, Phone, Mail, FileText, Tag, Palette, Wand2, TicketPercent, Clock, Contact } from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect, useMemo } from "react";
import { createTrip } from "@/actions/tripActions";
import { useToast } from "@/hooks/use-toast";
import type { Itinerary, DistrictSurcharge, AdditionalService, CreateTripFormValues as FormValues, DiscountCode } from '@/lib/types';
import { useRouter } from "next/navigation";
import { AVAILABLE_SECONDARY_CONTACT_TYPES } from "@/lib/constants";
import ItineraryCard from "../itinerary/ItineraryCard";
import { getDiscountCodeDetails } from "@/actions/configActions"; // For discount validation


const createTripFormSchema = z.object({
  itineraryId: z.string(),
  date: z.date({ required_error: "Please select a date." }),
  time: z.string({ required_error: "Please select a time." }),
  numberOfPeople: z.coerce.number().min(1, "At least one person is required.").max(50, "Maximum 50 people."),
  pickupAddress: z.string().optional(),
  dropoffAddress: z.string().optional(),
  contactName: z.string().min(2, "Contact name must be at least 2 characters.").max(100),
  contactPhone: z.string().regex(/^\+?[0-9\s-]{10,15}$/, "Invalid phone number format."),
  secondaryContactType: z.string().optional(),
  secondaryContactValue: z.string().optional(),
  notes: z.string().max(500, "Notes cannot exceed 500 characters.").optional(),
  district: z.string().optional(),
  additionalServiceIds: z.array(z.string()).optional(),
  discountCode: z.string().optional(),
}).superRefine((data, ctx) => {
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  sevenDaysFromNow.setHours(0, 0, 0, 0); // Normalize to start of day for comparison

  if (data.date && data.date < sevenDaysFromNow) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Trip date must be at least 7 days from today.",
      path: ["date"],
    });
  }

  if (data.secondaryContactType && !data.secondaryContactValue) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please enter contact details for the selected type.",
      path: ["secondaryContactValue"],
    });
  }
  if (!data.secondaryContactType && data.secondaryContactValue) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please select a contact type.",
      path: ["secondaryContactType"],
    });
  }
  // Address validation based on itinerary type (will be handled in server action for robustness, but good for client too)
  // For example:
  // if (itineraryType === 'airport_pickup' && !data.dropoffAddress) { ... }
  // This logic is better placed in the server action to prevent bypass.
});


interface CreateTripFormProps {
  itinerary: Itinerary;
  districts: DistrictSurcharge[];
  additionalServices: AdditionalService[];
  // availableTimes are now part of itinerary object
}

export default function CreateTripForm({ itinerary, districts, additionalServices }: CreateTripFormProps) {
  console.log('Additional Services in CreateTripForm:', additionalServices);
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(itinerary.pricePerPerson);
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);
  const [discountMessage, setDiscountMessage] = useState<string | null>(null);
  const [debouncedDiscountCode, setDebouncedDiscountCode] = useState<string>('');
  const [initialCalculatedPrice, setInitialCalculatedPrice] = useState(itinerary.pricePerPerson);

  const form = useForm<z.infer<typeof createTripFormSchema>>({
    resolver: zodResolver(createTripFormSchema),
    defaultValues: {
      itineraryId: itinerary.id,
      numberOfPeople: 1,
      additionalServiceIds: [],
      notes: "",
      district: districts.find(d => d.surchargeAmount === 0)?.districtName || districts[0]?.districtName || "",
      time: itinerary.availableTimes.length > 0 ? itinerary.availableTimes[0] : "",
    },
  });

  const { watch, setValue } = form;
  const watchNumberOfPeople = watch("numberOfPeople");
  const watchDistrict = watch("district");
  const watchAdditionalServices = watch("additionalServiceIds");
  const watchDiscountCode = watch("discountCode");

  // Debounce discount code validation
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedDiscountCode(watchDiscountCode || '');
    }, 500); // 500ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [watchDiscountCode]);

  useEffect(() => {
    const validateAndApplyDiscount = async () => {
      if (debouncedDiscountCode.trim() === '') {
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


  useEffect(() => {
    const numPeople = watchNumberOfPeople || 1;
    const districtSurchargeItem = districts.find(d => d.districtName === watchDistrict);
    const districtSurchargeAmount = districtSurchargeItem ? districtSurchargeItem.surchargeAmount : 0;

    let servicesPrice = 0;
    if (watchAdditionalServices) {
      servicesPrice = watchAdditionalServices.reduce((total, serviceId) => {
        const service = additionalServices.find(s => s.id === serviceId);
        return total + (service?.price || 0);
      }, 0);
    }

    let basePrice = (itinerary.pricePerPerson * numPeople) + districtSurchargeAmount + servicesPrice;

    if (appliedDiscount) {
      if (appliedDiscount.type === 'fixed') {
        basePrice -= appliedDiscount.value;
      } else if (appliedDiscount.type === 'percentage') {
        basePrice -= basePrice * (appliedDiscount.value / 100);
      }
    }
    setCalculatedPrice(Math.max(0, basePrice));
    setInitialCalculatedPrice(Math.max(0, basePrice));

  }, [watchNumberOfPeople, watchDistrict, watchAdditionalServices, appliedDiscount, itinerary.pricePerPerson, districts, additionalServices]);

  // --- BEGIN: Price breakdown calculation ---
  const priceBreakdown = useMemo(() => {
    const numPeople = watchNumberOfPeople || 1;
    const districtSurchargeItem = districts.find(d => d.districtName === watchDistrict);
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

    let basePrice = itinerary.pricePerPerson * numPeople;
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
  }, [watchNumberOfPeople, watchDistrict, watchAdditionalServices, appliedDiscount, itinerary.pricePerPerson, districts, additionalServices]);
  // --- END: Price breakdown calculation ---

  async function onSubmit(values: z.infer<typeof createTripFormSchema>) {
    setIsSubmitting(true);

    if (itinerary.type === 'airport_pickup' && !values.dropoffAddress) {
      form.setError("dropoffAddress", { type: "manual", message: "Drop-off address is required for airport pickups." });
      setIsSubmitting(false);
      return;
    }
    if ((itinerary.type === 'airport_dropoff' || itinerary.type === 'tourism') && !values.pickupAddress) {
      form.setError("pickupAddress", { type: "manual", message: "Pickup address is required for this itinerary type." });
      setIsSubmitting(false);
      return;
    }


    const submissionData: FormValues & { date: string; secondaryContact?: string } = {
      ...values,
      // @ts-ignore
      date: format(values.date, "yyyy-MM-dd"), // Format date to string for server action
      additionalServiceIds: values.additionalServiceIds || [],
      discountCode: appliedDiscount ? appliedDiscount.code : undefined, // Submit the validated code
      secondaryContact: values.secondaryContactType && values.secondaryContactValue ? `${values.secondaryContactType}: ${values.secondaryContactValue}` : undefined,
    };

    try {
      const result = await createTrip(submissionData);

      if (result.success && result.tripId) {
        toast({
          title: "Trip Created!",
          description: result.message,
        });
        router.push(`/my-trips?tripId=${result.tripId}&phone=${submissionData.contactPhone}`);
      } else {
        toast({
          title: "Error Creating Trip",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const addressFields = useMemo(() => {
    switch (itinerary.type) {
      case 'airport_pickup':
        return [
          <FormField
            key="district-dropoff"
            control={form.control}
            name="district"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-primary" />District (for drop-off in Hanoi)</FormLabel>
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
          />,
          <FormField
            key="dropoff-address"
            control={form.control}
            name="dropoffAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-primary" />Drop-off Address in Hanoi *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 123 P. Hàng Bông, Hoàn Kiếm" {...field} />
                </FormControl>
                <FormDescription>Where should we drop you off in Hanoi?</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />,
          
        ];
      case 'airport_dropoff':
      case 'tourism':
        return [
          <FormField
            key="district-pickup"
            control={form.control}
            name="district"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-primary" />District (for pickup in Hanoi)</FormLabel>
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
          />,
          <FormField
            key="pickup-address"
            control={form.control}
            name="pickupAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-primary" />Pickup Address in Hanoi *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 456 P. Lý Thường Kiệt, Hoàn Kiếm" {...field} />
                </FormControl>
                <FormDescription>Where should we pick you up from?</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

        ];
      default:
        return null;
    }
  }, [itinerary.type, form.control, districts]);


  return (
    <div className=" mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-1 order-last lg:order-first mt-8 lg:mt-0">
        <h2 className="text-2xl font-headline font-semibold mb-4">Selected Itinerary</h2>
        <ItineraryCard itinerary={itinerary} className="shadow-lg sticky top-24" />
      </div>

      <div className="lg:col-span-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 bg-card p-6 sm:p-10 rounded-xl shadow-2xl">
            <Card className="mb-6 shadow-lg p-6 bg-primary/5">
              <h3 className="text-xl font-semibold mb-3 flex items-center"><Tag className="h-5 w-5 mr-2 text-primary" />Estimated Price</h3>
              <p className="text-3xl font-bold text-primary">
                {calculatedPrice.toLocaleString()} 元
              </p>
              {discountMessage && <p className={`text-xs mt-1 ${appliedDiscount ? 'text-green-600' : 'text-destructive'}`}>{discountMessage}</p>}
              <p className="text-xs text-muted-foreground mt-1">
                Final price based on selections.
              </p>
              {/* --- BEGIN: Price breakdown details --- */}
              <div className="mt-4 bg-white dark:bg-muted/30 rounded-lg border p-4 text-sm">
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
                    <span>{priceBreakdown.discountLabel.replace('Giảm giá:', 'Discount')}</span>
                    <span>-{priceBreakdown.discountValue.toLocaleString()} 元</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t pt-2 mt-2 text-primary text-lg">
                  <span>Total:</span>
                  <span>{calculatedPrice.toLocaleString()} 元</span>
                </div>
              </div>
              {/* --- END: Price breakdown details --- */}
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center"><CalendarIcon className="h-4 w-4 mr-2 text-primary" />Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => {
                            const sevenDaysFromNow = new Date();
                            sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
                            sevenDaysFromNow.setHours(0, 0, 0, 0); // Normalize to start of day for comparison
                            return date < sevenDaysFromNow;
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Clock className="h-4 w-4 mr-2 text-primary" />Time *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a time slot" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {itinerary.availableTimes.length > 0 ? itinerary.availableTimes.map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        )) : <SelectItem value="" disabled>No times available</SelectItem>}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="numberOfPeople"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Users className="h-4 w-4 mr-2 text-primary" />Number of People *</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 2" {...field} min="1" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {addressFields}

            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Users className="h-4 w-4 mr-2 text-primary" />Contact Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Phone className="h-4 w-4 mr-2 text-primary" />Contact Phone *</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="Your phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="secondaryContactType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Contact className="h-4 w-4 mr-2 text-primary" />Secondary Contact Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select contact type (Optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {AVAILABLE_SECONDARY_CONTACT_TYPES.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="secondaryContactValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center opacity-0 md:opacity-100">.</FormLabel> {/* Spacer for alignment */}
                    <FormControl>
                      <Input placeholder={`Your ${watch("secondaryContactType") || 'contact detail'}`} {...field} disabled={!watch("secondaryContactType")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><FileText className="h-4 w-4 mr-2 text-primary" />Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any special requests or additional information?"
                      className="resize-none"
                      {...field}
                    />
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
                    <Input placeholder="Enter discount code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="mt-8 pt-4 border-t border-dashed border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold font-headline mb-2 flex items-center">
                <Tag className="h-5 w-5 mr-2 text-primary" />
                Estimated Total Price:
              </h3>
              {appliedDiscount && calculatedPrice < initialCalculatedPrice ? (
                <div className="flex flex-col">
                  <p className="text-sm text-muted-foreground line-through">Original: {initialCalculatedPrice.toLocaleString()} 元</p>
                  <p className="text-3xl font-extrabold text-primary">{calculatedPrice.toLocaleString()} 元</p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">{discountMessage}</p>
                </div>
              ) : (
                <p className="text-3xl font-extrabold text-primary">{calculatedPrice.toLocaleString()} 元</p>
              )}
              <FormDescription className="mt-2">Final price may vary based on exact details and currency conversion.</FormDescription>
            </div>

            <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                'Create Trip Request'
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

// Using ShadCN Card as a simple div with styling for layout consistency
const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-card text-card-foreground rounded-lg border shadow-sm", className)}>
    {children}
  </div>
);
