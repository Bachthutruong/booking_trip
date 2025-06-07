import ItineraryForm from "../../_components/ItineraryForm";
import { getItineraryById, updateItinerary } from "@/actions/itineraryActions";
import type { ItineraryFormValues } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function EditItineraryPage({ params }: { params: { itineraryId: string } }) {
  const { itineraryId } = params;
  const itinerary = await getItineraryById(itineraryId);

  if (!itinerary) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto text-center py-10">
        <p className="text-destructive text-lg">Itinerary not found.</p>
        <Button variant="outline" asChild>
          <Link href="/admin/itineraries"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Itineraries</Link>
        </Button>
      </div>
    );
  }

  // Convert itinerary to a plain object by excluding _id (ObjectId)
  const { _id, ...plainItinerary } = itinerary;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Button variant="outline" asChild className="mb-4">
        <Link href="/admin/itineraries"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Itineraries</Link>
      </Button>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Edit Itinerary: {itinerary.name}</CardTitle>
          <CardDescription>Update the details for this travel itinerary. Ensure available times are comma-separated (e.g., 08:00,14:30).</CardDescription>
        </CardHeader>
        <CardContent>
          <ItineraryForm
            initialData={plainItinerary}
            isEditMode={true}
            itineraryId={itineraryId}
            submitButtonText="Update Itinerary"
          />
        </CardContent>
      </Card>
    </div>
  );
}
