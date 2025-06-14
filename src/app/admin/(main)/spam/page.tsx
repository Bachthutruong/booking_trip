import { getSpamReportsCollection } from '@/lib/mongodb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { format } from 'date-fns';
import { verifyAdminToken } from '@/actions/adminAuthActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface PageProps {
    searchParams: {
        page?: string;
        search?: string;
    };
}

export default async function AdminSpamPage({ searchParams }: PageProps) {
    const user = await verifyAdminToken();
    if (!user.isAuthenticated || user.role !== 'admin') {
        return <div>You do not have permission to access this page.</div>;
    }

    const currentPage = Number(searchParams.page) || 1;
    const searchQuery = searchParams.search || '';
    const itemsPerPage = 10;

    const spamReportsCollection = await getSpamReportsCollection();
    const reports = await spamReportsCollection.find({}).sort({ createdAt: -1 }).toArray();

    // Group reports by user phone to count spam reports
    const userSpamCounts = reports.reduce((acc: { [key: string]: number }, report) => {
        acc[report.reportedUserPhone] = (acc[report.reportedUserPhone] || 0) + 1;
        return acc;
    }, {});

    // Filter users based on search query
    const filteredUsers = Object.entries(userSpamCounts)
        .filter(([phone, _]) => {
            const userReports = reports.filter(r => r.reportedUserPhone === phone);
            const latestReport = userReports[0];
            return (
                latestReport.reportedUserName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                phone.includes(searchQuery)
            );
        });

    // Calculate pagination
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-headline">垃圾用戶報告</h1>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div>
                            <CardTitle>垃圾用戶列表</CardTitle>
                            <CardDescription>顯示被報告的用戶及其報告次數</CardDescription>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <form className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="搜尋用戶..."
                                        name="search"
                                        defaultValue={searchQuery}
                                        className="pl-8"
                                    />
                                </div>
                                <Button type="submit">搜尋</Button>
                            </form>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>用戶名稱</TableHead>
                                <TableHead>電話</TableHead>
                                <TableHead>報告次數</TableHead>
                                {/* <TableHead>狀態</TableHead> */}
                                <TableHead>最後報告時間</TableHead>
                                <TableHead>操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedUsers.map(([phone, count]) => {
                                const userReports = reports.filter(r => r.reportedUserPhone === phone);
                                const latestReport = userReports[0];
                                const isBlocked = count >= 3;

                                return (
                                    <TableRow key={phone}>
                                        <TableCell>{latestReport.reportedUserName}</TableCell>
                                        <TableCell>{phone}</TableCell>
                                        <TableCell>{count}</TableCell>
                                        {/* <TableCell>
                                            <Badge variant={isBlocked ? "destructive" : "secondary"}>
                                                {isBlocked ? "已封鎖" : "警告"}
                                            </Badge>
                                        </TableCell> */}
                                        <TableCell>{format(new Date(latestReport.createdAt), "yyyy年MM月dd日 HH:mm")}</TableCell>
                                        <TableCell>
                                            <Link href={`/admin/spam/${phone}`}>
                                                <Button variant="outline" size="sm">查看詳情</Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {totalPages >= 1 && (
                        <div className="flex items-center justify-center space-x-2 mt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === 1}
                                asChild
                            >
                                <Link href={`/admin/spam?page=${currentPage - 1}${searchQuery ? `&search=${searchQuery}` : ''}`}>
                                    上一頁
                                </Link>
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                第 {currentPage} 頁，共 {totalPages} 頁
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === totalPages}
                                asChild
                            >
                                <Link href={`/admin/spam?page=${currentPage + 1}${searchQuery ? `&search=${searchQuery}` : ''}`}>
                                    下一頁
                                </Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 