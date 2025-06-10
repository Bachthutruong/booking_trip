import { NextResponse } from 'next/server';
import { getTripsCollection } from '@/lib/mongodb';
import { verifyAdminToken } from '@/actions/adminAuthActions';

export async function POST(req: Request) {
  const formData = await req.formData();
  const tripId = formData.get('tripId') as string;
  const participantId = formData.get('participantId') as string;
  const user = await verifyAdminToken();
  if (!user.isAuthenticated || user.role !== 'admin') {
    return NextResponse.json({ success: false, message: '未授權' }, { status: 403 });
  }
  const tripsCollection = await getTripsCollection();
  // revert trạng thái participant
  const result = await tripsCollection.updateOne(
    { id: tripId, 'participants.id': participantId },
    { $set: { 'participants.$.status': 'pending_payment' } }
  );
  if (result.modifiedCount > 0) {
    return NextResponse.redirect(`/admin/trips/${tripId}`);
  }
  return NextResponse.json({ success: false, message: '無法恢復付款狀態' }, { status: 400 });
} 