import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/actions/adminAuthActions';

export async function GET(req: NextRequest) {
  const user = await verifyAdminToken();
  if (!user.isAuthenticated || !user.username) {
    return NextResponse.json({ success: false, message: '未认证' }, { status: 401 });
  }
  return NextResponse.json({ username: user.username });
} 