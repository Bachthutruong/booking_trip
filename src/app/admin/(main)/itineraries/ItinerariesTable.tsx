'use client';
import useSWR from 'swr';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Edit3, Clock } from 'lucide-react';
import { ITINERARY_TYPES } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DeleteItineraryButton } from './_components/DeleteItineraryButton';
import type { Itinerary } from '@/lib/types';

export default function ItinerariesTable() {
  const fetcher = (url: string) => fetch(url).then(res => res.json());
  const { data, isLoading, mutate } = useSWR('/api/admin/itineraries/list', fetcher, { revalidateOnFocus: false });
  const itineraries = data?.itineraries || [];

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>行程列表 ({itineraries.length})</CardTitle>
        <CardDescription>查看，編輯或刪除現有行程</CardDescription>
      </CardHeader>
      <CardContent>
        {itineraries.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">没有找到行程。添加一个以开始！</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">行程名稱</TableHead>
                  <TableHead>行程類別</TableHead>
                  <TableHead>每人價格（元）</TableHead>
                  {/* <TableHead className="min-w-[150px]">可用时间</TableHead> */}
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itineraries.map((itinerary: Itinerary) => (
                  <TableRow key={itinerary.id}>
                    <TableCell className="font-medium">{itinerary.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{ITINERARY_TYPES[itinerary.type]}</Badge>
                    </TableCell>
                    <TableCell>{itinerary.pricePerPerson.toLocaleString()}</TableCell>
                    {/* <TableCell>
                      {itinerary.availableTimes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {itinerary.availableTimes.slice(0, 3).map((time: string) => (
                            <Badge key={time} variant="outline" className="text-xs font-normal"><Clock className="h-3 w-3 mr-1" />{time}</Badge>
                          ))}
                          {itinerary.availableTimes.length > 3 && <Badge variant="outline" className="text-xs font-normal">...</Badge>}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">未设置</span>
                      )}
                    </TableCell> */}
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" asChild title={`编辑 ${itinerary.name}`}>
                        <Link href={`/admin/itineraries/${itinerary.id}/edit`}>
                          <Edit3 className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteItineraryButton itineraryId={itinerary.id} itineraryName={itinerary.name} onDeleted={mutate} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 