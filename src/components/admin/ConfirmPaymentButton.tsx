'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { submitConfirmMainBookerPaymentFromList, submitConfirmParticipantPaymentFromList } from '@/actions/tripActions';

interface ConfirmPaymentButtonProps {
    tripId: string;
    participantId?: string; // Optional: if confirming a specific participant
    isMainBooker: boolean; // Flag to distinguish main booker from other participants
}

export function ConfirmPaymentButton({ tripId, participantId, isMainBooker }: ConfirmPaymentButtonProps) {
    const [isPending, startTransition] = useTransition();

    const handleClick = () => {
        startTransition(async () => {
            if (isMainBooker) {
                await submitConfirmMainBookerPaymentFromList(tripId);
            } else if (participantId) {
                await submitConfirmParticipantPaymentFromList(tripId, participantId);
            }
        });
    };

    return (
        <Button type="button" size="sm" variant="outline" className="bg-green-500 hover:bg-green-600 text-white border-green-600" onClick={handleClick} disabled={isPending}>
            <CheckCircle className="mr-2 h-4 w-4" /> {isPending ? 'Confirming...' : 'Confirm Payment'}
        </Button>
    );
} 