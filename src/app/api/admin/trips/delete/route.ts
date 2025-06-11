import { NextResponse } from 'next/server';
import { deleteTrip } from '@/actions/tripActions';
import { verifyAdminToken } from '@/actions/adminAuthActions';

export async function POST(req: Request) {
  const { tripId } = await req.json();
  const user = await verifyAdminToken();
  if (!user.isAuthenticated || !user.role) {
    const res = NextResponse.json({ success: false, message: '未授權或缺少角色' }, { status: 401 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
  const result = await deleteTrip(tripId, { id: user.userId!, username: user.username!, role: user.role });
  const res = NextResponse.json(result);
  res.headers.set('Cache-Control', 'no-store');
  return res;
} 