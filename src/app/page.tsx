export const runtime = 'nodejs';

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
            歡迎來到河內探索者！
          </h1>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            您在河內及周邊地區規劃和管理難忘旅程的一站式解決方案。探索精選行程，創建自訂旅程，安心探索。
          </p>
          <div className="space-x-4">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-300 ease-in-out transform hover:scale-105" asChild>
              <Link href="/create-trip">立即規劃您的旅程</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground text-black hover:bg-primary-foreground/10 transition-all duration-300 ease-in-out transform hover:scale-105" asChild>
              <Link href="/#itineraries">查看熱門行程</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 animate-slideInUp" style={{ animationDelay: '0.2s' }}>
        <h2 className="text-3xl font-headline font-semibold text-center mb-10">我們的服務</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="items-center text-center">
              <div className="p-3 bg-primary/10 rounded-full mb-3">
                <PlaneLanding className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="font-headline">機場接機</CardTitle>
              <CardDescription>從機場到您在河內的目的地無縫接送。</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="link" asChild><Link href="/create-trip?type=airport_pickup">預訂接機</Link></Button>
            </CardContent>
          </Card>
          <Card className="hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="items-center text-center">
              <div className="p-3 bg-primary/10 rounded-full mb-3">
                <PlaneTakeoff className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="font-headline">機場送機</CardTitle>
              <CardDescription>從河內到機場的可靠接送服務。</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="link" asChild><Link href="/create-trip?type=airport_dropoff">預訂送機</Link></Button>
            </CardContent>
          </Card>
          <Card className="hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="items-center text-center">
              <div className="p-3 bg-primary/10 rounded-full mb-3">
                <Waypoints className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="font-headline">城市及區域旅遊</CardTitle>
              <CardDescription>透過我們精選的行程探索河內之美及周邊景點。</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="link" asChild><Link href="/create-trip?type=tourism">探索旅遊行程</Link></Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="itineraries" className="container mx-auto px-4 animate-slideInUp" style={{ animationDelay: '0.4s' }}>
        <h2 className="text-3xl font-headline font-semibold text-center mb-10">熱門行程</h2>
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
                    <Link href={`/create-trip?itineraryId=${itinerary.id}`}>查看詳情並預訂</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">目前沒有熱門行程可供顯示。請稍後再查看！</p>
        )}
        <div className="text-center mt-8">
          <Button variant="outline" asChild>
            <Link href="/create-trip">查看所有行程</Link>
          </Button>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 bg-card rounded-xl shadow-md animate-slideInUp" style={{ animationDelay: '0.6s' }}>
        <h2 className="text-3xl font-headline font-semibold text-center mb-8">需要幫助或資訊？</h2>
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-accent/20 rounded-full">
                <MessageCircleQuestion className="h-8 w-8 text-accent-foreground" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">虛擬助理</h3>
            <p className="text-muted-foreground mb-3">向我們的AI聊天機器人詢問有關河內旅遊的快速答案。</p>
            <Button variant="ghost" className="text-primary hover:text-primary/80" asChild><Link href="/chatbot">立即詢問</Link></Button>
          </div>
          <div>
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-accent/20 rounded-full">
                <Search className="h-8 w-8 text-accent-foreground" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">管理您的旅程</h3>
            <p className="text-muted-foreground mb-3">查看您的預訂，上傳付款憑證等。</p>
            <Button variant="ghost" className="text-primary hover:text-primary/80" asChild><Link href="/my-trips">我的旅程</Link></Button>
          </div>
          <div>
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-accent/20 rounded-full">
                <PencilLine className="h-8 w-8 text-accent-foreground" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">分享回饋</h3>
            <p className="text-muted-foreground mb-3">分享您的體驗，幫助我們改進。</p>
            <Button variant="ghost" className="text-primary hover:text-primary/80" asChild><Link href="/feedback">給予回饋</Link></Button>
          </div>
        </div>
      </section>
    </div>
  );
}

