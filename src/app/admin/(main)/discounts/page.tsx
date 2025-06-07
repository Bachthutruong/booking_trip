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
                <h1 className="text-3xl font-bold font-headline">Manage Discount Codes ({discountCodes.length})</h1>
                <Button asChild>
                    <Link href="/admin/discounts/new"><PlusCircle className="mr-2 h-4 w-4" /> New Discount</Link>
                </Button>
            </div>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Discount Code List</CardTitle>
                    <CardDescription>View and manage all available discount codes.</CardDescription>
                </CardHeader>
                <CardContent>
                    {discountCodes.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No discount codes found. Create one to get started!</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Discount</TableHead>
                                        <TableHead>Expires</TableHead>
                                        <TableHead>Active</TableHead>
                                        <TableHead>Usage Limit</TableHead>
                                        <TableHead>Used Count</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
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
                                            badgeText = "Exhausted";
                                        } else if (isExpired) {
                                            badgeVariant = "secondary";
                                            badgeText = "Expired";
                                        } else if (discount.isActive) {
                                            badgeVariant = "default";
                                            badgeText = "Active";
                                        } else {
                                            badgeVariant = "secondary";
                                            badgeText = "Inactive";
                                        }
                                        return (
                                            <TableRow key={discount.id} className={cn(
                                                {
                                                    'opacity-50 pointer-events-none': isExhausted || !discount.isActive || isExpired
                                                }
                                            )}>
                                                <TableCell className="font-medium">{discount.code}</TableCell>
                                                <TableCell>{discount.type === 'percentage' ? `${discount.value}%` : `${discount.value.toLocaleString()} VND`}</TableCell>
                                                <TableCell>
                                                    {discount.expiryDate ? format(new Date(discount.expiryDate), "MMM dd, yyyy") : "N/A"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={badgeVariant}>
                                                        {badgeText}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{discount.usageLimit === null || discount.usageLimit === undefined ? "Unlimited" : discount.usageLimit}</TableCell>
                                                <TableCell>{(discount.usedCount || 0)}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="outline" size="sm" asChild disabled={isExhausted || !discount.isActive || isExpired}>
                                                        <Link href={`/admin/discounts/${discount.id}/edit`}>Edit</Link>
                                                    </Button>
                                                    {/* Add Delete Button here if needed */}
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