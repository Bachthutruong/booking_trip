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
                <h1 className="text-3xl font-bold font-headline">Manage Additional Services ({additionalServices.length})</h1>
                <Button asChild>
                    <Link href="/admin/services/new"><PlusCircle className="mr-2 h-4 w-4" /> New Service</Link>
                </Button>
            </div>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Additional Service List</CardTitle>
                    <CardDescription>View and manage optional services customers can add to their trips.</CardDescription>
                </CardHeader>
                <CardContent>
                    {additionalServices.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No additional services found. Create one to get started!</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Applicable To</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {additionalServices.map((service: AdditionalService) => (
                                        <TableRow key={service.id}>
                                            <TableCell className="font-medium">{service.name}</TableCell>
                                            <TableCell>{service.price.toLocaleString()} 元</TableCell>
                                            <TableCell className="text-muted-foreground text-sm">{service.description || 'N/A'}</TableCell>
                                            <TableCell>
                                                {service.applicableTo && service.applicableTo.length > 0 ? (
                                                    service.applicableTo.map((type: ItineraryType) => (
                                                        <Badge key={type} variant="secondary" className="mr-1 mb-1">
                                                            {ITINERARY_TYPES[type]}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <Badge variant="outline">Any</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/admin/services/${service.id}/edit`}>Edit</Link>
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