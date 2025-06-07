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
    name: z.string().min(3, "Service name is required and must be at least 3 characters."),
    price: z.coerce.number().min(0, "Price must be a positive number."),
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

export default function AdditionalServiceForm({ initialData, isEditMode = false, serviceId, submitButtonText = "Save Service" }: AdditionalServiceFormProps) {
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
                    title: isEditMode ? "Service Updated!" : "Service Created!",
                    description: result.message,
                });
                if (isEditMode) {
                    router.refresh(); // Refresh current page for updated data
                } else if (result.serviceId) {
                    router.push(`/admin/services/${result.serviceId}/edit`);
                } else {
                    router.push('/admin/services');
                }
            } else {
                toast({
                    title: "Error",
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
                            <FormLabel className="flex items-center"><Wand2 className="mr-2 h-4 w-4 text-primary" />Service Name *</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Extra Luggage Space" {...field} />
                            </FormControl>
                            <FormDescription>
                                The name of the additional service.
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
                            <FormLabel className="flex items-center"><Tag className="mr-2 h-4 w-4 text-primary" />Price (VND) *</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="e.g., 200000" {...field} />
                            </FormControl>
                            <FormDescription>
                                The price for this service.
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
                            <FormLabel className="flex items-center"><Info className="mr-2 h-4 w-4 text-primary" />Description</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Detailed description of the service..." {...field} rows={3} />
                            </FormControl>
                            <FormDescription>
                                Optional description for the service.
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
                            <FormLabel className="flex items-center"><SquareActivity className="mr-2 h-4 w-4 text-primary" />Applicable Itinerary Types</FormLabel>
                            <FormDescription>Select which itinerary types this service applies to.</FormDescription>
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
                            <FormLabel className="flex items-center"><Info className="mr-2 h-4 w-4 text-primary" />Icon Name (Optional)</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., luggage, baby" {...field} />
                            </FormControl>
                            <FormDescription>
                                A descriptive name for an icon related to the service (e.g., 'luggage', 'baby'). This is for UI hints.
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