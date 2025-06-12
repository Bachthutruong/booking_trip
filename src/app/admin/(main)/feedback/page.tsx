import { getFeedbackPaginated } from '@/actions/feedbackActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { MessageSquare, Eye } from 'lucide-react';
import { format } from 'date-fns';
import type { Feedback } from '@/lib/types';
import { redirect } from 'next/navigation';

const PAGE_SIZE = 10;

export default async function AdminFeedbackPage({ searchParams }: { searchParams?: { page?: string } }) {
    const page = Number(searchParams?.page) > 0 ? Number(searchParams?.page) : 1;
    const skip = (page - 1) * PAGE_SIZE;
    const { feedback: feedbackEntries, total } = await getFeedbackPaginated(PAGE_SIZE, skip);
    console.log(feedbackEntries, 'feedbackEntries');
    const totalPages = Math.ceil(total / PAGE_SIZE);

    // Nếu page vượt quá totalPages, redirect về page 1
    if (page > 1 && page > totalPages) redirect('/admin/feedback?page=1');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-headline">管理聯絡客服 ({total})</h1>
            </div>

            <Card className="shadow-lg">
                {/* <CardHeader>
                    <CardTitle>反馈列表</CardTitle>
                    <CardDescription>查看所有客户反馈提交。</CardDescription>
                </CardHeader> */}
                <CardContent>
                    {feedbackEntries.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">没有反馈提交。</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>提交者名稱</TableHead>
                                        <TableHead>信箱</TableHead>
                                        <TableHead>聯絡電話</TableHead>
                                        <TableHead>行程ID</TableHead>
                                        <TableHead>消息</TableHead>
                                        <TableHead>聯絡時間</TableHead>
                                        <TableHead className="text-right">操作</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {feedbackEntries.map((feedback: Feedback) => (
                                        <TableRow key={feedback.id}>
                                            <TableCell className="font-medium">{feedback.name}</TableCell>
                                            <TableCell>{feedback.email}</TableCell>
                                            <TableCell>{feedback.phone || 'N/A'}</TableCell>
                                            <TableCell>{feedback.tripId || 'N/A'}</TableCell>
                                            <TableCell className="text-muted-foreground text-sm max-w-sm overflow-hidden text-ellipsis whitespace-nowrap">
                                                {feedback.message}
                                            </TableCell>
                                            <TableCell>{format(new Date(feedback.submittedAt), "MMM dd, yyyy HH:mm")}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/admin/feedback/${feedback.id}`}>查看</Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                    {/* Pagination controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-6">
                            <Button variant="outline" size="sm" asChild disabled={page <= 1}>
                                <Link href={`/admin/feedback?page=${page - 1}`}>上一页</Link>
                            </Button>
                            <span className="px-2 py-1 text-sm">第 {page} 页，共 {totalPages} 页</span>
                            <Button variant="outline" size="sm" asChild disabled={page >= totalPages}>
                                <Link href={`/admin/feedback?page=${page + 1}`}>下一页</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 