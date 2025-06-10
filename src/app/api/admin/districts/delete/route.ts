import { NextResponse } from 'next/server';
import { deleteDistrictSurcharge } from '@/actions/districtActions';

export async function POST(req: Request) {
  const { districtId } = await req.json();
  if (!districtId) {
    return NextResponse.json({ success: false, message: '缺少 districtId' }, { status: 400 });
  }
  const result = await deleteDistrictSurcharge(districtId);
  return NextResponse.json(result);
} 