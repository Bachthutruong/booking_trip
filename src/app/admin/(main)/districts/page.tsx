import { getDistrictSurchargesCollection } from '@/lib/mongodb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
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

const PAGE_SIZE = 10;

export default async function AdminDistrictsPage({ searchParams }: { searchParams?: { page?: string } }) {
    const page = parseInt(searchParams?.page || '1', 10);
    const collection = await getDistrictSurchargesCollection();
    const total = await collection.countDocuments();
    const districts = await collection.find({})
        .sort({ districtName: 1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .toArray();
    const totalPages = Math.ceil(total / PAGE_SIZE);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-headline">管理加費的區域 ({total})</h1>
                <Button asChild>
                    <Link href="/admin/districts/new"><PlusCircle className="mr-2 h-4 w-4" /> 新增加費的區域</Link>
                </Button>
            </div>

            <Card className="shadow-lg">
                {/* <CardHeader>
                    <CardTitle>区域附加费用列表</CardTitle>
                    <CardDescription>查看和管理特定区域的附加费用。</CardDescription>
                </CardHeader> */}
                <CardContent>
                    {districts.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">没有找到区域附加费用。创建一个以开始！</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>區域名稱</TableHead>
                                        <TableHead>附加費用</TableHead>
                                        <TableHead className="text-right">操作</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {districts.map((district: any) => (
                                        <TableRow key={district._id?.toString?.() || district.id}>
                                            <TableCell className="font-medium">{district.districtName}</TableCell>
                                            <TableCell>{district.surchargeAmount.toLocaleString()} 元</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/admin/districts/${district._id?.toString?.() || district.id}/edit`}>編輯</Link>
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            asChild
                                                        >
                                                            <span>删除</span>
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>删除区域附加费用？</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                你确定要删除 <b>{district.districtName}</b> 吗？此操作无法撤消。
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>取消</AlertDialogCancel>
                                                            <AlertDialogAction asChild>
                                                                <Link href={`/admin/districts/${district._id?.toString?.() || district.id}/edit?delete=1`} prefetch={false}>删除</Link>
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <div className="flex justify-end items-center gap-2 mt-4">
                                <Button variant="outline" size="sm" disabled={page === 1} asChild>
                                    <Link href={`?page=${page - 1}`}>上一页</Link>
                                </Button>
                                <span>第 {page} 页 / 共 {totalPages} 页</span>
                                <Button variant="outline" size="sm" disabled={page === totalPages} asChild>
                                    <Link href={`?page=${page + 1}`}>下一页</Link>
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 