import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getItineraries } from "@/actions/itineraryActions";
import { getTripsCollection, getFeedbackCollection, getDiscountCodesCollection, getAdditionalServicesCollection, getDistrictSurchargesCollection } from "@/lib/mongodb";
import { ListOrdered, MapIcon, MessageSquare, Percent, Palette, Wand2, History } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardPage() {
  const itineraries = await getItineraries();
  const tripsCollection = await getTripsCollection();
  const feedbackCollection = await getFeedbackCollection();
  const discountCodesCol = await getDiscountCodesCollection();
  const additionalServicesCol = await getAdditionalServicesCollection();
  const districtSurchargesCol = await getDistrictSurchargesCollection();

  const totalTrips = await tripsCollection.countDocuments();
  const pendingPaymentTrips = await tripsCollection.countDocuments({ status: 'pending_payment' });
  const confirmedTrips = await tripsCollection.countDocuments({ status: 'payment_confirmed' });
  const totalFeedback = await feedbackCollection.countDocuments();
  const totalDiscounts = await discountCodesCol.countDocuments({ isActive: true });
  const totalServices = await additionalServicesCol.countDocuments();
  const totalDistricts = await districtSurchargesCol.countDocuments();

  // --- NEW LOGIC FOR PARTICIPANT COUNTS (MATCHES UI LOGIC) ---
  const allTrips = await tripsCollection.find({ isDeleted: { $ne: true } }).toArray();
  let pendingProofCount = 0;
  let notPaidCount = 0;
  for (const trip of allTrips) {
    if (!Array.isArray(trip.participants)) continue;
    for (const p of trip.participants) {
      if (p.status === 'pending_payment') {
        if (p.transferProofImageUrl && p.transferProofImageUrl.trim() !== '') {
          pendingProofCount++;
        } else {
          notPaidCount++;
        }
      }
    }
  }

  const summaryCards = [

    { title: "現有共行程", value: itineraries.length, icon: ListOrdered, link: "/admin/itineraries", description: "管理員建立的行程" },
    { title: "客人建立的共乘", value: totalTrips, icon: History, link: "/admin/trips", description: "所有狀態" },
    { title: "已轉帳(待確認)", value: pendingProofCount, icon: HourglassIcon, link: "/admin/trips/pending-proof", description: "已上传转账凭证，待确认", color: "text-blue-600" },
    { title: "未付款", value: notPaidCount, icon: HourglassIcon, link: "/admin/trips/not-paid", description: "尚未上传转账凭证", color: "text-red-600" },
    // { title: "Active Discounts", value: totalDiscounts, icon: Percent, link: "/admin/discounts", description: "可用促销代码" },
    // { title: "附加服务", value: totalServices, icon: Wand2, link: "/admin/services", description: "可选的行程附加服务" },
    // { title: "区域附加费用", value: totalDistricts, icon: Palette, link: "/admin/districts", description: "附加费用区域" },
    // { title: "总反馈", value: totalFeedback, icon: MessageSquare, link: "/admin/feedback", description: "用户提交的评论" },
  ];

  return (
    <div className="space-y-6">
      {/* <h1 className="text-3xl font-bold font-headline">管理员仪表板</h1> */}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {summaryCards.map(card => (
          <Card key={card.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-5 w-5 text-muted-foreground ${card.color || ''}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.color || ''}`}>{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
              {card.link && (
                <Button variant="link" asChild className="px-0 pt-2 h-auto text-sm">
                  <Link href={card.link}> 管理</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Placeholder for recent activity or pending actions */}
      {/* <Card>
        <CardHeader>
          <CardTitle>快速操作</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <Button asChild variant="outline"><Link href="/admin/itineraries/new">新行程</Link></Button>
          <Button asChild variant="outline"><Link href="/admin/discounts/new">新折扣</Link></Button>
          <Button asChild variant="outline"><Link href="/admin/services/new">新服务</Link></Button>
          <Button asChild variant="outline"><Link href="/admin/districts/new">新区域附加费用</Link></Button>
        </CardContent>
      </Card> */}
    </div>
  );
}


// Simple icon components to avoid lucide direct use here if needed
const HourglassIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 22h14" />
    <path d="M5 2h14" />
    <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
    <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
  </svg>
);

const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
