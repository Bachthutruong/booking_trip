
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaneTakeoff, PlaneLanding, Waypoints, MessageCircleQuestion, Search, PencilLine } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getItineraries } from "@/actions/itineraryActions"; // Import the action

export default async function Home() { // Make the component async
  const allItineraries = await getItineraries();
  // Display the first 3 itineraries or fewer if not enough data
  const popularItineraries = allItineraries.slice(0, 3);

  return (
    <div className="space-y-12">
      <section className="text-center py-12 bg-gradient-to-br from-primary to-secondary rounded-xl shadow-lg animate-fadeIn">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-headline font-bold text-primary-foreground mb-4">
            Welcome to Hanoi Explorer!
          </h1>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Your one-stop solution for planning and managing unforgettable trips in and around Hanoi.
            Discover curated itineraries, create custom journeys, and explore with confidence.
          </p>
          <div className="space-x-4">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-300 ease-in-out transform hover:scale-105" asChild>
              <Link href="/create-trip">Plan Your Trip Now</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 transition-all duration-300 ease-in-out transform hover:scale-105" asChild>
              <Link href="/#itineraries">View Popular Itineraries</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 animate-slideInUp" style={{animationDelay: '0.2s'}}>
        <h2 className="text-3xl font-headline font-semibold text-center mb-10">Our Services</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="items-center text-center">
              <div className="p-3 bg-primary/10 rounded-full mb-3">
                <PlaneLanding className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="font-headline">Airport Pickups</CardTitle>
              <CardDescription>Seamless transfers from the airport to your destination in Hanoi.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="link" asChild><Link href="/create-trip?type=airport_pickup">Book Pickup</Link></Button>
            </CardContent>
          </Card>
          <Card className="hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="items-center text-center">
              <div className="p-3 bg-primary/10 rounded-full mb-3">
                <PlaneTakeoff className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="font-headline">Airport Dropoffs</CardTitle>
              <CardDescription>Reliable rides from Hanoi to the airport for your departure.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
             <Button variant="link" asChild><Link href="/create-trip?type=airport_dropoff">Book Dropoff</Link></Button>
            </CardContent>
          </Card>
          <Card className="hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="items-center text-center">
              <div className="p-3 bg-primary/10 rounded-full mb-3">
                <Waypoints className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="font-headline">City & Regional Tours</CardTitle>
              <CardDescription>Explore Hanoi's beauty and nearby attractions with our curated tours.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="link" asChild><Link href="/create-trip?type=tourism">Explore Tours</Link></Button>
            </CardContent>
          </Card>
        </div>
      </section>
      
      <section id="itineraries" className="container mx-auto px-4 animate-slideInUp" style={{animationDelay: '0.4s'}}>
         <h2 className="text-3xl font-headline font-semibold text-center mb-10">Popular Itineraries</h2>
         {popularItineraries.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {popularItineraries.map(itinerary => (
                <Card key={itinerary.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
                    <Image 
                        src={itinerary.imageUrl || "https://placehold.co/600x400.png"} 
                        alt={itinerary.name} 
                        width={600} 
                        height={400} 
                        className="w-full h-48 object-cover" 
                        // For data-ai-hint, you might use itinerary type or keywords from its name/description
                        data-ai-hint={`${itinerary.type} ${itinerary.name.split(" ")[0] || 'travel'}`}
                    />
                    <CardHeader>
                    <CardTitle className="font-headline">{itinerary.name}</CardTitle>
                    <CardDescription className="line-clamp-3">{itinerary.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                        {/* Link to the specific itinerary if you have a dedicated page, or to create-trip pre-filled */}
                        <Link href={`/create-trip?itineraryId=${itinerary.id}`}>View Details & Book</Link>
                    </Button>
                    </CardContent>
                </Card>
                ))}
            </div>
         ) : (
            <p className="text-center text-muted-foreground">No popular itineraries to display at the moment. Check back soon!</p>
         )}
         <div className="text-center mt-8">
            <Button variant="outline" asChild>
                <Link href="/create-trip">See All Itineraries</Link>
            </Button>
         </div>
      </section>

      <section className="container mx-auto px-4 py-10 bg-card rounded-xl shadow-md animate-slideInUp" style={{animationDelay: '0.6s'}}>
        <h2 className="text-3xl font-headline font-semibold text-center mb-8">Need Help or Info?</h2>
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-accent/20 rounded-full">
                <MessageCircleQuestion className="h-8 w-8 text-accent-foreground" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">Virtual Assistant</h3>
            <p className="text-muted-foreground mb-3">Ask our AI chatbot for quick answers about traveling in Hanoi.</p>
            <Button variant="ghost" className="text-primary hover:text-primary/80" asChild><Link href="/chatbot">Ask Now</Link></Button>
          </div>
          <div>
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-accent/20 rounded-full">
                <Search className="h-8 w-8 text-accent-foreground" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">Manage Your Trips</h3>
            <p className="text-muted-foreground mb-3">View your bookings, upload payment proofs, and more.</p>
            <Button variant="ghost" className="text-primary hover:text-primary/80" asChild><Link href="/my-trips">My Trips</Link></Button>
          </div>
          <div>
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-accent/20 rounded-full">
                <PencilLine className="h-8 w-8 text-accent-foreground" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">Share Feedback</h3>
            <p className="text-muted-foreground mb-3">Help us improve by sharing your experience.</p>
            <Button variant="ghost" className="text-primary hover:text-primary/80" asChild><Link href="/feedback">Give Feedback</Link></Button>
          </div>
        </div>
      </section>
    </div>
  );
}

    