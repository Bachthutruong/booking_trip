'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Flag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface SpamReportButtonProps {
    participant: {
        id: string;
        name: string;
        phone: string;
    };
    tripId: string;
}

export default function SpamReportButton({ participant, tripId }: SpamReportButtonProps) {
    const [reason, setReason] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleReport = async () => {
        if (!reason) {
            toast({
                variant: "destructive",
                title: "錯誤",
                description: "請輸入舉報原因",
            });
            return;
        }
        try {
            const res = await fetch('/api/admin/spam', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reportedUserId: participant.id,
                    reportedUserPhone: participant.phone,
                    reportedUserName: participant.name,
                    tripId: tripId,
                    reason
                })
            });
            const data = await res.json();
            if (data.success) {
                toast({
                    variant: "success",
                    title: "成功",
                    description: "舉報成功",
                });
                setIsOpen(false);
                // Refresh the page to update the UI
                router.refresh();
            } else {
                toast({
                    variant: "destructive",
                    title: "錯誤",
                    description: `舉報失敗：${data.message}`,
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "錯誤",
                description: "舉報失敗",
            });
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="bg-red-500 text-white hover:bg-red-600 border-red-600">
                    <Flag className="mr-2 h-4 w-4" /> 舉報垃圾用戶
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>舉報 {participant.name} 為垃圾用戶？</AlertDialogTitle>
                    <AlertDialogDescription>
                        此用戶將被標記為垃圾用戶，如果累積3次舉報將被永久封鎖
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                    <Textarea
                        placeholder="請輸入舉報原因..."
                        className="min-h-[100px]"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReport}>
                        確認舉報
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
} 