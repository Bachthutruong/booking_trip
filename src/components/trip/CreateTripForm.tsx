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
import { CalendarIcon, Info, Loader2, Users, MapPin, Phone, Mail, FileText, Tag, Palette, Wand2, TicketPercent, Clock } from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect, useMemo } from "react";
import { createTrip } from "@/actions/tripActions";
import { useToast } from "@/hooks/use-toast"; // Corrected import path
import type { Itinerary, DistrictSurcharge, AdditionalService, CreateTripFormValues as FormValues } from '@/lib/types'; // Renamed to FormValues
import { useRouter } from "next/navigation";
import { AVAILABLE_SECONDARY_CONTACT_TYPES } from "@/lib/constants";
import ItineraryCard from "../itinerary/ItineraryCard"; // Import ItineraryCard

const createTripFormSchema = z.object({
  itineraryId: z.string(), // Will be set from props, not user input here
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
});


interface CreateTripFormProps {
  itinerary: Itinerary;
  districts: DistrictSurcharge[];
  additionalServices: AdditionalService[];
  availableTimes: string[];
}

export default function CreateTripForm({ itinerary, districts, additionalServices, availableTimes }: CreateTripFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(itinerary.pricePerPerson);
  const [secondaryContactType, setSecondaryContactType] = useState<string | undefined>();

  const form = useForm<z.infer<typeof createTripFormSchema>>({
    resolver: zodResolver(createTripFormSchema),
    defaultValues: {
      itineraryId: itinerary.id,
      numberOfPeople: 1,
      additionalServiceIds: [],
      notes: "",
      district: districts.find(d => d.surchargeAmount === 0)?.districtName || districts[0]?.districtName || "", // Default to Hoan Kiem or first
    },
  });

  const { watch } = form;
  const watchNumberOfPeople = watch("numberOfPeople");
  const watchDistrict = watch("district");
  const watchAdditionalServices = watch("additionalServiceIds");

  useEffect(() => {
    const numPeople = watchNumberOfPeople || 1;
    const districtSurcharge = districts.find(d => d.districtName === watchDistrict)?.surchargeAmount || 0;
    
    let servicesPrice = 0;
    if (watchAdditionalServices) {
      servicesPrice = watchAdditionalServices.reduce((total, serviceId) => {
        const service = additionalServices.find(s => s.id === serviceId);
        return total + (service?.price || 0);
      }, 0);
    }
    
    setCalculatedPrice((itinerary.pricePerPerson * numPeople) + districtSurcharge + servicesPrice);
  }, [watchNumberOfPeople, watchDistrict, watchAdditionalServices, itinerary.pricePerPerson, districts, additionalServices]);

  async function onSubmit(values: z.infer<typeof createTripFormSchema>) {
    setIsSubmitting(true);

    const submissionData: FormValues & { discountCode?: string, secondaryContact?: string } = {
      ...values,
      date: values.date, // Form values are already Date object from react-hook-form Controller
      additionalServiceIds: values.additionalServiceIds || [],
      discountCode: values.discountCode,
      secondaryContact: values.secondaryContactType && values.secondaryContactValue ? `${values.secondaryContactType}: ${values.secondaryContactValue}` : undefined,
    };
    
    // Remove temporary fields for submission
    // @ts-ignore
    delete submissionData.secondaryContactType;
    // @ts-ignore
    delete submissionData.secondaryContactValue;


    try {
      // Convert date to YYYY-MM-DD string for server action
      const result = await createTrip({
        ...submissionData,
        // @ts-ignore // Date object is fine for server action if handled
        date: format(values.date, "yyyy-MM-dd"), 
      });

      if (result.success) {
        toast({
          title: "Trip Created!",
          description: result.message,
        });
        router.push(`/my-trips?tripId=${result.tripId}&phone=${submissionData.contactPhone}`); // Redirect to manage the new trip, include phone
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
  
  const addressFields = useMemo(() => {
    switch (itinerary.type) {
      case 'airport_pickup': // Về HN (từ sân bay về HN) -> người dùng nhập địa chỉ xuống xe
        return (
          <FormField
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
          />
        );
      case 'airport_dropoff': // Từ HN đi sân bay -> người dùng nhập địa điểm lên xe
      case 'tourism': // Du lịch -> người dùng nhập địa điểm lên xe
        return (
          <FormField
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
        );
      default:
        return null;
    }
  }, [itinerary.type, form.control]);


  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-1 order-last lg:order-first mt-8 lg:mt-0">
        <h2 className="text-2xl font-headline font-semibold mb-4">Selected Itinerary</h2>
        <ItineraryCard itinerary={itinerary} className="shadow-lg sticky top-24" />
        <Card className="mt-6 shadow-lg p-6 bg-primary/5">
            <h3 className="text-xl font-semibold mb-3 flex items-center"><Tag className="h-5 w-5 mr-2 text-primary"/>Estimated Price</h3>
            <p className="text-3xl font-bold text-primary">
              {calculatedPrice.toLocaleString()} VND
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Final price may vary based on discount codes.
            </p>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 bg-card p-6 sm:p-10 rounded-xl shadow-2xl">
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
                          disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) } // Disable past dates
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
                        {availableTimes.length > 0 ? availableTimes.map(time => (
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
              name="district"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Palette className="h-4 w-4 mr-2 text-primary" />District (for pickup/dropoff in Hanoi)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your district" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {districts.map(district => (
                        <SelectItem key={district.id} value={district.districtName}>
                          {district.districtName} (+{district.surchargeAmount.toLocaleString()} VND)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Surcharges may apply for some districts.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    <FormLabel className="flex items-center"><Mail className="h-4 w-4 mr-2 text-primary" />Secondary Contact Type</FormLabel>
                    <Select onValueChange={(value) => { field.onChange(value); setSecondaryContactType(value); }} defaultValue={field.value}>
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
                        <Input placeholder={`Your ${secondaryContactType || 'contact'}`} {...field} disabled={!secondaryContactType} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            {additionalServices.length > 0 && (
              <FormField
                control={form.control}
                name="additionalServiceIds"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base flex items-center"><Wand2 className="h-4 w-4 mr-2 text-primary" />Additional Services</FormLabel>
                      <FormDescription>
                        Enhance your trip with these optional services.
                      </FormDescription>
                    </div>
                    {additionalServices.map((service) => (
                      <FormField
                        key={service.id}
                        control={form.control}
                        name="additionalServiceIds"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={service.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(service.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), service.id])
                                      : field.onChange(
                                          (field.value || []).filter(
                                            (value) => value !== service.id
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {service.name} (+{service.price.toLocaleString()} VND)
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

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-card text-card-foreground rounded-lg border shadow-sm", className)}>
    {children}
  </div>
);
