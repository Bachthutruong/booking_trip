import { getAllDiscountCodes } from '@/actions/discountActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { PlusCircle, Tag } from 'lucide-react';
import { format } from 'date-fns';

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
                                        <TableHead>Discount (%)</TableHead>
                                        <TableHead>Expires</TableHead>
                                        <TableHead>Active</TableHead>
                                        <TableHead>Usage Limit</TableHead>
                                        <TableHead>Used Count</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {discountCodes.map((discount) => (
                                        <TableRow key={discount.id}>
                                            <TableCell className="font-medium">{discount.code}</TableCell>
                                            <TableCell>{discount.discountPercentage}%</TableCell>
                                            <TableCell>
                                                {discount.expiryDate ? format(new Date(discount.expiryDate), "MMM dd, yyyy") : "N/A"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={discount.isActive ? "default" : "secondary"}>
                                                    {discount.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{discount.usageLimit || "Unlimited"}</TableCell>
                                            <TableCell>{discount.usedCount || 0}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/admin/discounts/${discount.id}/edit`}>Edit</Link>
                                                </Button>
                                                {/* Add Delete Button here if needed */}
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