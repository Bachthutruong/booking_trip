import { getAllAdditionalServices } from '@/actions/additionalServiceActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { PlusCircle, Wand2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ITINERARY_TYPES } from '@/lib/constants';
import type { AdditionalService, ItineraryType } from '@/lib/types';

export default async function AdminServicesPage() {
    const additionalServices = await getAllAdditionalServices();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-headline">管理附加服務 ({additionalServices.length})</h1>
                <Button asChild>
                    <Link href="/admin/services/new"><PlusCircle className="mr-2 h-4 w-4" /> 新增附加服務</Link>
                </Button>
            </div>

            <Card className="shadow-lg">
                {/* <CardHeader>
                    <CardTitle>附加服务列表</CardTitle>
                    <CardDescription>查看和管理客户可以添加到他们的行程中的可选服务。</CardDescription>
                </CardHeader> */}
                <CardContent>
                    {additionalServices.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">没有附加服务。创建一个以开始！</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>名稱</TableHead>
                                        <TableHead>價格</TableHead>
                                        {/* <TableHead>描述</TableHead> */}
                                        <TableHead>類別</TableHead>
                                        <TableHead className="text-right">操作</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {additionalServices.map((service: AdditionalService) => (
                                        <TableRow key={service.id}>
                                            <TableCell className="font-medium">{service.name}</TableCell>
                                            <TableCell>{service.price.toLocaleString()} 元</TableCell>
                                            {/* <TableCell className="text-muted-foreground text-sm">{service.description || 'N/A'}</TableCell> */}
                                            <TableCell>
                                                {service.applicableTo && service.applicableTo.length > 0 ? (
                                                    service.applicableTo.map((type: ItineraryType) => (
                                                        <Badge key={type} variant="secondary" className="mr-1 mb-1">
                                                            {ITINERARY_TYPES[type]}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <Badge variant="outline">任何</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/admin/services/${service.id}/edit`}>編輯</Link>
                                                </Button>
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