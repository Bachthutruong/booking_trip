
'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// For a real app, use a secure random string for the session token value.
// Store this in your .env file and ensure it's not committed to your repository.
// For this example, we'll simulate it.
const ADMIN_SESSION_TOKEN_SECRET_VALUE = process.env.ADMIN_USERNAME + process.env.ADMIN_PASSWORD; // Simplistic, replace with secure token

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function loginAdmin(formData: FormData, redirectPathOverride?: string): Promise<{ success: boolean; message: string }> {
  const values = Object.fromEntries(formData.entries());
  const validation = loginSchema.safeParse(values);

  if (!validation.success) {
    return { success: false, message: validation.error.errors.map(e => e.message).join(', ') };
  }

  const { username, password } = validation.data;

  // IMPORTANT: Replace with secure password hashing and comparison in a real app!
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    cookies().set('admin-auth-token', ADMIN_SESSION_TOKEN_SECRET_VALUE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: 'lax',
    });
    const finalRedirectPath = redirectPathOverride || '/admin/dashboard';
    redirect(finalRedirectPath); // Perform server-side redirect
    // The following line is effectively unreachable due to redirect,
    // but might be needed if redirect was conditional and types expect a return.
    // For now, Next.js handles the thrown redirect error.
  } else {
    return { success: false, message: 'Invalid username or password.' };
  }
}

export async function logoutAdmin() {
  cookies().delete('admin-auth-token');
  redirect('/admin/login');
}
