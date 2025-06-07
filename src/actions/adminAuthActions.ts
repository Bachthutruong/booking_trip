
'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Ensure robust handling of environment variables
const ADMIN_USERNAME_ENV = process.env.ADMIN_USERNAME || '';
const ADMIN_PASSWORD_ENV = process.env.ADMIN_PASSWORD || '';

// For a real app, use a secure random string for the session token value.
// Store this in your .env file and ensure it's not committed to your repository.
// This value must be consistent with how it's checked in the middleware.
const ADMIN_SESSION_TOKEN_SECRET_VALUE = ADMIN_USERNAME_ENV + ADMIN_PASSWORD_ENV;

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

  // IMPORTANT: Replace with secure password hashing and comparison in a real app!
  // Compare against environment variables, ensuring they are treated as empty strings if not set.
  if (username === ADMIN_USERNAME_ENV && password === ADMIN_PASSWORD_ENV) {
    // Critical check: if ADMIN_SESSION_TOKEN_SECRET_VALUE is an empty string because env vars are not set,
    // this means authentication is effectively disabled or highly insecure.
    // A real app should throw an error here or prevent login if env vars are missing.
    if (ADMIN_SESSION_TOKEN_SECRET_VALUE === '') {
        console.error("CRITICAL: Admin username or password environment variables are not set. Login is insecure.");
        // Optionally, prevent login:
        // return { success: false, message: 'Server configuration error. Please contact support.' };
    }

    cookies().set('admin-auth-token', ADMIN_SESSION_TOKEN_SECRET_VALUE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: 'lax',
    });
    const finalRedirectPath = redirectPathOverride || '/admin/dashboard';
    redirect(finalRedirectPath); // Perform server-side redirect
    // The redirect function throws an error, so code below this line in the success path won't execute.
  } else {
    return { success: false, message: 'Invalid username or password.' };
  }
}

export async function logoutAdmin() {
  cookies().delete('admin-auth-token');
  redirect('/admin/login');
}
