import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getAdminUsersCollection } from '@/lib/mongodb';
import type { AdminUser } from '@/lib/types';
import { ObjectId } from 'mongodb';

const userSchema = z.object({
  username: z.string().min(1, '用戶名稱是必填的').toLowerCase(),
  password: z.string().min(6, '密碼必須至少6個字符'),
  role: z.enum(['admin', 'staff']),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const validation = userSchema.safeParse(json);
    if (!validation.success) {
      const res = NextResponse.json({ success: false, message: validation.error.errors.map(e => e.message).join(', ') }, { status: 400 });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }
    const { username, password, role } = validation.data;
    const adminUsersCollection = await getAdminUsersCollection();
    // Check if username already exists
    const existingUser = await adminUsersCollection.findOne({ username });
    if (existingUser) {
      const res = NextResponse.json({ success: false, message: '用戶名稱已存在' }, { status: 409 });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }
    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);
    const newObjectId = new ObjectId();
    const newUser: AdminUser = {
      _id: newObjectId,
      id: newObjectId.toString(),
      username,
      passwordHash,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await adminUsersCollection.insertOne(newUser as any);
    if (result.acknowledged) {
      const res = NextResponse.json({ success: true, message: '用戶帳號已成功創建' });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    } else {
      const res = NextResponse.json({ success: false, message: '無法創建用戶帳號' }, { status: 500 });
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }
  } catch (error) {
    console.error('API Admin user creation error:', error);
    const res = NextResponse.json({ success: false, message: '在創建用戶時發生意外錯誤' }, { status: 500 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
} 