import { getAllDistrictSurcharges } from '@/actions/districtActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { PlusCircle, MapPinned } from 'lucide-react';

export default async function AdminDistrictsPage() {
    const districtSurcharges = await getAllDistrictSurcharges();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-headline">Manage District Surcharges ({districtSurcharges.length})</h1>
                <Button asChild>
                    <Link href="/admin/districts/new"><PlusCircle className="mr-2 h-4 w-4" /> New District Surcharge</Link>
                </Button>
            </div>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>District Surcharge List</CardTitle>
                    <CardDescription>View and manage additional charges for specific districts.</CardDescription>
                </CardHeader>
                <CardContent>
                    {districtSurcharges.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No district surcharges found. Create one to get started!</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>District Name</TableHead>
                                        <TableHead>Surcharge Amount</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {districtSurcharges.map((district) => (
                                        <TableRow key={district.id}>
                                            <TableCell className="font-medium">{district.districtName}</TableCell>
                                            <TableCell>{district.surchargeAmount.toLocaleString()} VND</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/admin/districts/${district.id}/edit`}>Edit</Link>
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