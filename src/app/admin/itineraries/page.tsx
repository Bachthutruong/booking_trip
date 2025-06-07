
import { getItineraries, deleteItinerary } from '@/actions/itineraryActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { PlusCircle, Edit3, Trash2, Eye } from 'lucide-react';
import { ITINERARY_TYPES } from '@/lib/constants';
import { DeleteItineraryButton } from './_components/DeleteItineraryButton';


export default async function AdminItinerariesPage() {
  const itineraries = await getItineraries();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Manage Itineraries</h1>
        <Button asChild>
          <Link href="/admin/itineraries/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Itinerary
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Itinerary List</CardTitle>
          <CardDescription>View, edit, or delete existing itineraries.</CardDescription>
        </CardHeader>
        <CardContent>
          {itineraries.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No itineraries found. Add one to get started!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Price (VND)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itineraries.map((itinerary) => (
                  <TableRow key={itinerary.id}>
                    <TableCell className="font-medium">{itinerary.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{ITINERARY_TYPES[itinerary.type]}</Badge>
                    </TableCell>
                    <TableCell>{itinerary.pricePerPerson.toLocaleString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" asChild title="View/Edit">
                        <Link href={`/admin/itineraries/${itinerary.id}/edit`}>
                          <Edit3 className="h-4 w-4" />
                        </Link>
                      </Button>
                       <DeleteItineraryButton itineraryId={itinerary.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
