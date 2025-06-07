
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Itinerary, ItineraryFormValues, ItineraryType } from '@/lib/types';
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ITINERARY_TYPES } from "@/lib/constants";
import { Loader2, Save, Package, Type, Tag, Image as ImageIcon, ClockIcon, Info } from "lucide-react";

const itineraryFormSchema = z.object({
  name: z.string().min(3, "Name is required and must be at least 3 characters."),
  type: z.enum(['airport_pickup', 'airport_dropoff', 'tourism'], { required_error: "Itinerary type is required."}),
  pricePerPerson: z.coerce.number().min(0, "Price must be a positive number."),
  description: z.string().min(10, "Description is required and must be at least 10 characters."),
  imageUrl: z.string().url("Must be a valid URL if provided.").optional().or(z.literal('')),
  availableTimes: z.string().min(1, "Available times are required (e.g., 08:00,09:00,14:00).")
    .regex(/^(\d{2}:\d{2})(,\s*\d{2}:\d{2})*$/, "Times must be in HH:MM format, comma-separated."),
});


interface ItineraryFormProps {
  initialData?: Itinerary | null;
  onSubmitAction: (values: ItineraryFormValues) => Promise<{ success: boolean; message: string; itineraryId?: string }>;
  submitButtonText?: string;
}

export default function ItineraryForm({ initialData, onSubmitAction, submitButtonText = "Save Itinerary" }: ItineraryFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof itineraryFormSchema>>({
    resolver: zodResolver(itineraryFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      type: initialData?.type || undefined,
      pricePerPerson: initialData?.pricePerPerson || 0,
      description: initialData?.description || "",
      imageUrl: initialData?.imageUrl || "",
      availableTimes: initialData?.availableTimes?.join(', ') || "",
    },
  });

  async function onSubmit(values: z.infer<typeof itineraryFormSchema>) {
    startTransition(async () => {
      const result = await onSubmitAction(values);
      if (result.success) {
        toast({
          title: initialData ? "Itinerary Updated!" : "Itinerary Created!",
          description: result.message,
        });
        router.push('/admin/itineraries');
        router.refresh(); 
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
              <FormLabel className="flex items-center"><Package className="mr-2 h-4 w-4 text-primary"/>Itinerary Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Hanoi Old Quarter Walking Tour" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><Type className="mr-2 h-4 w-4 text-primary"/>Itinerary Type *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select itinerary type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(ITINERARY_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pricePerPerson"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><Tag className="mr-2 h-4 w-4 text-primary"/>Price Per Person (VND) *</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 500000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><Info className="mr-2 h-4 w-4 text-primary"/>Description *</FormLabel>
              <FormControl>
                <Textarea placeholder="Detailed description of the itinerary..." {...field} rows={5} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><ImageIcon className="mr-2 h-4 w-4 text-primary"/>Image URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/image.png" {...field} />
              </FormControl>
              <FormDescription>Enter a direct URL to an image. Cloudinary integration can be added later.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="availableTimes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><ClockIcon className="mr-2 h-4 w-4 text-primary"/>Available Times *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 08:00, 09:30, 14:00, 15:30" {...field} />
              </FormControl>
              <FormDescription>Comma-separated list of available times in HH:MM format.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full sm:w-auto min-w-[150px]" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {submitButtonText}
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
