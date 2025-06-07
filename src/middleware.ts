
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminAuthCookie = request.cookies.get('admin-auth-token');

  // IMPORTANT: This value must exactly match how the cookie value is generated in adminAuthActions.ts
  // It relies on ADMIN_USERNAME and ADMIN_PASSWORD being set in the environment.
  const expectedAdminCookieValue = (process.env.ADMIN_USERNAME || '') + (process.env.ADMIN_PASSWORD || '');

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    if (!adminAuthCookie || adminAuthCookie.value !== expectedAdminCookieValue) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname); // Optional: redirect back after login
      return NextResponse.redirect(loginUrl);
    }
  }
  
  if (pathname === '/admin/login' && adminAuthCookie && adminAuthCookie.value === expectedAdminCookieValue) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/admin/login'],
};

