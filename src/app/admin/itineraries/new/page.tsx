
import ItineraryForm from "../_components/ItineraryForm";
import { createItinerary } from "@/actions/itineraryActions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NewItineraryPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Button variant="outline" asChild className="mb-4">
        <Link href="/admin/itineraries"><ArrowLeft className="mr-2 h-4 w-4"/> Back to Itineraries</Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Create New Itinerary</CardTitle>
          <CardDescription>Fill in the details for the new travel itinerary.</CardDescription>
        </CardHeader>
        <CardContent>
          <ItineraryForm onSubmitAction={createItinerary} submitButtonText="Create Itinerary" />
        </CardContent>
      </Card>
    </div>
  );
}
