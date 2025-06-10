import { getTripsCollection } from '@/lib/mongodb';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { verifyAdminToken } from '@/actions/adminAuthActions';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function DeletedTripsPage() {
  const user = await verifyAdminToken();
  if (!user.isAuthenticated || user.role !== 'admin') {
    return <div className="text-destructive">您没有权限查看此页面。</div>;
  }
  const tripsCollection = await getTripsCollection();
  const deletedTrips = await tripsCollection.find({ isDeleted: true }).sort({ deletedAt: -1 }).toArray();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">已删除行程记录</h1>
      <Card>
        <CardHeader>
          <CardTitle>已删除行程</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">编号</th>
                  <th className="px-4 py-2 text-left">行程名称</th>
                  <th className="px-4 py-2 text-left">日期</th>
                  <th className="px-4 py-2 text-left">状态</th>
                  <th className="px-4 py-2 text-left">操作</th>
                  <th className="px-4 py-2 text-left">删除人</th>
                  <th className="px-4 py-2 text-left">删除时间</th>
                </tr>
              </thead>
              <tbody>
                {deletedTrips.map((trip) => (
                  <tr key={trip.id} className="">
                    <td className="px-4 py-2 font-mono text-xs">{trip.id}</td>
                    <td className="px-4 py-2 font-medium">
                      {trip.itineraryName}
                      <Badge variant="outline" className="ml-2 text-xs">{trip.itineraryType ? trip.itineraryType.charAt(0).toUpperCase() + trip.itineraryType.slice(1) : ''}</Badge>
                    </td>
                    <td className="px-4 py-2">
                      {trip.date ? new Date(trip.date).toLocaleDateString() : ''}<br />
                      <span className="text-xs text-muted-foreground">{trip.time}</span>
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant="destructive">已删除</Badge>
                    </td>
                    <td className="px-4 py-2">
                      <Button variant="outline" size="sm" asChild title="查看详情">
                        <Link href={`/admin/trips/${trip.id}`}>
                          <Eye className="mr-1 h-3 w-3" /> 查看
                        </Link>
                      </Button>
                    </td>
                    <td className="px-4 py-2">{trip.deletedBy}</td>
                    <td className="px-4 py-2">{trip.deletedAt ? format(new Date(trip.deletedAt), 'yyyy年MM月dd日 HH:mm') : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 