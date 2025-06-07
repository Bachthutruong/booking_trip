'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { uploadTransferProof } from '@/actions/tripActions'; // Assuming this action exists
import { Loader2, UploadCloud, FileImage } from 'lucide-react';
import Image from 'next/image';

interface UploadProofDialogProps {
  tripId: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function UploadProofDialog({ tripId, isOpen, onOpenChange }: UploadProofDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: "File too large", description: "Please select an image smaller than 5MB.", variant: "destructive"});
        setSelectedFile(null);
        setPreviewUrl(null);
        if(fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
        toast({ title: "Invalid file type", description: "Please select a JPG, PNG, or GIF image.", variant: "destructive"});
        setSelectedFile(null);
        setPreviewUrl(null);
        if(fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast({ title: 'No file selected', description: 'Please select an image to upload.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      // In a real app, this would upload to a storage service (e.g., Firebase Storage, S3)
      // and then send the URL to the server action.
      // For this mock, we'll simulate with a placeholder URL.
      const mockImageUrl = `https://placehold.co/600x400.png?text=Proof_${tripId.slice(-4)}`;
      
      const result = await uploadTransferProof(tripId, mockImageUrl);

      if (result.success) {
        toast({ title: 'Upload Successful', description: result.message });
        onOpenChange(false); // Close dialog on success
        // Optionally, trigger a re-fetch of trips data on the parent page.
      } else {
        toast({ title: 'Upload Failed', description: result.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Upload Payment Proof</DialogTitle>
          <DialogDescription>
            Please upload an image of your transfer confirmation for Trip ID: {tripId}.
            Accepted formats: JPG, PNG, GIF. Max size: 5MB.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-6">
          <div className="space-y-2">
            <Label htmlFor="payment-proof-file" className="text-base">Proof Image</Label>
            <Input id="payment-proof-file" type="file" accept="image/jpeg,image/png,image/gif" onChange={handleFileChange} ref={fileInputRef} className="file:text-primary file:font-semibold"/>
          </div>
          {previewUrl && (
            <div className="mt-4 border border-dashed border-border rounded-md p-2">
              <p className="text-sm font-medium mb-2 text-center text-muted-foreground">Image Preview:</p>
              <Image src={previewUrl} alt="Payment proof preview" width={400} height={300} className="rounded-md object-contain max-h-[200px] mx-auto" />
            </div>
          )}
          {!previewUrl && selectedFile === null && (
             <div className="mt-4 border border-dashed border-border rounded-md p-6 flex flex-col items-center justify-center text-muted-foreground h-[150px]">
                <FileImage className="h-12 w-12 mb-2" />
                <p>No file selected</p>
             </div>
          )}
        </div>
        <DialogFooter className="sm:justify-between gap-2">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit} disabled={!selectedFile || isSubmitting} className="min-w-[120px]">
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UploadCloud className="mr-2 h-4 w-4" />
            )}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
