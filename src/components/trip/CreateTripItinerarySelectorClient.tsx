"use client";
import useSWR from "swr";
import CreateTripItinerarySelector from "./CreateTripItinerarySelector";
import { Skeleton } from "@/components/ui/skeleton";
import type { Itinerary } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function CreateTripItinerarySelectorClient() {
  const { data, error, isLoading } = useSWR<{ itineraries: Itinerary[] }>(
    "/api/admin/itineraries/list",
    fetcher,
    { refreshInterval: 30000 } // refresh every 30s
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-lg p-4 space-y-4">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive text-center py-8">無法加載行程，請稍後再試。</div>;
  }

  return <CreateTripItinerarySelector itineraries={data?.itineraries || []} />;
} 