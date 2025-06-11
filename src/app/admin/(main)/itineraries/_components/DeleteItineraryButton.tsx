'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { deleteItinerary } from '@/actions/itineraryActions';

interface DeleteItineraryButtonProps {
  itineraryId: string;
  itineraryName: string;
  onDeleted?: () => void;
}

export function DeleteItineraryButton({ itineraryId, itineraryName, onDeleted }: DeleteItineraryButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteItinerary(itineraryId);
      if (result.success) {
        toast({
          title: '行程已删除',
          description: `"${itineraryName}" 已成功删除。`,
        });
        setIsOpen(false);
        if (onDeleted) onDeleted();
      } else {
        toast({
          title: '删除行程失败',
          description: result.message || '发生意外错误。',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="icon" title={`Delete ${itineraryName}`}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确定要删除 "{itineraryName}"?</AlertDialogTitle>
          <AlertDialogDescription>
            此操作无法撤消。这将永久删除行程。
            与该行程相关的任何行程可能会受到影响（这部分尚未实现，但请考虑影响）。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>取消</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                删除中...
              </>
            ) : (
              '删除'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
