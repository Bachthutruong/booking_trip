import { NextRequest, NextResponse } from 'next/server';
import { getTripComments, addTripComment } from '@/actions/tripActions';
import { verifyAdminToken } from '@/actions/adminAuthActions';

export async function GET(req: NextRequest, { params }: { params: { tripId: string } }) {
  const { tripId } = params;
  const comments = await getTripComments(tripId);
  return NextResponse.json(comments);
}

export async function POST(req: NextRequest, { params }: { params: { tripId: string } }) {
  const { tripId } = params;
  const user = await verifyAdminToken();
  if (!user.isAuthenticated || !user.username) {
    return NextResponse.json({ success: false, message: '未认证' }, { status: 401 });
  }
  const { comment } = await req.json();
  const result = await addTripComment(tripId, comment, user.username);
  return NextResponse.json(result);
} 