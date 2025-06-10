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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import type { AdditionalService, AdditionalServiceFormValues, ItineraryType } from '@/lib/types';
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Save, Wand2, Info, Tag, SquareActivity } from "lucide-react";
import { ITINERARY_TYPES } from "@/lib/constants";
import { createAdditionalService, updateAdditionalService } from "@/actions/additionalServiceActions";

const additionalServiceFormSchema = z.object({
    name: z.string().min(3, "服务名称是必需的，至少需要3个字符。"),
    price: z.coerce.number().min(0, "价格必须是正数。"),
    description: z.string().optional(),
    applicableTo: z.array(z.enum(['airport_pickup', 'airport_dropoff', 'tourism'])).optional(),
    iconName: z.string().optional(),
});

interface AdditionalServiceFormProps {
    initialData?: AdditionalService | null;
    isEditMode?: boolean;
    serviceId?: string;
    submitButtonText?: string;
}

export default function AdditionalServiceForm({ initialData, isEditMode = false, serviceId, submitButtonText = "保存服务" }: AdditionalServiceFormProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof additionalServiceFormSchema>>({
        resolver: zodResolver(additionalServiceFormSchema),
        defaultValues: {
            name: initialData?.name || "",
            price: initialData?.price || 0,
            description: initialData?.description || "",
            applicableTo: initialData?.applicableTo || [],
            iconName: initialData?.iconName || "",
        },
    });

    async function onSubmit(values: z.infer<typeof additionalServiceFormSchema>) {
        startTransition(async () => {
            let result;
            if (isEditMode && serviceId) {
                result = await updateAdditionalService(serviceId, values as AdditionalServiceFormValues);
            } else {
                result = await createAdditionalService(values as AdditionalServiceFormValues);
            }

            if (result.success) {
                toast({
                    title: isEditMode ? "服务已更新！" : "服务已创建！",
                    description: result.message,
                });
                if (isEditMode) {
                    router.refresh(); // 刷新当前页面以更新数据
                } else if (result.serviceId) {
                    router.push(`/admin/services/${result.serviceId}/edit`);
                } else {
                    router.push('/admin/services');
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
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center"><Wand2 className="mr-2 h-4 w-4 text-primary" />服务名称 *</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Extra Luggage Space" {...field} />
                            </FormControl>
                            <FormDescription>
                                附加服务的名称。
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center"><Tag className="mr-2 h-4 w-4 text-primary" />Price (元) *</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="e.g., 200000" {...field} />
                            </FormControl>
                            <FormDescription>
                                此服务的价格。
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center"><Info className="mr-2 h-4 w-4 text-primary" />描述</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Detailed description of the service..." {...field} rows={3} />
                            </FormControl>
                            <FormDescription>
                                此服务的可选描述。
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="applicableTo"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center"><SquareActivity className="mr-2 h-4 w-4 text-primary" />适用的行程类型</FormLabel>
                            <FormDescription>选择此服务适用的行程类型。</FormDescription>
                            <div className="space-y-2">
                                {Object.entries(ITINERARY_TYPES).map(([key, label]) => (
                                    <FormField
                                        key={key}
                                        control={form.control}
                                        name="applicableTo"
                                        render={({ field: innerField }) => {
                                            return (
                                                <FormItem
                                                    key={key}
                                                    className="flex flex-row items-start space-x-3 space-y-0"
                                                >
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={innerField.value?.includes(key as ItineraryType)}
                                                            onCheckedChange={(checked) => {
                                                                return checked
                                                                    ? innerField.onChange([...(innerField.value || []), key as ItineraryType])
                                                                    : innerField.onChange(
                                                                        innerField.value?.filter(
                                                                            (value) => value !== key
                                                                        )
                                                                    );
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">
                                                        {label}
                                                    </FormLabel>
                                                </FormItem>
                                            );
                                        }}
                                    />
                                ))}
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="iconName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center"><Info className="mr-2 h-4 w-4 text-primary" />图标名称</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., luggage, baby" {...field} />
                            </FormControl>
                            <FormDescription>
                                一个描述性的图标名称（例如：'luggage', 'baby'）。这是用于UI提示。
                            </FormDescription>
                            <FormMessage />
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