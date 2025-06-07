
'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { getAdminUsersCollection } from '@/lib/mongodb';
import type { AdminUser } from '@/lib/types';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function loginAdmin(formData: FormData, redirectPathOverride?: string): Promise<{ success: boolean; message: string } | void> {
  const values = Object.fromEntries(formData.entries());
  const validation = loginSchema.safeParse(values);

  if (!validation.success) {
    return { success: false, message: validation.error.errors.map(e => e.message).join(', ') };
  }

  const { username, password } = validation.data;

  try {
    const adminUsersCollection = await getAdminUsersCollection();
    const adminUser = await adminUsersCollection.findOne({ username: username.toLowerCase() });

    if (!adminUser) {
      return { success: false, message: 'Invalid username or password.' };
    }

    const isPasswordValid = await bcrypt.compare(password, adminUser.passwordHash);

    if (!isPasswordValid) {
      return { success: false, message: 'Invalid username or password.' };
    }

    // Password is valid, set session cookie
    cookies().set('admin-auth-token', adminUser._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: 'lax',
    });

    const finalRedirectPath = redirectPathOverride || '/admin/dashboard';
    redirect(finalRedirectPath);
    // The redirect function throws an error, so this line won't be reached if successful.

  } catch (error) {
    console.error('Admin login error:', error);
    // Check if it's a redirect error that should be re-thrown
    if (error && typeof (error as any).digest === 'string' && (error as any).digest.includes('NEXT_REDIRECT')) {
      throw error;
    }
    return { success: false, message: 'An unexpected error occurred during login. Please try again.' };
  }
}

export async function logoutAdmin() {
  cookies().delete('admin-auth-token');
  redirect('/admin/login');
}
