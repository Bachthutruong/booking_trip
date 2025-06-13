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
  name: z.string().min(2, "姓名必须至少有2个字符。").max(100),
  phone: z.string().regex(/^\+?[0-9\s-]{10,15}$/, "无效的电话号码格式。"),
  numberOfPeople: z.coerce.number().min(1, "至少需要1人。").max(10, "最多只能加入10人。"), // Or some other reasonable limit
  address: z.string().min(5, "地址必须至少有5个字符。").max(200), // Their pickup address
  discountCode: z.string().optional(),
  notes: z.string().max(500, "备注不能超过500个字符。").optional(),
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
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [initialCalculatedPrice, setInitialCalculatedPrice] = useState(0); // New state for price before discount
  const [priceCalculationLoading, setPriceCalculationLoading] = useState(true);
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);
  const [discountMessage, setDiscountMessage] = useState<string | null>(null);
  const [pricePerPerson, setPricePerPerson] = useState<number>(0);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [pendingFormValues, setPendingFormValues] = useState<z.infer<typeof joinTripFormSchema> | null>(null);
  const [termsContent, setTermsContent] = useState<string>("");

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
        setDiscountMessage("无效或过期的折扣代码。");
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

  // Fetch terms content on mount
  useEffect(() => {
    fetch("/api/admin/terms")
      .then(res => res.json())
      .then(data => setTermsContent(data.content || ""));
  }, []);

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
  })();
  // --- END: Price breakdown calculation ---

  function handleFormSubmit(values: z.infer<typeof joinTripFormSchema>) {
    setPendingFormValues(values);
    setShowTermsDialog(true);
  }

  async function handleTermsConfirm() {
    if (!pendingFormValues) return;
    setIsSubmitting(true);
    try {
      const submissionData: JoinTripFormValues = {
        ...pendingFormValues,
        pricePaid: calculatedPrice, // Pass the calculated price
        discountCode: appliedDiscount ? appliedDiscount.code : undefined, // Pass the applied discount code
        additionalServiceIds: pendingFormValues.additionalServiceIds || [], // Pass selected services
      };

      const result = await joinTrip(submissionData);
      if (result.success) {
        toast({
          title: "成功加入！",
          description: result.message,
        });
        setShowTermsDialog(false);
        setTermsAccepted(false);
        setPendingFormValues(null);
        onOpenChange(false);
        router.push(`/my-trips?phone=${pendingFormValues.phone}&name=${encodeURIComponent(pendingFormValues.name)}`);
      } else {
        toast({
          title: "加入行程失败",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "错误",
        description: "发生意外错误。请重试。",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">加入行程: {trip.itineraryName}</DialogTitle>
            <DialogDescription>
              填写您的详细信息以加入此行程。
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Users className="h-4 w-4 mr-2 text-primary" />聯絡人姓名 （此名會用來查詢共乘） *</FormLabel>
                    <FormControl>
                      <Input placeholder="全名" {...field} />
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
                    <FormLabel className="flex items-center"><Phone className="h-4 w-4 mr-2 text-primary" />聯絡人電話 （此電話會用來查詢共乘） *</FormLabel>
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
                    <FormLabel className="flex items-center"><Users className="h-4 w-4 mr-2 text-primary" />人數 *</FormLabel>
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
                      <FormLabel className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-primary" />點選台南區域</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="選區域" />
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
                      <FormDescription>偏遠的區域，需要額外費用</FormDescription>
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
                    <FormLabel className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-primary" />輸入地址 *</FormLabel>
                    <FormControl>
                      <Input placeholder="輸入地址" {...field} />
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
                    <FormLabel className="flex items-center"><TicketPercent className="h-4 w-4 mr-2 text-primary" />折扣碼（選填）</FormLabel>
                    <FormControl>
                      <Input placeholder="如果有折扣碼，請在這裡輸入" {...field} />
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
                    <FormLabel className="flex items-center"><FileText className="h-4 w-4 mr-2 text-primary" />備註（非必填）</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder=" 如有特殊要求或補充資料請在這裡告訴我們"
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
                      <FormLabel className="text-base">加購服務</FormLabel>
                      {/* <FormDescription>选择您想要包含的任何额外服务。</FormDescription> */}
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

              {/* Estimated Price for You section moved here */}
              <div className="mt-8 pt-4 border-t border-dashed border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold font-headline mb-2 flex items-center">
                  <TicketPercent className="h-5 w-5 mr-2 text-primary" />
                  預估價格:
                </h3>
                {priceCalculationLoading ? (
                  <p className="text-lg text-muted-foreground flex items-center">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> 计算价格...
                  </p>
                ) : (
                  <>
                    {appliedDiscount && calculatedPrice < initialCalculatedPrice ? (
                      <div className="flex flex-col">
                        <p className="text-sm text-muted-foreground line-through">原价: {initialCalculatedPrice.toLocaleString()} 元</p>
                        <p className="text-3xl font-extrabold text-primary">{calculatedPrice.toLocaleString()} 元</p>
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">{discountMessage}</p>
                      </div>
                    ) : (
                      <p className="text-3xl font-extrabold text-primary">{calculatedPrice.toLocaleString()} 元</p>
                    )}
                    {/* --- BEGIN: Price breakdown details --- */}
                    <div className="mt-4 bg-white dark:bg-muted/30 rounded-lg border p-4 text-xs">
                      <div className="flex justify-between mb-1">
                        <span>行程價格 ({priceBreakdown.numPeople} 人{priceBreakdown.numPeople > 1 ? 's' : ''}):</span>
                        <span>{(priceBreakdown.basePrice).toLocaleString()} 元</span>
                      </div>
                      {priceBreakdown.districtSurchargeLabel && (
                        <div className="flex justify-between mb-1">
                          <span>地区额外费用</span>
                          <span>{priceBreakdown.districtSurchargeLabel}</span>
                        </div>
                      )}
                      {priceBreakdown.services.length > 0 && (
                        <div className="mb-1">
                          <span>加購服務:</span>
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
                        <span>小計:</span>
                        <span>{priceBreakdown.subtotal.toLocaleString()} 元</span>
                      </div>
                      {priceBreakdown.discountLabel && (
                        <div className="flex justify-between text-green-700 dark:text-green-400">
                          <span>{priceBreakdown.discountLabel}</span>
                          <span>-{priceBreakdown.discountValue.toLocaleString()} 元</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold border-t pt-2 mt-2 text-primary text-base">
                        <span>總計:</span>
                        <span>{calculatedPrice.toLocaleString()} 元</span>
                      </div>
                    </div>
                    {/* --- END: Price breakdown details --- */}
                  </>
                )}
                {/* <FormDescription className="mt-2">这是您部分行程的估计价格。最终价格可能会有所不同。</FormDescription> */}
              </div>

              <DialogFooter className="sm:justify-between gap-2 pt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    取消
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  確認並加入
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Terms dialog in English, content from API */}
      <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>加入行程的条件</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-60 overflow-y-auto text-sm">
            <div className="prose max-w-full" dangerouslySetInnerHTML={{ __html: termsContent || '<em>没有条款内容。</em>' }} />
          </div>
          <div className="flex items-center space-x-2 mt-4">
            <Checkbox id="accept-terms" checked={termsAccepted} onCheckedChange={checked => setTermsAccepted(checked === true)} />
            <label htmlFor="accept-terms" className="text-sm cursor-pointer select-none">
              我已阅读并同意上述条款和条件
            </label>
          </div>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setShowTermsDialog(false)}>
                返回
            </Button>
            <Button
              onClick={handleTermsConfirm}
              disabled={!termsAccepted || isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              確認並加入
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
