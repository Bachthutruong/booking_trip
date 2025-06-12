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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import type { DiscountCodeFormValues } from '@/lib/types';
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Save, Tag, Percent, Info, CalendarDays } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { createDiscountCode, updateDiscountCode } from "@/actions/discountActions";

const discountCodeFormSchema = z.object({
    code: z.string().min(3, "代码是必需的，至少需要3个字符。").max(20, "代码不能超过20个字符。"),
    type: z.enum(['fixed', 'percentage'], { required_error: "折扣类型是必需的。" }),
    value: z.coerce.number().min(0, "值必须是正数。"),
    discountPercentage: z.coerce.number().min(0).max(100).optional(), // Only for percentage type
    isActive: z.boolean().default(true),
    description: z.string().optional(),
    usageLimit: z.coerce.number().min(1, "使用限制必须至少为1").optional().or(z.literal('')),
    expiryDate: z.date().nullable().optional(),
});

interface DiscountCodeFormProps {
    initialData?: DiscountCodeFormValues & { id?: string } | null;
    isEditMode?: boolean;
    discountId?: string;
    submitButtonText?: string;
}

export default function DiscountCodeForm({ initialData, isEditMode = false, discountId, submitButtonText = "建立折扣碼" }: DiscountCodeFormProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof discountCodeFormSchema>>({
        resolver: zodResolver(discountCodeFormSchema),
        defaultValues: {
            code: initialData?.code || "",
            type: initialData?.type || undefined,
            value: initialData?.value || 0,
            discountPercentage: initialData?.discountPercentage || 0, // Ensure default is 0 for percentage
            isActive: initialData?.isActive ?? true,
            description: initialData?.description || "",
            usageLimit: initialData?.usageLimit || "",
            expiryDate: initialData?.expiryDate ? new Date(initialData.expiryDate) : null,
        },
    });

    const selectedType = form.watch("type");

    async function onSubmit(values: z.infer<typeof discountCodeFormSchema>) {
        startTransition(async () => {
            const parsedValues = {
                ...values,
                usageLimit: values.usageLimit === '' ? undefined : values.usageLimit, // Convert empty string to undefined
                expiryDate: values.expiryDate?.toISOString() || undefined, // Convert Date to ISO string
            }

            let result;
            if (isEditMode && discountId) {
                result = await updateDiscountCode(discountId, parsedValues);
            } else {
                result = await createDiscountCode(parsedValues);
            }

            if (result.success) {
                toast({
                    title: initialData ? "折扣已更新！" : "折扣已创建！",
                    description: result.message,
                });
                if (isEditMode && discountId) {
                    router.refresh();
                } else if (result.discountCodeId) {
                    router.push(`/admin/discounts/${result.discountCodeId}/edit`);
                } else {
                    router.push('/admin/discounts');
                }
            } else {
                toast({
                    title: "错误",
                    description: result.message,
                    variant: "destructive",
                });
            }
        });
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center"><Tag className="mr-2 h-4 w-4 text-primary" />折扣代碼 *</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., BLACKFRIDAY20" {...field} />
                            </FormControl>
                            <FormDescription>
                            這是客人要輸入的折扣代碼
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center"><Percent className="mr-2 h-4 w-4 text-primary" />設定折扣方式 *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="选择折扣类型" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="fixed">固定金額</SelectItem>
                                    <SelectItem value="percentage">百分比</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center"><Info className="mr-2 h-4 w-4 text-primary" />折扣值 *</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="例如：300 （折300元） 或 10（9折）" {...field} />
                            </FormControl>
                            <FormDescription>
                                {selectedType === "fixed" ? "折扣的固定金額（例如輸入：150 > 就是折扣給客人150元）" : "折扣的百分比 （例如輸入：10 > 就是打9折的意思）"}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* {selectedType === "percentage" && (
                    <FormField
                        control={form.control}
                        name="discountPercentage"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center"><Percent className="mr-2 h-4 w-4 text-primary" />Actual Percentage Value</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g., 10 for 10%" {...field} max={100} min={0} />
                                </FormControl>
                                <FormDescription>
                                    This field is for percentage type discounts.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )} */}

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center"><Info className="mr-2 h-4 w-4 text-primary" />折扣說明</FormLabel>
                            <FormControl>
                                <Input placeholder="例如：優惠9折 或 優惠300元" {...field} />
                            </FormControl>
                            <FormDescription>
                                可选的折扣描述。
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="usageLimit"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center"><Tag className="mr-2 h-4 w-4 text-primary" />是用限制數量</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="e.g., 100 (leave empty for unlimited)" {...field} />
                            </FormControl>
                            <FormDescription>
                            此代碼可以使用的最多數量，如果留空白代表無限
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="expiryDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-primary" />折價卷到期日期</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-[240px] pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            {field.value ? (
                                                format(field.value, "PPP")
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                            <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value ?? undefined}
                                        onSelect={field.onChange}
                                        disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormDescription>
                            可選擇折扣碼的到期日期
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                            <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>啟用</FormLabel>
                                <FormDescription>
                                如果未勾選，此折扣碼就不能使用
                                </FormDescription>
                            </div>
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full text-lg py-6" disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                    {submitButtonText}
                </Button>
            </form>
        </Form>
    );
} 