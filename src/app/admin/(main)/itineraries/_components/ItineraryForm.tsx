
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
import { useState, useTransition, useEffect, useRef } from "react"; // Added useRef
import { ITINERARY_TYPES } from "@/lib/constants";
import { Loader2, Save, Package, Type, Tag, Image as ImageIcon, ClockIcon, Info, UploadCloud, XCircle } from "lucide-react";
import { uploadFile } from "@/actions/uploadActions";
import NextImage from "next/image"; // For preview
import { Label } from "@/components/ui/label"; // Added Label

const itineraryFormSchema = z.object({
  name: z.string().min(3, "Name is required and must be at least 3 characters."),
  type: z.enum(['airport_pickup', 'airport_dropoff', 'tourism'], { required_error: "Itinerary type is required."}),
  pricePerPerson: z.coerce.number().min(0, "Price must be a positive number."),
  description: z.string().min(10, "Description is required and must be at least 10 characters."),
  imageUrl: z.string().url("Must be a valid URL if provided, or will be auto-generated/uploaded.").optional().or(z.literal('')),
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl || null);
  const fileInputRef = useRef<HTMLInputElement | null>(null); // Changed to useRef


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
  
  useEffect(() => {
    // If initialData.imageUrl changes (e.g. after form submission and re-fetch), update preview
    setImagePreview(initialData?.imageUrl || null);
    form.reset({ // also reset form value for imageUrl
        name: initialData?.name || "",
        type: initialData?.type || undefined,
        pricePerPerson: initialData?.pricePerPerson || 0,
        description: initialData?.description || "",
        imageUrl: initialData?.imageUrl || "",
        availableTimes: initialData?.availableTimes?.join(', ') || "",
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.imageUrl, initialData?.name, initialData?.type, initialData?.pricePerPerson, initialData?.description, initialData?.availableTimes]); // Added all fields to dependency array for full reset


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: "File too large", description: "Please select an image smaller than 5MB.", variant: "destructive"});
        setSelectedFile(null);
        setImagePreview(initialData?.imageUrl || null); // Revert to initial on error
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast({ title: "Invalid file type", description: "Please select an image file (JPG, PNG, GIF, etc.).", variant: "destructive"});
        setSelectedFile(null);
        setImagePreview(initialData?.imageUrl || null);
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      form.setValue('imageUrl', ''); // Clear the text input for URL if a file is chosen
    }
  };
  
  const handleClearImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    form.setValue('imageUrl', ''); // Clear stored URL too
    if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset file input
    }
  };


  async function onSubmit(values: z.infer<typeof itineraryFormSchema>) {
    startTransition(async () => {
      let finalImageUrl = values.imageUrl; // Use existing URL if no new file or if manually entered

      if (selectedFile) {
        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        await new Promise<void>((resolve, reject) => {
          reader.onloadend = () => resolve();
          reader.onerror = (error) => reject(error);
        });
        const dataUri = reader.result as string;

        const uploadResult = await uploadFile(dataUri, 'itineraries', 'image');
        if (uploadResult.success && uploadResult.url) {
          finalImageUrl = uploadResult.url;
        } else {
          toast({ title: "Image Upload Failed", description: uploadResult.message || "Could not upload image.", variant: "destructive" });
          return;
        }
      }
      
      const submissionValues = { ...values, imageUrl: finalImageUrl || "" };

      const result = await onSubmitAction(submissionValues);
      if (result.success) {
        toast({
          title: initialData ? "Itinerary Updated!" : "Itinerary Created!",
          description: result.message,
        });
        setSelectedFile(null); // Reset file after successful submission
        //setImagePreview(null); // Preview will be updated by useEffect if initialData.imageUrl changes
        if (result.itineraryId && (!initialData || initialData.id !== result.itineraryId)) { // Check if it's a new itinerary or different ID
             router.push(`/admin/itineraries/${result.itineraryId}/edit`); // Go to edit page of new/updated
        } else if (initialData) {
            router.refresh(); // Refresh current edit page
        }
         else { // This case for creation that doesn't return ID, or if no initialData and no new ID
            router.push('/admin/itineraries');
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
                    <SelectItem key={key} value={key as ItineraryType}>{label}</SelectItem>
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
        
        <FormItem>
            <FormLabel className="flex items-center"><ImageIcon className="mr-2 h-4 w-4 text-primary"/>Itinerary Image</FormLabel>
            <FormControl>
                <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange}
                    className="file:text-primary file:font-semibold"
                    ref={fileInputRef} // Use ref here
                />
            </FormControl>
            <FormDescription>Upload an image for the itinerary (max 5MB). Or paste a URL below.</FormDescription>
        </FormItem>

        {imagePreview && (
          <div className="space-y-2">
            <Label>Image Preview:</Label>
            <div className="relative group w-full max-w-sm border rounded-md p-2">
                <NextImage src={imagePreview} alt="Itinerary preview" width={400} height={250} className="rounded-md object-contain max-h-[200px]" data-ai-hint="travel itinerary photo" />
                <Button 
                    type="button" 
                    variant="destructive" 
                    size="icon" 
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleClearImage}
                    title="Remove image"
                >
                    <XCircle className="h-5 w-5"/>
                </Button>
            </div>
          </div>
        )}
         {!selectedFile && ( // Show current imageUrl input only if no file selected for upload
            <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="text-xs text-muted-foreground">Or paste Image URL</FormLabel>
                <FormControl>
                    <Input 
                        placeholder="https://example.com/image.png" 
                        {...field} 
                        disabled={!!selectedFile} // Disable if a file is selected
                        onChange={(e) => {
                            field.onChange(e);
                            if (!selectedFile) setImagePreview(e.target.value);
                        }}
                    />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        )}


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
