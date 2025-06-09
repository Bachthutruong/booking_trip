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
import { useToast } from "@/hooks/use-toast";
import type { DistrictSurcharge, DistrictSurchargeFormValues } from '@/lib/types';
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Save, MapPinned } from "lucide-react";
import { createDistrictSurcharge, updateDistrictSurcharge } from '@/actions/districtActions';

const districtSurchargeFormSchema = z.object({
    districtName: z.string().min(2, "District name is required and must be at least 2 characters."),
    surchargeAmount: z.coerce.number().min(0, "Surcharge amount must be a positive number."),
});

interface DistrictSurchargeFormProps {
    initialData?: DistrictSurcharge | null;
    isEditMode?: boolean;
    districtId?: string;
    submitButtonText?: string;
}

export default function DistrictSurchargeForm({ initialData, isEditMode = false, districtId, submitButtonText = "Save Surcharge" }: DistrictSurchargeFormProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof districtSurchargeFormSchema>>({
        resolver: zodResolver(districtSurchargeFormSchema),
        defaultValues: {
            districtName: initialData?.districtName || "",
            surchargeAmount: initialData?.surchargeAmount || 0,
        },
    });

    async function onSubmit(values: z.infer<typeof districtSurchargeFormSchema>) {
        startTransition(async () => {
            let result;
            if (isEditMode && districtId) {
                result = await updateDistrictSurcharge(districtId, values);
            } else {
                result = await createDistrictSurcharge(values);
            }

            if (result.success) {
                toast({
                    title: isEditMode ? "Surcharge Updated!" : "Surcharge Created!",
                    description: result.message,
                });
                if (isEditMode) {
                    router.refresh(); // Refresh current page for updated data
                } else if (result.districtId) {
                    router.push(`/admin/districts/${result.districtId}/edit`);
                } else {
                    router.push('/admin/districts');
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
                    name="districtName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center"><MapPinned className="mr-2 h-4 w-4 text-primary" />District Name *</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Hoan Kiem" {...field} />
                            </FormControl>
                            <FormDescription>
                                The name of the district.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="surchargeAmount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center"><MapPinned className="mr-2 h-4 w-4 text-primary" />Surcharge Amount (元) *</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="e.g., 200000" {...field} />
                            </FormControl>
                            <FormDescription>
                                The additional amount charged for this district.
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