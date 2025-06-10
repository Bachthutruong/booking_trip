
import { getItineraries } from '@/actions/itineraryActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { PlusCircle, Edit3, Eye, Clock } from 'lucide-react';
import { ITINERARY_TYPES } from '@/lib/constants';
import { DeleteItineraryButton } from './_components/DeleteItineraryButton';
import { Itinerary } from '@/lib/types';

export default async function AdminItinerariesPage() {
  const itineraries = await getItineraries();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">管理行程   </h1>
        <Button asChild>
          <Link href="/admin/itineraries/new">
            <PlusCircle className="mr-2 h-5 w-5" /> 添加新行程
          </Link>
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>行程列表 ({itineraries.length})</CardTitle>
          <CardDescription>查看、编辑或删除现有行程。</CardDescription>
        </CardHeader>
        <CardContent>
          {itineraries.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">没有找到行程。添加一个以开始！</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">名称</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>价格 (元)</TableHead>
                    <TableHead className="min-w-[150px]">可用时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itineraries.map((itinerary) => (
                    <TableRow key={itinerary.id}>
                      <TableCell className="font-medium">{itinerary.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{ITINERARY_TYPES[itinerary.type]}</Badge>
                      </TableCell>
                      <TableCell>{itinerary.pricePerPerson.toLocaleString()}</TableCell>
                      <TableCell>
                        {itinerary.availableTimes.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {itinerary.availableTimes.slice(0, 3).map(time => (
                              <Badge key={time} variant="outline" className="text-xs font-normal"><Clock className="h-3 w-3 mr-1" />{time}</Badge>
                            ))}
                            {itinerary.availableTimes.length > 3 && <Badge variant="outline" className="text-xs font-normal">...</Badge>}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">未设置</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon" asChild title={`编辑 ${itinerary.name}`}>
                          <Link href={`/admin/itineraries/${itinerary.id}/edit`}>
                            <Edit3 className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DeleteItineraryButton itineraryId={itinerary.id} itineraryName={itinerary.name} />
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
