'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { revertParticipantPayment } from '@/actions/tripActions';
import { useRouter } from 'next/navigation';

interface RevertPaymentButtonProps {
    tripId: string;
    participantId: string;
}

export function RevertPaymentButton({ tripId, participantId }: RevertPaymentButtonProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleClick = () => {
        startTransition(async () => {
            const result = await revertParticipantPayment(tripId, participantId);
            if (result.success) {
                router.refresh();
            }
        });
    };

    return (
        <Button
            type="button"
            size="sm"
            variant="outline"
            className="bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600"
            onClick={handleClick}
            disabled={isPending}
        >
            <RotateCcw className="mr-2 h-4 w-4" /> {isPending ? '處理中...' : '恢復待付款'}
        </Button>
    );
} 