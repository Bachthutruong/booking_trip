import { NextResponse } from 'next/server';
import { getAdminUsersCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

export async function POST(req: Request, { params }: { params: { userId: string } }) {
  const { userId } = params;
  const { role, password } = await req.json();
  const usersCollection = await getAdminUsersCollection();
  const update: any = { role };
  if (password && password.length >= 6) {
    update.passwordHash = await bcrypt.hash(password, 10);
  }
  const result = await usersCollection.updateOne(
    { id: userId },
    { $set: update }
  );
  if (result.modifiedCount > 0) {
    const res = NextResponse.json({ success: true });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
  const res = NextResponse.json({ success: false, message: '無法更新用戶' });
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

export async function DELETE(req: Request, { params }: { params: { userId: string } }) {
  const { userId } = params;
  const usersCollection = await getAdminUsersCollection();
  const result = await usersCollection.deleteOne({ id: userId });
  if (result.deletedCount > 0) {
    const res = NextResponse.json({ success: true });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
  const res = NextResponse.json({ success: false, message: '無法刪除用戶' });
  res.headers.set('Cache-Control', 'no-store');
  return res;
} 