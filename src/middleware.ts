
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminAuthCookie = request.cookies.get('admin-auth-token');

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    // A more robust check would involve verifying the token's validity
    if (!adminAuthCookie || adminAuthCookie.value !== process.env.ADMIN_SESSION_TOKEN_SECRET_VALUE) { // Example simple check
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname); // Optional: redirect back after login
      return NextResponse.redirect(loginUrl);
    }
  }
  
  if (pathname === '/admin/login' && adminAuthCookie && adminAuthCookie.value === process.env.ADMIN_SESSION_TOKEN_SECRET_VALUE) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/admin/login'],
};
