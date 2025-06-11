import { NextRequest, NextResponse } from 'next/server';
import { getAdminUsersCollection } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  const usersCollection = await getAdminUsersCollection();
  const users = await usersCollection.find({}).toArray();
  const res = NextResponse.json({ users });
  res.headers.set('Cache-Control', 'public, max-age=60');
  return res;
} 