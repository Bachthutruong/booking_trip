import { getParticipantsWithProofNotConfirmed } from '@/actions/tripActions';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import PaymentProofPreviewButton from '@/components/admin/PaymentProofPreviewButton';
import { ConfirmPaymentButton } from '@/components/admin/ConfirmPaymentButton';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Image as ImageIcon, CheckCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function PendingProofPage() {
  const participants = await getParticipantsWithProofNotConfirmed();
  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <ImageIcon className="text-blue-500 w-7 h-7" />
          <div>
            <h2 className="text-2xl font-bold">待审核凭证</h2>
            <p className="text-muted-foreground text-sm mt-1">列出已上传转账证明但未获确认的客户。请仔细检查后再确认！</p>
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
              <TableHead className="text-right">金额</TableHead>
              <TableHead>查看凭证</TableHead>
              <TableHead>确认付款</TableHead>
              <TableHead>行程ID</TableHead>
              <TableHead>行程名稱</TableHead>
              <TableHead>角色</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10">
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="w-8 h-8 text-muted-foreground" />
                    <span className="text-muted-foreground">没有客户待审核凭证。</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              participants.map((p, idx) => (
                <TableRow key={p.participantId} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                  <TableCell className="font-medium flex items-center gap-2">
                    {p.name}
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">待审核</Badge>
                  </TableCell>
                  <TableCell>{p.phone}</TableCell>
                  <TableCell className="text-right font-semibold text-blue-700">{p.pricePaid?.toLocaleString() ?? ''} <span className="text-xs text-muted-foreground">元</span></TableCell>
                  <TableCell>
                    <span title="查看转账证明"><PaymentProofPreviewButton imageUrl={p.transferProofImageUrl} /></span>
                  </TableCell>
                  <TableCell>
                    <span title="确认付款"><ConfirmPaymentButton tripId={p.tripId} participantId={p.participantId} isMainBooker={p.isMainBooker} /></span>
                  </TableCell>
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
      <div className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-green-500" /> 确认付款将自动更新客户状态。
      </div>
    </div>
  );
} 