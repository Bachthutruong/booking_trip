import { getSpamReportsCollection } from '@/lib/mongodb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { format } from 'date-fns';
import { verifyAdminToken } from '@/actions/adminAuthActions';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default async function SpamUserDetailPage({ params }: { params: { phone: string } }) {
    const user = await verifyAdminToken();
    if (!user.isAuthenticated || user.role !== 'admin') {
        return <div>You do not have permission to access this page.</div>;
    }

    const spamReportsCollection = await getSpamReportsCollection();
    const reports = await spamReportsCollection.find({ reportedUserPhone: params.phone }).sort({ createdAt: -1 }).toArray();

    if (reports.length === 0) {
        return (
            <div className="space-y-6 max-w-6xl mx-auto">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold font-headline">未找到垃圾用戶報告</h1>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/admin/spam"><ArrowLeft className="mr-2 h-4 w-4" /> 返回垃圾用戶列表</Link>
                </Button>
            </div>
        );
    }

    const latestReport = reports[0];
    const isBlocked = reports.length >= 3;

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-headline">垃圾用戶詳情</h1>
                <Button variant="outline" asChild>
                    <Link href="/admin/spam"><ArrowLeft className="mr-2 h-4 w-4" /> 返回垃圾用戶列表</Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>用戶信息</CardTitle>
                    <CardDescription>基本信息及當前狀態</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">用戶名稱</p>
                            <p className="font-medium">{latestReport.reportedUserName}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">電話</p>
                            <p className="font-medium">{latestReport.reportedUserPhone}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">報告次數</p>
                            <p className="font-medium">{reports.length} 次</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">當前狀態</p>
                            <Badge variant={isBlocked ? "destructive" : "secondary"}>
                                {isBlocked ? "已封鎖" : "警告"}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>報告歷史</CardTitle>
                    <CardDescription>所有針對該用戶的報告記錄</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>報告時間</TableHead>
                                <TableHead>報告人</TableHead>
                                <TableHead>行程編號</TableHead>
                                <TableHead>原因</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reports.map(report => (
                                <TableRow key={report.id}>
                                    <TableCell>{format(new Date(report.createdAt), "yyyy年MM月dd日 HH:mm")}</TableCell>
                                    <TableCell>{report.reportedBy}</TableCell>
                                    <TableCell>
                                        <Link href={`/admin/trips/${report.tripId}`} className="text-blue-500 hover:underline">
                                            {report.tripId}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{report.reason}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
} 