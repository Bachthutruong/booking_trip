import { getParticipantsNotPaid } from '@/actions/tripActions';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function NotPaidPage() {
  const participants = await getParticipantsNotPaid();
  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-yellow-500 w-7 h-7" />
          <div>
            <h2 className="text-2xl font-bold">未付款</h2>
            <p className="text-muted-foreground text-sm mt-1">列出未付款且未上传转账证明的客户。</p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/trips">← 返回行程列表</Link>
        </Button>
      </div>    
      <div className="shadow-xl rounded-xl border bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>姓名</TableHead>
              <TableHead>电话</TableHead>
              <TableHead>行程ID</TableHead>
              <TableHead>行程名称</TableHead>
              <TableHead>角色</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="w-8 h-8 text-muted-foreground" />
                    <span className="text-muted-foreground">没有客户未付款。</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              participants.map((p, idx) => (
                <TableRow key={p.participantId} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                  <TableCell className="font-medium flex items-center gap-2">
                    {p.name}
                    <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-300">未付款</Badge>
                  </TableCell>
                  <TableCell>{p.phone}</TableCell>
                  <TableCell>
                    <Link href={`/admin/trips/${p.tripId}`} className="underline text-blue-600" title="查看行程详情">{p.tripId}</Link>
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate" title={p.itineraryName}>{p.itineraryName}</TableCell>
                  <TableCell>
                    {p.isMainBooker ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-300">主要预订者</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">参与者</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 