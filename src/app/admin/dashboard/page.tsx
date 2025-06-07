
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getItineraries } from "@/actions/itineraryActions";
import { getTripsCollection } from "@/lib/mongodb"; // For counts
import { getFeedbackCollection } from "@/lib/mongodb";
import { ListOrdered, MapIcon, MessageSquare } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const itineraries = await getItineraries();
  const tripsCollection = await getTripsCollection();
  const feedbackCollection = await getFeedbackCollection();

  const totalTrips = await tripsCollection.countDocuments();
  const totalFeedback = await feedbackCollection.countDocuments();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Itineraries</CardTitle>
            <ListOrdered className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{itineraries.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently available travel plans
            </p>
            <Link href="/admin/itineraries" className="text-sm text-primary hover:underline mt-2 block">Manage Itineraries</Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trips Booked</CardTitle>
            <MapIcon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTrips}</div>
            <p className="text-xs text-muted-foreground">
              Across all statuses
            </p>
            {/* <Link href="/admin/trips" className="text-sm text-primary hover:underline mt-2 block">View Trips</Link> */}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFeedback}</div>
            <p className="text-xs text-muted-foreground">
              User submitted comments
            </p>
            {/* <Link href="/admin/feedback" className="text-sm text-primary hover:underline mt-2 block">View Feedback</Link> */}
          </CardContent>
        </Card>
      </div>

      {/* More dashboard elements can be added here, e.g., recent trips, pending actions etc. */}
    </div>
  );
}
