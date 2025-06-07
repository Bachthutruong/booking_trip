
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';
import { getAdminUsersCollection } from '@/lib/mongodb'; // Adjust path as necessary

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminAuthCookie = request.cookies.get('admin-auth-token');
  const adminUserId = adminAuthCookie?.value;

  const isTryingToAccessAdminArea = pathname.startsWith('/admin') && !pathname.startsWith('/admin/login');
  const isTryingToAccessLoginPage = pathname === '/admin/login';

  let isAdminAuthenticated = false;

  if (adminUserId && ObjectId.isValid(adminUserId)) {
    try {
      const adminUsersCollection = await getAdminUsersCollection();
      const adminUser = await adminUsersCollection.findOne({ _id: new ObjectId(adminUserId) });
      if (adminUser) {
        isAdminAuthenticated = true;
      }
    } catch (error) {
      console.error("Middleware DB Error:", error);
      // In case of DB error, treat as unauthenticated for safety
      isAdminAuthenticated = false;
    }
  }

  if (isTryingToAccessAdminArea && !isAdminAuthenticated) {
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
