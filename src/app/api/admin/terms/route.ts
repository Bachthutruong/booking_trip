import { NextRequest, NextResponse } from 'next/server';
import { getTermsContentCollection } from '@/lib/mongodb';

const TERMS_KEY = 'booking_terms';

export async function GET() {
  const collection = await getTermsContentCollection();
  const doc = await collection.findOne({ key: TERMS_KEY });
  const res = NextResponse.json({ content: doc?.content || '' });
  res.headers.set('Cache-Control', 'public, max-age=300');
  return res;
}

export async function POST(req: NextRequest) {
  const { content } = await req.json();
  const collection = await getTermsContentCollection();
  await collection.updateOne(
    { key: TERMS_KEY },
    { $set: { content, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );
  return NextResponse.json({ success: true });
} 