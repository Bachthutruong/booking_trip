import { getTripById, confirmMainBookerPayment, confirmParticipantPayment } from '@/actions/tripActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, CardSection } from '@/components/ui/card-ext'; // Using extended Card for sections
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, Clock, Users, MapPin, Phone, Mail, FileText, CreditCard, CheckCircle, DollarSign, Image as ImageIcon, UserCircle, RotateCcw } from 'lucide-react';
import { ITINERARY_TYPES, TRIP_STATUSES } from '@/lib/constants';
import { format } from 'date-fns';
import NextImage from 'next/image'; // Using NextImage for optimization
import { cn } from '@/lib/utils';
import { getAdditionalServicesByIds } from '@/actions/configActions'; // Import the new function
import ImagePreviewDialog from '@/components/common/ImagePreviewDialog';
import PaymentProofPreviewButton from '@/components/admin/PaymentProofPreviewButton'; // New import
import { ConfirmPaymentButton as ClientConfirmPaymentButton } from '@/components/admin/ConfirmPaymentButton'; // Import the client component
import { RevertPaymentButton } from '@/components/admin/RevertPaymentButton'; // Import the new revert button
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'; // New import
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'; // New import
import { verifyAdminToken } from '@/actions/adminAuthActions';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import CommentSection from './CommentSection';
import SpamReportButton from '@/components/admin/SpamReportButton';
import { getSpamReportsCollection } from '@/lib/mongodb';

// Cosmetic change to trigger TypeScript re-evaluation
const WandIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-3.54 3.54a2 2 0 0 1-2.83-2.83l.35-.35" /><path d="M14.73 2.39 5.86 11.26" />
  </svg>
);

export default async function AdminTripDetailPage({ params }: { params: { tripId: string } }) {
  const user = await verifyAdminToken();
  const trip = await getTripById(params.tripId);
  const spamReportsCollection = await getSpamReportsCollection();

  // Only get spam reports for this specific trip
  const spamReports = await spamReportsCollection.find({
    tripId: params.tripId
  }).toArray();

  // Create a set of reported user phones for this trip only
  const reportedUserPhones = new Set(spamReports.map(report => report.reportedUserPhone));

  if (!trip) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto text-center py-10">
        <p className="text-destructive text-lg">未找到行程。</p>
        <Button variant="outline" asChild>
          <Link href="/admin/trips"><ArrowLeft className="mr-2 h-4 w-4" /> 返回行程列表</Link>
        </Button>
      </div>
    );
  }

  // Filter out participants reported in this specific trip
  const filteredParticipants = trip.participants.filter(p => !reportedUserPhones.has(p.phone));

  const totalGuests = filteredParticipants.reduce((sum, p) => sum + p.numberOfPeople, 0);
  const selectedAdditionalServices = trip.additionalServiceIds && trip.additionalServiceIds.length > 0
    ? await getAdditionalServicesByIds(trip.additionalServiceIds)
    : [];

  // Tính trạng thái tổng (overallStatus) cho chi tiết
  let overallStatus = 'pending_payment';
  if (filteredParticipants.length > 0) {
    if (filteredParticipants.every((p: any) => p.status === 'payment_confirmed' || p.status === 'completed')) {
      const tripDate = new Date(trip.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (tripDate < today) {
        overallStatus = 'completed';
      } else {
        overallStatus = 'payment_confirmed';
      }
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Button variant="outline" asChild className="mb-4">
        <Link href="/admin/trips"><ArrowLeft className="mr-2 h-4 w-4" /> 返回行程列表</Link>
      </Button>

      {/* Show deleted badge if trip is deleted */}
      {trip.isDeleted && (
        <div className="mb-2">
          <Badge variant="destructive" className="text-lg px-4 py-2">已被删除</Badge>
        </div>
      )}

      {/* Bình luận section for staff handover/notes */}
      <CommentSection tripId={trip.id} initialComment={trip.handoverComment} isDeleted={trip.isDeleted} />

      <Card className="shadow-xl">
        <CardHeader className="border-b">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center">
            <div>
              <CardTitle className="font-headline text-2xl md:text-3xl">{trip.itineraryName}</CardTitle>
              <CardDescription className="text-base">
                行程編號: {trip.id} &bull; {ITINERARY_TYPES[trip.itineraryType]}
                <p className="text-xs text-muted-foreground">行程建立時間: {format(new Date(trip.createdAt), "yyyy年MM月dd日 HH:mm")}</p>

              </CardDescription>
            </div>
            <Badge
              variant={overallStatus === 'payment_confirmed' ? 'default' : overallStatus === 'pending_payment' ? 'outline' : 'secondary'}
              className={`mt-2 sm:mt-0 text-lg px-4 py-2 ${overallStatus === 'payment_confirmed' ? 'bg-green-500 text-white' : overallStatus === 'pending_payment' ? 'border-yellow-500 text-yellow-600' : ''}`}
            >
              {overallStatus === 'payment_confirmed' ? '已付款' : overallStatus === 'pending_payment' ? '待付款' : '已完成'}
            </Badge>
          </div>
        </CardHeader>

        <CardSection title="行程明細" icon={<CalendarDays />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <p><strong className="font-medium text-muted-foreground">日期:</strong> {format(new Date(trip.date), "yyyy年MM月dd日")}</p>
            <p><strong className="font-medium text-muted-foreground">時間:</strong> {trip.time}</p>
            <p><strong className="font-medium text-muted-foreground">總人數:</strong> {totalGuests}</p>
            <p><strong className="font-medium text-muted-foreground">已付款總額:</strong> {filteredParticipants
              .filter(p => p.status === 'payment_confirmed')
              .reduce((sum, p) => sum + p.pricePaid, 0)
              .toLocaleString()} 元</p>
            {/* {trip.pickupAddress && <p className="md:col-span-2"><strong className="font-medium text-muted-foreground">接送地址:</strong> {trip.pickupAddress}</p>} */}
            {/* {trip.dropoffAddress && <p className="md:col-span-2"><strong className="font-medium text-muted-foreground">送达地址:</strong> {trip.dropoffAddress}</p>} */}
            {/* {trip.district && <p><strong className="font-medium text-muted-foreground">区域:</strong> {trip.district}</p>} */}
            {/* {trip.discountCode && <p><strong className="font-medium text-muted-foreground">优惠码:</strong> <Badge variant="secondary">{trip.discountCode}</Badge></p>} */}
          </div>
        </CardSection>

        <CardSection title="联系人信息" icon={<UserCircle />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <p><strong className="font-medium text-muted-foreground">预订人:</strong> {trip.contactName}</p>
            <p><strong className="font-medium text-muted-foreground">電話:</strong> {trip.contactPhone}</p>
            {trip.secondaryContact && <p><strong className="font-medium text-muted-foreground">备用联系人:</strong> {trip.secondaryContact}</p>}
          </div>
          {trip.notes && <p className="mt-2 text-sm italic"><strong className="font-medium text-muted-foreground not-italic"> 客人備註:</strong> {trip.notes}</p>}
        </CardSection>

        {trip.additionalServiceIds && trip.additionalServiceIds.length > 0 && (
          <CardSection title="附加服务" icon={<WandIcon />}>
            <ul className="list-disc list-inside text-sm">
              {selectedAdditionalServices.map(service => (
                <li key={service.id}>{service.name} (+{service.price.toLocaleString()} 元)</li>
              ))}
            </ul>
          </CardSection>
        )}

        {filteredParticipants.length > 0 && (
          <CardSection title="參與者明顯資料" icon={<Users />}>
            <div className="space-y-6">
              {filteredParticipants.map(p => (
                <div key={p.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex flex-col flex-grow min-w-0">
                      <strong className="font-medium text-lg">{p.name}</strong> ({p.numberOfPeople} 人)
                      <p className="text-sm text-muted-foreground">電話: {p.phone} | 地址: {p.address}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge
                        variant={p.status === 'payment_confirmed' ? 'default' : 'outline'}
                        className={cn("capitalize px-2 py-1 text-xs",
                          p.status === 'payment_confirmed' ? 'bg-green-500 text-white' : 'border-yellow-500 text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:border-yellow-600 dark:bg-yellow-900/30')}
                      >
                        {TRIP_STATUSES[p.status]} ({p.pricePaid.toLocaleString()} 元)
                      </Badge>
                      {p.status === 'pending_payment' && p.transferProofImageUrl && (
                        <PaymentProofPreviewButton imageUrl={p.transferProofImageUrl} />
                      )}
                      {p.status === 'pending_payment' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            {user.role === 'admin' && (
                              <Button variant="default" size="sm" className="bg-green-500 text-white hover:bg-green-600">
                                <CheckCircle className="mr-2 h-4 w-4" /> 確認已付款
                              </Button>
                            )}
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>確認 {p.name} 的付款？</AlertDialogTitle>
                              <AlertDialogDescription>
                                此動作將把付款狀態更改為已確認付款，此操作無法返回，請再次確認
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction asChild>
                                <ClientConfirmPaymentButton tripId={trip.id} participantId={p.id} isMainBooker={false} />
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      {p.status === 'payment_confirmed' && user.role === 'admin' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="bg-yellow-500 text-white hover:bg-yellow-600 border-yellow-600">
                              <RotateCcw className="mr-2 h-4 w-4" /> 恢復待付款
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>恢復 {p.name} 的付款狀態？</AlertDialogTitle>
                              <AlertDialogDescription>
                                此動作將把付款狀態從已確認改為待付款，此操作無法返回，請再次確認
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction asChild>
                                <RevertPaymentButton tripId={trip.id} participantId={p.id} />
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      {user.role === 'admin' && (
                        <SpamReportButton
                          participant={p}
                          tripId={trip.id}
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm border-t pt-3">
                    {p.email && <p><strong className="font-medium text-muted-foreground">邮箱:</strong> {p.email}</p>}
                    {p.dob && <p><strong className="font-medium text-muted-foreground">出生日期:</strong> {format(new Date(p.dob), "yyyy年MM月dd日")}</p>}
                    {p.identityNumber && <p><strong className="font-medium text-muted-foreground">证件号:</strong> {p.identityNumber}</p>}
                    {p.discountCode && p.discountCode.code && (
                      <p><strong className="font-medium text-muted-foreground">优惠码:</strong> <Badge variant="secondary">{p.discountCode.code} ({p.discountCode.type === 'percentage' ? `${p.discountCode.value}%` : `${p.discountCode.value.toLocaleString()} 元`})</Badge></p>
                    )}
                    {p.additionalServices && p.additionalServices.length > 0 && (
                      <div className="md:col-span-2">
                        <strong className="font-medium text-muted-foreground">加購服務:</strong>
                        <ul className="list-disc list-inside ml-4">
                          {p.additionalServices.map(service => (
                            <li key={service.id}>{service.name} (+{service.price.toLocaleString()} 元)</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {p.notes && <p className="md:col-span-2"><strong className="font-medium text-muted-foreground"> 客人備註:</strong> {p.notes}</p>}
                  </div>

                  {p.status === 'payment_confirmed' && (p.confirmedBy || p.confirmedAt) && (
                    <div className="flex flex-col text-xs text-green-700 dark:text-green-400 border-t pt-2">
                      {p.confirmedBy && <span> 點擊確認人: <span className="font-semibold">{p.confirmedBy}</span></span>}
                      {p.confirmedAt && <span> 點擊確認時間: {format(new Date(p.confirmedAt), "yyyy年MM月dd日 HH:mm")}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardSection>
        )}

        {/* Consolidated Payment Proof Section */}
        {/* This section is removed as individual participant proof is now handled */}

        {/* <CardFooter className="border-t pt-6"> */}
        {/* Add other actions like "Cancel Trip" or "Edit Trip" for admin if needed */}
        {/* </CardFooter> */}
      </Card>
    </div>
  );
}
