
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
import { useToast } from '@/hooks/use-toast'; // Ensure this path is correct
import { uploadTransferProof } from '@/actions/tripActions';
import { Loader2, UploadCloud, FileImage } from 'lucide-react';
import Image from 'next/image';

interface UploadProofDialogProps {
  tripId: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUploadSuccess?: () => void;
  onUploadStart?: () => void;
}

export default function UploadProofDialog({ tripId, isOpen, onOpenChange, onUploadSuccess, onUploadStart }: UploadProofDialogProps) {
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
        if(fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/gif', 'application/pdf'].includes(file.type)) { // Added PDF
        toast({ title: "Invalid file type", description: "Please select a JPG, PNG, GIF, or PDF file.", variant: "destructive"});
        setSelectedFile(null);
        setPreviewUrl(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null); // No preview for PDF, or show a generic PDF icon
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
      // SIMULATE UPLOAD TO A STORAGE SERVICE AND GET URL
      // In a real app, replace this with actual upload logic (e.g., to Firebase Storage, S3, Cloudinary)
      // For now, we'll use a placeholder, but log the file name to simulate.
      console.log("Simulating upload of file:", selectedFile.name);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate upload delay
      const mockImageUrl = `https://placehold.co/600x400.png?text=Proof_${tripId.slice(-4)}_${selectedFile.name.substring(0,10)}`;
      
      const result = await uploadTransferProof(tripId, mockImageUrl);

      if (result.success) {
        toast({ title: 'Upload Successful', description: result.message });
        if (onUploadSuccess) onUploadSuccess();
        handleCloseDialog(true); // Close dialog on success
      } else {
        toast({ title: 'Upload Failed', description: result.message, variant: 'destructive' });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: 'Error', description: 'An unexpected error occurred during upload.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCloseDialog = (isSuccess = false) => {
    if (!isSuccess) { // Only reset if not a successful submission (which might trigger parent re-render)
        setSelectedFile(null);
        setPreviewUrl(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Upload Payment Proof</DialogTitle>
          <DialogDescription>
            Please upload an image or PDF of your transfer confirmation for Trip ID: <strong>{tripId}</strong>.
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
          {previewUrl && selectedFile?.type.startsWith('image/') && (
            <div className="mt-4 border border-dashed border-border rounded-md p-2">
              <p className="text-sm font-medium mb-2 text-center text-muted-foreground">Image Preview:</p>
              <Image src={previewUrl} alt="Payment proof preview" width={400} height={300} className="rounded-md object-contain max-h-[200px] mx-auto" />
            </div>
          )}
          {selectedFile && selectedFile.type === 'application/pdf' && (
            <div className="mt-4 border border-dashed border-border rounded-md p-4 flex flex-col items-center justify-center text-muted-foreground h-[100px]">
                <FileImage className="h-8 w-8 mb-1 text-destructive" />
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs">PDF selected (no preview available)</p>
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
