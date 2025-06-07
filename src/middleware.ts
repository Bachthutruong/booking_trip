import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// import { verifyAdminToken } from '@/actions/adminAuthActions'; // This import will be removed

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('Middleware: Pathname:', pathname);

  const isPublicAdminPath = pathname === '/admin/login' || pathname === '/admin/register';
  const isTryingToAccessProtectedAdminArea = pathname.startsWith('/admin') && !isPublicAdminPath;
  const isTryingToAccessLoginPage = pathname === '/admin/login';

  // Check for the presence of the admin-auth-token cookie
  const isAdminAuthenticated = request.cookies.has('admin-auth-token');

  console.log('Middleware: Is Admin Authenticated (by cookie presence)?', isAdminAuthenticated);

  if (isTryingToAccessProtectedAdminArea && !isAdminAuthenticated) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isTryingToAccessLoginPage && isAdminAuthenticated) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/admin/login'],
};
