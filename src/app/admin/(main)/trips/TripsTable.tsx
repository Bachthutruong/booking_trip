'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import useSWR from 'swr';
import type { Trip } from '@/lib/types';

export default function TripsTable({ currentUser }: { currentUser: { id: string, username: string, role: 'admin' | 'staff' } }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const PAGE_SIZE = 10;

  // SWR fetcher
  const fetcher = (url: string) => fetch(url).then(res => res.json());
  const { data, isLoading, mutate } = useSWR(`/api/admin/trips/list?page=${page}&search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`, fetcher, { revalidateOnFocus: false });
  const trips = data?.trips || [];
  const totalTrips = data?.totalTrips || 0;
  const totalPages = Math.ceil(totalTrips / PAGE_SIZE);

  const handleDelete = async (tripId: string, status: string) => {
    setDeletingId(tripId);
    const res = await fetch('/api/admin/trips/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripId }),
    });
    const result = await res.json();
    setDeletingId(null);
    setConfirmId(null);
    if (result.success) {
      mutate();
      router.refresh();
    } else {
      alert(result.message);
    }
  };
  console.log(trips, 'trips');

  return (
    <div className="space-y-6">
      <div className="shadow-lg rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[80px]">ID</TableHead>
              <TableHead className="min-w-[150px]">行程</TableHead>
              <TableHead>日期</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead className="min-w-[120px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trips.map((trip: Trip) => (
              <TableRow key={trip.id}>
                <TableCell className="font-mono text-xs">{trip.id}</TableCell>
                <TableCell className="font-medium">
                  {trip.itineraryName}
                  <Badge variant="outline" className="ml-2 text-xs">{trip.itineraryType ? trip.itineraryType.charAt(0).toUpperCase() + trip.itineraryType.slice(1) : ''}</Badge>
                </TableCell>
                <TableCell>
                  {trip.date ? new Date(trip.date).toLocaleDateString() : ''}<br />
                  <span className="text-xs text-muted-foreground">{trip.time}</span>
                </TableCell>
                <TableCell>
                  {trip.isDeleted ? (
                    <Badge variant="destructive">已刪除</Badge>
                  ) : (
                    <Badge
                      variant={trip.overallStatus === 'payment_confirmed' ? 'default' : trip.overallStatus === 'pending_payment' ? 'outline' : 'secondary'}
                      className={trip.overallStatus === 'payment_confirmed' ? 'bg-green-500 text-white' : trip.overallStatus === 'pending_payment' ? 'border-yellow-500 text-yellow-600' : ''}
                    >
                      {trip.overallStatus === 'payment_confirmed' ? '已付款' : trip.overallStatus === 'pending_payment' ? '待付款' : '已完成'}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="space-y-1 sm:space-y-0 sm:space-x-2 text-right">
                  <Button variant="outline" size="sm" asChild title="View Details">
                    <Link href={`/admin/trips/${trip.id}`}>
                      <Eye className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" /> 查看
                    </Link>
                  </Button>
                  {((currentUser.role === 'admin') || (trip.overallStatus !== 'payment_confirmed' && currentUser.role === 'staff')) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deletingId === trip.id}
                          onClick={() => setConfirmId(trip.id)}
                        >
                          {deletingId === trip.id ? '刪除中...' : '刪除'}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>確認刪除行程？</AlertDialogTitle>
                          <AlertDialogDescription>
                            你確定要刪除這個行程嗎？此操作無法撤銷，行程將被移動到已刪除列表。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setConfirmId(null)}>取消</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(trip.id, trip.overallStatus)}
                            disabled={deletingId === trip.id}
                          >
                            確認刪除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* Pagination controls */}
      <div className="flex justify-center items-center gap-2 mt-6">
        <Button asChild variant="outline" size="sm" disabled={page === 1}>
          <Link href={`?page=${page - 1}`}>上一頁</Link>
        </Button>
        {Array.from({ length: totalPages }, (_, i) => (
          <Button
            key={i + 1}
            asChild
            variant={page === i + 1 ? 'default' : 'outline'}
            size="sm"
            className={page === i + 1 ? 'font-bold' : ''}
            disabled={page === i + 1}
          >
            <Link href={`?page=${i + 1}`}>{i + 1}</Link>
          </Button>
        ))}
        <Button asChild variant="outline" size="sm" disabled={page === totalPages || totalPages === 0}>
          <Link href={`?page=${page + 1}`}>下一頁</Link>
        </Button>
      </div>
    </div>
  );
} 