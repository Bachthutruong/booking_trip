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
import { useToast } from '@/hooks/use-toast';
import { uploadTransferProof } from '@/actions/tripActions';
import { uploadFile } from '@/actions/uploadActions'; // New action for Cloudinary
import { Loader2, UploadCloud, FileImage, FileText as FilePdfIcon } from 'lucide-react'; // Added FilePdfIcon
import Image from 'next/image';

interface UploadProofDialogProps {
  tripId: string;
  participantId?: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUploadSuccess?: () => void;
  onUploadStart?: () => void;
}

export default function UploadProofDialog({ tripId, participantId, isOpen, onOpenChange, onUploadSuccess, onUploadStart }: UploadProofDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // For image preview
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: "File too large", description: "Please select an image or PDF smaller than 5MB.", variant: "destructive" });
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/gif', 'application/pdf'].includes(file.type)) {
        toast({ title: "Invalid file type", description: "Please select a JPG, PNG, GIF, or PDF file.", variant: "destructive" });
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'application/pdf') {
        setPreviewUrl('pdf'); // Special value for PDF
      } else {
        setPreviewUrl(null);
      }
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast({ title: 'No file selected', description: 'Please select a file to upload.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    if (onUploadStart) onUploadStart();

    try {
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);

      // Wait for reader to load
      await new Promise<void>((resolve, reject) => {
        reader.onloadend = () => resolve();
        reader.onerror = reject;
      });

      const dataUri = reader.result as string;
      if (!dataUri) {
        throw new Error("Could not read file data.");
      }

      // Determine resource type for Cloudinary
      const resourceType = selectedFile.type === 'application/pdf' ? 'image' : 'image';
      // Cloudinary often treats PDFs as 'image' type for transformations and delivery, 
      // or 'raw' if you need the exact raw file. For display, 'image' is usually fine.

      const cloudinaryResult = await uploadFile(dataUri, 'payment_proofs', resourceType);

      if (cloudinaryResult.success && cloudinaryResult.url) {
        const dbUpdateResult = await uploadTransferProof(tripId, cloudinaryResult.url, participantId);
        if (dbUpdateResult.success) {
          toast({ title: 'Upload Successful', description: dbUpdateResult.message });
          if (onUploadSuccess) onUploadSuccess();
          handleCloseDialog(true);
        } else {
          toast({ title: 'Database Update Failed', description: dbUpdateResult.message, variant: 'destructive' });
        }
      } else {
        toast({ title: 'Cloudinary Upload Failed', description: cloudinaryResult.message || 'Could not upload to Cloudinary.', variant: 'destructive' });
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({ title: 'Error', description: error.message || 'An unexpected error occurred during upload.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseDialog = (isSuccess = false) => {
    if (!isSuccess) {
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Upload Payment Proof {participantId ? '(For Participant)' : '(For Main Booker)'}</DialogTitle>
          <DialogDescription>
            Please upload an image or PDF of the transfer confirmation for Trip ID: <strong>{tripId}</strong>.
            {participantId && <><br />This proof is for a specific participant within the trip.</>}
            Accepted formats: JPG, PNG, GIF, PDF. Max size: 5MB.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-6">
          <div className="space-y-2">
            <Label htmlFor="payment-proof-file" className="text-base">Proof File</Label>
            <Input
              id="payment-proof-file"
              type="file"
              accept="image/jpeg,image/png,image/gif,application/pdf"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="file:text-primary file:font-semibold"
              disabled={isSubmitting}
            />
          </div>
          {previewUrl === 'pdf' && selectedFile && (
            <div className="mt-4 border border-dashed border-border rounded-md p-4 flex flex-col items-center justify-center text-muted-foreground h-[150px]">
              <FilePdfIcon className="h-12 w-12 mb-2 text-destructive" />
              <p className="text-sm font-medium">{selectedFile.name}</p>
              <p className="text-xs">PDF selected</p>
            </div>
          )}
          {previewUrl && previewUrl !== 'pdf' && selectedFile?.type.startsWith('image/') && (
            <div className="mt-4 border border-dashed border-border rounded-md p-2">
              <p className="text-sm font-medium mb-2 text-center text-muted-foreground">Image Preview:</p>
              <Image src={previewUrl} alt="Payment proof preview" width={400} height={300} className="rounded-md object-contain max-h-[200px] mx-auto" data-ai-hint="payment proof document" />
            </div>
          )}
          {!selectedFile && (
            <div className="mt-4 border border-dashed border-border rounded-md p-6 flex flex-col items-center justify-center text-muted-foreground h-[150px]">
              <FileImage className="h-12 w-12 mb-2" />
              <p>No file selected</p>
            </div>
          )}
        </div>
        <DialogFooter className="sm:justify-between gap-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSubmitting}>
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
