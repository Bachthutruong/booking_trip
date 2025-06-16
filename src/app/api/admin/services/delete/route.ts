import { NextResponse } from 'next/server';
import { deleteAdditionalService } from '@/actions/additionalServiceActions';

export async function POST(req: Request) {
  const { serviceId } = await req.json();
  if (!serviceId) {
    return NextResponse.json({ success: false, message: '缺少 serviceId' }, { status: 400 });
  }
  const result = await deleteAdditionalService(serviceId);
  return NextResponse.json(result);
} 