import { NextResponse } from 'next/server';
import { deleteTrip } from '@/actions/tripActions';
import { verifyAdminToken } from '@/actions/adminAuthActions';

export async function POST(req: Request) {
  const { tripId } = await req.json();
  const user = await verifyAdminToken();
  if (!user.isAuthenticated || !user.role) {
    return NextResponse.json({ success: false, message: '未授權或缺少角色' }, { status: 401 });
  }
  const result = await deleteTrip(tripId, { id: user.userId!, username: user.username!, role: user.role });
  return NextResponse.json(result);
} 