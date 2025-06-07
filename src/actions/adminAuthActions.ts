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
  throw new Error('JWT_SECRET is not defined in environment variables.');
}

export async function logoutAdmin() {
  (await cookies()).delete('admin-auth-token');
  redirect('/admin/login');
}

// New server action to verify admin token
export async function verifyAdminToken(): Promise<{ isAuthenticated: boolean; userId?: string }> {
  const adminAuthCookie = (await cookies()).get('admin-auth-token');
  const token = adminAuthCookie?.value;

  if (!token) {
    return { isAuthenticated: false };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as jwt.JwtPayload;
    const adminUserId = decoded.userId;

    if (typeof adminUserId !== 'string' || !ObjectId.isValid(adminUserId)) {
      console.error('Invalid or missing userId in JWT token:', adminUserId);
      return { isAuthenticated: false };
    }

    const adminUsersCollection = await getAdminUsersCollection();
    const adminUser = await adminUsersCollection.findOne({ _id: new ObjectId(adminUserId) });

    if (adminUser) {
      return { isAuthenticated: true, userId: adminUserId };
    } else {
      console.log('Admin User not found in DB for token userId:', adminUserId);
      return { isAuthenticated: false };
    }
  } catch (error) {
    console.error('JWT Verification Error:', error);
    // Token is invalid or expired
    return { isAuthenticated: false };
  }
}
