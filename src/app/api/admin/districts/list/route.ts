import { NextRequest, NextResponse } from 'next/server';
import { getDistrictSurchargesCollection } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
  const collection = await getDistrictSurchargesCollection();
  const total = await collection.countDocuments();
  const districts = await collection.find({})
    .sort({ districtName: 1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .toArray();
  const res = NextResponse.json({
    districts: districts.map(d => ({ ...d, id: d._id.toString() })),
    total,
    page,
    pageSize,
  });
  res.headers.set('Cache-Control', 'public, max-age=60');
  return res;
} 