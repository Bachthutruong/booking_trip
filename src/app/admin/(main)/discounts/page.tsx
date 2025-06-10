import { getAllDiscountCodes } from '@/actions/discountActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { PlusCircle, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DiscountCode } from '@/lib/types';

export default async function AdminDiscountsPage() {
    const discountCodes = await getAllDiscountCodes();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-headline">管理折扣代码 ({discountCodes.length})</h1>
                <Button asChild>
                    <Link href="/admin/discounts/new"><PlusCircle className="mr-2 h-4 w-4" /> 新折扣</Link>
                </Button>
            </div>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>折扣代码列表</CardTitle>
                    <CardDescription>查看和管理所有可用的折扣代码。</CardDescription>
                </CardHeader>
                <CardContent>
                    {discountCodes.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">没有找到折扣代码。创建一个以开始！</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>代码</TableHead>
                                        <TableHead>折扣</TableHead>
                                        <TableHead>过期</TableHead>
                                        <TableHead>活动</TableHead>
                                        <TableHead>使用限制</TableHead>
                                        <TableHead>已使用</TableHead>
                                        <TableHead className="text-right">操作</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {discountCodes.map((discount) => {
                                        const isExhausted = discount.usageLimit !== undefined && discount.usageLimit !== null && (discount.usedCount || 0) >= discount.usageLimit;
                                        const isExpired = discount.expiryDate ? new Date(discount.expiryDate) < new Date() : false;

                                        let badgeVariant: "default" | "secondary" | "outline";
                                        let badgeText: string;

                                        if (isExhausted) {
                                            badgeVariant = "secondary";
                                            badgeText = "已用完";
                                        } else if (isExpired) {
                                            badgeVariant = "secondary";
                                            badgeText = "已过期";
                                        } else if (discount.isActive) {
                                            badgeVariant = "default";
                                            badgeText = "活动";
                                        } else {
                                            badgeVariant = "secondary";
                                            badgeText = "不活动";
                                        }
                                        return (
                                            <TableRow key={discount.id} className={cn(
                                                {
                                                    'opacity-50 pointer-events-none': isExhausted || !discount.isActive || isExpired
                                                }
                                            )}>
                                                <TableCell className="font-medium">{discount.code}</TableCell>
                                                <TableCell>{discount.type === 'percentage' ? `${discount.value}%` : `${discount.value.toLocaleString()} 元`}</TableCell>
                                                <TableCell>
                                                    {discount.expiryDate ? format(new Date(discount.expiryDate), "MMM dd, yyyy") : "N/A"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={badgeVariant}>
                                                        {badgeText}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{discount.usageLimit === null || discount.usageLimit === undefined ? "无限" : discount.usageLimit}</TableCell>
                                                <TableCell>{(discount.usedCount || 0)}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="outline" size="sm" asChild disabled={isExhausted || !discount.isActive || isExpired}>
                                                        <Link href={`/admin/discounts/${discount.id}/edit`}>编辑</Link>
                                                    </Button>
                                                    {/* 如果需要，在此处添加删除按钮 */}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 