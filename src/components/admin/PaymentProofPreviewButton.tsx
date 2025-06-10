'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon } from 'lucide-react';
import ImagePreviewDialog from '@/components/common/ImagePreviewDialog';

interface PaymentProofPreviewButtonProps {
    imageUrl: string;
}

export default function PaymentProofPreviewButton({ imageUrl }: PaymentProofPreviewButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <>
            <Button onClick={() => setIsOpen(true)} variant="outline" size="sm" className="ml-2 h-7 px-2 text-xs">
                <ImageIcon className="mr-1 h-3 w-3" /> 查看证明
            </Button>
            <ImagePreviewDialog isOpen={isOpen} onOpenChange={setIsOpen} imageUrl={imageUrl} />
        </>
    );
} 