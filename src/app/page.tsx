export const runtime = 'nodejs';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaneTakeoff, PlaneLanding, Waypoints, MessageCircleQuestion, Search, PencilLine, MapPinned } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getItineraries } from "@/actions/itineraryActions"; // Import the action
import JoinableTripsList from '@/components/trip/JoinableTripsList';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default async function Home() { // Make the component async
  const allItineraries = await getItineraries(3); // Chỉ lấy top 3
  // Display the first 3 itineraries or fewer if not enough data
  const popularItineraries = allItineraries;

  return (
    <div className="space-y-12">
      <section className="text-center py-12 bg-gradient-to-br from-primary to-secondary rounded-xl shadow-lg animate-fadeIn">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-headline font-bold text-primary-foreground mb-4">
            歡迎來到中華衛星共乘平台
          </h1>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            輕鬆建立或加入共乘行程，分擔車資更省錢！
            中華衛星共乘平台提供安全、舒適又高彈性的計程車共乘服務。
          </p>
          <div className="space-x-4">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-300 ease-in-out transform hover:scale-105" asChild>
              <Link href="/create-trip">發起共乘</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground text-black hover:bg-primary-foreground/10 transition-all duration-300 ease-in-out transform hover:scale-105" asChild>
              <Link href="/#itineraries">搜尋共乘</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto py-8">
        <div className="text-center mb-10">
          <MapPinned className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold font-headline">加入現有旅程</h1>
          <p className="text-lg text-muted-foreground mt-2">找到已確認的旅程並加入！</p>
        </div>
        <Suspense fallback={<JoinableTripsSkeleton />}>
          <JoinableTripsList />
        </Suspense>
      </section>
    </div>
  );
}

function JoinableTripsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="relative max-w-lg mx-auto">
        <div className="h-12 w-full max-w-lg mx-auto bg-muted rounded animate-pulse" />
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="border bg-card text-card-foreground shadow-sm rounded-xl p-0 overflow-hidden">
      <div className="h-40 w-full bg-muted animate-pulse" />
      <div className="p-6 space-y-3">
        <div className="h-6 w-3/4 bg-muted rounded animate-pulse" />
        <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
        <div className="h-4 w-full bg-muted rounded animate-pulse" />
        <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
      </div>
      <div className="p-6 pt-0">
        <div className="h-10 w-full bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
}

