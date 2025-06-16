'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ITINERARY_TYPES } from '@/lib/constants';
import type { AdditionalService, ItineraryType } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

export default function AdminServicesPageClient({ initialServices }: { initialServices: AdditionalService[] }) {
    const [services, setServices] = useState<AdditionalService[]>(initialServices);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const router = useRouter();
    const [deleteTarget, setDeleteTarget] = useState<AdditionalService | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    function openDeleteDialog(service: AdditionalService) {
        setDeleteTarget(service);
        setDialogOpen(true);
    }
    function closeDeleteDialog() {
        setDialogOpen(false);
        setDeleteTarget(null);
    }

    async function handleDelete() {
        if (!deleteTarget) return;
        setDialogOpen(false);
        startTransition(async () => {
            const res = await fetch('/api/admin/services/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serviceId: deleteTarget.id }),
            });
            const data = await res.json();
            if (data.success) {
                setServices(services.filter(s => s.id !== deleteTarget.id));
                toast({ title: '已刪除服務', description: data.message });
            } else {
                toast({ title: '刪除失敗', description: data.message, variant: 'destructive' });
            }
            setDeleteTarget(null);
        });
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-headline">管理附加服務 ({services.length})</h1>
                <Button asChild>
                    <Link href="/admin/services/new"><PlusCircle className="mr-2 h-4 w-4" /> 新增附加服務</Link>
                </Button>
            </div>

            <Card className="shadow-lg">
                <CardContent>
                    {services.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">没有附加服务。创建一个以开始！</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>名稱</TableHead>
                                        <TableHead>價格</TableHead>
                                        <TableHead>類別</TableHead>
                                        <TableHead className="text-right">操作</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {services.map((service: AdditionalService) => (
                                        <TableRow key={service.id}>
                                            <TableCell className="font-medium">{service.name}</TableCell>
                                            <TableCell>{service.price.toLocaleString()} 元</TableCell>
                                            <TableCell>
                                                {service.applicableTo && service.applicableTo.length > 0 ? (
                                                    service.applicableTo.map((type: ItineraryType) => (
                                                        <Badge key={type} variant="secondary" className="mr-1 mb-1">
                                                            {ITINERARY_TYPES[type]}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <Badge variant="outline">任何</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/admin/services/${service.id}/edit`}>編輯</Link>
                                                </Button>
                                                <AlertDialog open={dialogOpen && deleteTarget?.id === service.id} onOpenChange={setDialogOpen}>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(service)} disabled={isPending}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>確認刪除服務</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                您確定要刪除服務 <b>{service.name}</b> 嗎？此操作無法撤消。
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel onClick={closeDeleteDialog}>取消</AlertDialogCancel>
                                                            <AlertDialogAction onClick={handleDelete} disabled={isPending}>刪除</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 