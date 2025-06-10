'use client';
import { useEffect, useState } from 'react';
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

export default function AdminDistrictsPage() {
    const [districts, setDistricts] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const fetchDistricts = async (pageNum = 1) => {
        setLoading(true);
        const res = await fetch(`/api/admin/districts/list?page=${pageNum}&pageSize=${PAGE_SIZE}`);
        const data = await res.json();
        setDistricts(data.districts);
        setTotal(data.total);
        setPage(data.page);
        setLoading(false);
    };

    useEffect(() => {
        fetchDistricts(page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        const res = await fetch('/api/admin/districts/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ districtId: id }),
        });
        const data = await res.json();
        setDeletingId(null);
        setConfirmDeleteId(null);
        if (data.success) {
            fetchDistricts(page);
        } else {
            alert(data.message || '删除失败。');
        }
    };

    const totalPages = Math.ceil(total / PAGE_SIZE);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-headline">管理区域附加费用 ({total})</h1>
                <Button asChild>
                    <Link href="/admin/districts/new"><PlusCircle className="mr-2 h-4 w-4" /> 新区域附加费用</Link>
                </Button>
            </div>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>区域附加费用列表</CardTitle>
                    <CardDescription>查看和管理特定区域的附加费用。</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-center py-8">加载中...</p>
                    ) : districts.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">没有找到区域附加费用。创建一个以开始！</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>区域名称</TableHead>
                                        <TableHead>附加费用</TableHead>
                                        <TableHead className="text-right">操作</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {districts.map((district) => (
                                        <TableRow key={district.id}>
                                            <TableCell className="font-medium">{district.districtName}</TableCell>
                                            <TableCell>{district.surchargeAmount.toLocaleString()} 元</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/admin/districts/${district.id}/edit`}>编辑</Link>
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            disabled={deletingId === district.id}
                                                            onClick={() => setConfirmDeleteId(district.id)}
                                                        >
                                                            {deletingId === district.id ? '删除中...' : '删除'}
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
                                                            <AlertDialogCancel onClick={() => setConfirmDeleteId(null)}>取消</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDelete(district.id)}
                                                                disabled={deletingId === district.id}
                                                            >
                                                                {deletingId === district.id ? '删除中...' : '删除'}
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
                                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                                    上一页
                                </Button>
                                <span>第 {page} 页 / 共 {totalPages} 页</span>
                                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                                    下一页
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 