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
import { useState, useEffect, useMemo, useRef } from "react";
import { createTrip } from "@/actions/tripActions";
import { useToast } from "@/hooks/use-toast";
import type { Itinerary, DistrictSurcharge, AdditionalService, CreateTripFormValues as FormValues, DiscountCode } from '@/lib/types';
import { useRouter } from "next/navigation";
import { AVAILABLE_SECONDARY_CONTACT_TYPES } from "@/lib/constants";
import ItineraryCard from "../itinerary/ItineraryCard";
import { getDiscountCodeDetails } from "@/actions/configActions"; // For discount validation
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";


const createTripFormSchema = z.object({
  itineraryId: z.string(),
  date: z.date({ required_error: "请选择日期。" }),
  time: z.string({ required_error: "请选择时间。" }),
  numberOfPeople: z.coerce.number().min(1, "至少需要一个人。").max(50, "最多50人。"),
  pickupAddress: z.string().optional(),
  dropoffAddress: z.string().optional(),
  contactName: z.string().min(2, "联系人姓名至少需要2个字符。").max(100),
  contactPhone: z.string().regex(/^\+?[0-9\s-]{10,15}$/, "无效的电话号码格式。"),
  secondaryContactType: z.string().optional(),
  secondaryContactValue: z.string().optional(),
  notes: z.string().max(500, "备注不能超过500个字符。").optional(),
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
      message: "行程日期至少需要7天。",
      path: ["date"],
    });
  }

  if (data.secondaryContactType && !data.secondaryContactValue) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "请输入所选联系方式的详细信息。",
      path: ["secondaryContactValue"],
    });
  }
  if (!data.secondaryContactType && data.secondaryContactValue) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "请选择联系方式类型。",
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
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(itinerary.pricePerPerson);
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);
  const [discountMessage, setDiscountMessage] = useState<string | null>(null);
  const [debouncedDiscountCode, setDebouncedDiscountCode] = useState<string>('');
  const [initialCalculatedPrice, setInitialCalculatedPrice] = useState(itinerary.pricePerPerson);
  const [showTerms, setShowTerms] = useState(false);
  const [termsContent, setTermsContent] = useState<string>("");
  const [agreed, setAgreed] = useState(false);
  const pendingSubmitRef = useRef<z.infer<typeof createTripFormSchema> | null>(null);

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
        setDiscountMessage("无效或过期的折扣码。");
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
        discountLabel = `折扣: -${appliedDiscount.value.toLocaleString()} 元`;
      } else if (appliedDiscount.type === 'percentage') {
        discountValue = subtotal * (appliedDiscount.value / 100);
        discountLabel = `折扣: -${appliedDiscount.value}% (-${discountValue.toLocaleString()} 元)`;
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

  // Fetch terms content on mount
  useEffect(() => {
    fetch("/api/admin/terms")
      .then(res => res.json())
      .then(data => setTermsContent(data.content || ""));
  }, []);

  async function onSubmit(values: z.infer<typeof createTripFormSchema>) {
    // Thay vì submit ngay, mở dialog điều khoản
    pendingSubmitRef.current = values;
    setShowTerms(true);
  }

  async function handleAgreeAndSubmit() {
    setShowTerms(false);
    setIsSubmitting(true);
    const values = pendingSubmitRef.current;
    if (!values) return;
    if (itinerary.type === 'airport_pickup' && !values.dropoffAddress) {
      form.setError("dropoffAddress", { type: "manual", message: "机场接送需填写送达地址。" });
      setIsSubmitting(false);
      return;
    }
    if ((itinerary.type === 'airport_dropoff' || itinerary.type === 'tourism') && !values.pickupAddress) {
      form.setError("pickupAddress", { type: "manual", message: "此行程类型需要填写接送地址。" });
      setIsSubmitting(false);
      return;
    }
    const submissionData: FormValues & { date: string; secondaryContact?: string } = {
      ...values,
      // @ts-ignore
      date: format(values.date, "yyyy-MM-dd"),
      additionalServiceIds: values.additionalServiceIds || [],
      discountCode: appliedDiscount ? appliedDiscount.code : undefined,
      secondaryContact: values.secondaryContactType && values.secondaryContactValue ? `${values.secondaryContactType}: ${values.secondaryContactValue}` : undefined,
    };
    try {
      const result = await createTrip(submissionData);
      if (result.success && result.tripId) {
        toast({ title: "行程已创建！", description: result.message });
        router.push(`/my-trips?tripId=${result.tripId}&phone=${submissionData.contactPhone}&name=${encodeURIComponent(submissionData.contactName)}`);
      } else {
        toast({ title: "创建行程失败", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "意外错误", description: "发生意外错误。请再试一次。", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      pendingSubmitRef.current = null;
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
                <FormLabel className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-primary" />区域（在河内送达）</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择区域" />
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
                <FormDescription>部分区域可能会有附加费。</FormDescription>
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
                <FormLabel className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-primary" />送达地址（在河内）*</FormLabel>
                <FormControl>
                  <Input placeholder="例如：123 P. Hàng Bông, Hoàn Kiếm" {...field} />
                </FormControl>
                <FormDescription>我们将在河内哪里送您？</FormDescription>
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
                <FormLabel className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-primary" />区域（在河内接您）</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择区域" />
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
                <FormDescription>部分区域可能会有附加费。</FormDescription>
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
                <FormLabel className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-primary" />接送地址（在河内）*</FormLabel>
                <FormControl>
                  <Input placeholder="例如：456 P. Lý Thường Kiệt, Hoàn Kiếm" {...field} />
                </FormControl>
                <FormDescription>我们将在河内哪里接您？</FormDescription>
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
    <div className="mx-auto max-w-3xl">
      {/* Thông tin itinerary ở đầu form */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {itinerary.imageUrl && (
            <img src={itinerary.imageUrl} alt={itinerary.name} className="w-full md:w-64 h-40 object-cover rounded-lg shadow" />
          )}
          <div className="flex-1">
            <h2 className="text-2xl font-headline font-semibold mb-2">{itinerary.name}</h2>
            <div className="mb-2 text-muted-foreground">{itinerary.description}</div>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="flex items-center"><Tag className="h-4 w-4 mr-1 text-primary" />{itinerary.pricePerPerson.toLocaleString()} 元 / 人</span>
              {itinerary.availableTimes?.length > 0 && (
                <span className="flex items-center"><Clock className="h-4 w-4 mr-1 text-primary" />{itinerary.availableTimes.slice(0,3).join(', ')}{itinerary.availableTimes.length > 3 ? '...' : ''}</span>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="bg-card p-6 sm:p-10 rounded-xl shadow-2xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center"><CalendarIcon className="h-4 w-4 mr-2 text-primary" />日期 *</FormLabel>
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
                              <span>请选择日期</span>
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
                    <FormLabel className="flex items-center"><Clock className="h-4 w-4 mr-2 text-primary" />时间 *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择时间段" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {itinerary.availableTimes.length > 0 ? itinerary.availableTimes.map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        )) : <SelectItem value="" disabled>暂无可用时间</SelectItem>}
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
                  <FormLabel className="flex items-center"><Users className="h-4 w-4 mr-2 text-primary" />人数 *</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="例如：2" {...field} min="1" />
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
                  <FormLabel className="flex items-center"><Users className="h-4 w-4 mr-2 text-primary" />联系人姓名 *</FormLabel>
                  <FormControl>
                    <Input placeholder="您的姓名" {...field} />
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
                  <FormLabel className="flex items-center"><Phone className="h-4 w-4 mr-2 text-primary" />联系电话 *</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="您的手机号" {...field} />
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
                    <FormLabel className="flex items-center"><Contact className="h-4 w-4 mr-2 text-primary" />备用联系方式类型</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择联系方式类型（可选）" />
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
                      <Input placeholder={`您的${watch("secondaryContactType") || '联系方式'}`} {...field} disabled={!watch("secondaryContactType")} />
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
                    <FormLabel className="text-base">附加服务</FormLabel>
                    <FormDescription>请选择您需要的额外服务。</FormDescription>
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
                  <FormLabel className="flex items-center"><FileText className="h-4 w-4 mr-2 text-primary" />备注（可选）</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="如有特殊要求或补充信息请填写..."
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
                  <FormLabel className="flex items-center"><TicketPercent className="h-4 w-4 mr-2 text-primary" />折扣码（可选）</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入折扣码" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="mt-8 pt-4 border-t border-dashed border-gray-200 dark:border-gray-700">
              <Card className="mb-6 shadow-lg p-6 bg-primary/5">
                <h3 className="text-xl font-semibold mb-3 flex items-center"><Tag className="h-5 w-5 mr-2 text-primary" />预计价格</h3>
                <p className="text-3xl font-bold text-primary">{calculatedPrice.toLocaleString()} 元</p>
                {discountMessage && <p className={`text-xs mt-1 ${appliedDiscount ? 'text-green-600' : 'text-destructive'}`}>{discountMessage}</p>}
                <p className="text-xs text-muted-foreground mt-1">最终价格以所选内容为准。</p>
                {/* --- BEGIN: Price breakdown details --- */}
                <div className="mt-4 bg-white dark:bg-muted/30 rounded-lg border p-4 text-sm">
                  <div className="flex justify-between mb-1">
                    <span>行程价格（{priceBreakdown.numPeople}人）:</span>
                    <span>{(priceBreakdown.basePrice).toLocaleString()} 元</span>
                  </div>
                  {priceBreakdown.districtSurchargeLabel && (
                    <div className="flex justify-between mb-1">
                      <span>区域附加费</span>
                      <span>{priceBreakdown.districtSurchargeLabel}</span>
                    </div>
                  )}
                  {priceBreakdown.services.length > 0 && (
                    <div className="mb-1">
                      <span>附加服务:</span>
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
                    <span>小计:</span>
                    <span>{priceBreakdown.subtotal.toLocaleString()} 元</span>
                  </div>
                  {priceBreakdown.discountLabel && (
                    <div className="flex justify-between text-green-700 dark:text-green-400">
                      <span>{priceBreakdown.discountLabel.replace('Giảm giá:', '折扣')}</span>
                      <span>-{priceBreakdown.discountValue.toLocaleString()} 元</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold border-t pt-2 mt-2 text-primary text-lg">
                    <span>总计:</span>
                    <span>{calculatedPrice.toLocaleString()} 元</span>
                  </div>
                </div>
                {/* --- END: Price breakdown details --- */}
              </Card>
            </div>

            <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  正在提交...
                </>
              ) : (
                '提交行程预订'
              )}
            </Button>
          </form>
        </Form>
      </div>
      {/* Dialog xác nhận điều khoản */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>预订条款与须知</DialogTitle>
            <DialogDescription>
              <div className="prose max-w-full" dangerouslySetInnerHTML={{ __html: termsContent || '<em>暂无条款内容。</em>' }} />
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 mt-4">
            <input type="checkbox" id="agree_terms" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
            <label htmlFor="agree_terms" className="text-sm">我已阅读并同意条款</label>
          </div>
          <DialogFooter>
            <Button onClick={handleAgreeAndSubmit} disabled={!agreed || isSubmitting} className="w-full">
              同意并提交
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Using ShadCN Card as a simple div with styling for layout consistency
const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-card text-card-foreground rounded-lg border shadow-sm", className)}>
    {children}
  </div>
);
