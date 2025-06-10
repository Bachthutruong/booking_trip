'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import { getAdminUsersCollection } from '@/lib/mongodb';
import type { AdminUser } from '@/lib/types';
import { ObjectId } from 'mongodb';

// Ensure JWT_SECRET is available
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('未在环境变量中定义JWT_SECRET');
}

export async function logoutAdmin() {
  (await cookies()).delete('admin-auth-token');
  redirect('/admin/login');
}

// New server action to verify admin token
export async function verifyAdminToken(): Promise<{
  isAuthenticated: boolean;
  userId?: string;
  username?: string;
  role?: 'admin' | 'staff';
}> {
  const adminAuthCookie = (await cookies()).get('admin-auth-token');
  const token = adminAuthCookie?.value;

  if (!token) {
    return { isAuthenticated: false };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as jwt.JwtPayload;
    const adminUserId = decoded.userId;

    if (typeof adminUserId !== 'string' || !ObjectId.isValid(adminUserId)) {
      console.error('JWT令牌中缺少或无效的userId:', adminUserId);
      return { isAuthenticated: false };
    }

    const adminUsersCollection = await getAdminUsersCollection();
    const adminUser = await adminUsersCollection.findOne({ _id: new ObjectId(adminUserId) });

    if (adminUser) {
      return { isAuthenticated: true, userId: adminUserId, username: adminUser.username, role: adminUser.role };
    } else {
      console.log('未在数据库中找到管理员用户，用于token userId:', adminUserId);
      return { isAuthenticated: false };
    }
  } catch (error) {
    console.error('JWT验证错误:', error);
    // Token is invalid or expired
    return { isAuthenticated: false };
  }
}
