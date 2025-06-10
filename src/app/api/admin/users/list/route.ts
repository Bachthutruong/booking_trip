import { NextResponse } from 'next/server';
import { getAdminUsersCollection } from '@/lib/mongodb';

export async function GET() {
  const usersCollection = await getAdminUsersCollection();
  const users = await usersCollection.find({}).toArray();
  return NextResponse.json({ users });
} 