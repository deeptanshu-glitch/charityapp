import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const AUTH_COOKIE_NAME = 'givetrack_session';
const JWT_SECRET_STRING = process.env.JWT_SECRET || 'super-secret-jwt-key-for-givetrack-operations-platform-2024';
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET_STRING);

interface JWTPayload {
  userId: string;
  email: string;
  role: 'donor' | 'volunteer' | 'admin';
  name: string;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  let session: JWTPayload | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET_KEY, {
        algorithms: ['HS256'],
      });
      session = payload as unknown as JWTPayload;
    } catch {
      session = null;
    }
  }

  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup');
  const isAdminRoute = pathname.startsWith('/admin');
  const isVolunteerRoute = pathname.startsWith('/volunteer');
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isProtectedRoute = isAdminRoute || isVolunteerRoute || isDashboardRoute;

  // 1. If user is logged in and visits login/signup, redirect to their role home or dashboard
  if (isAuthRoute && session) {
    if (session.role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    if (session.role === 'volunteer') {
      return NextResponse.redirect(new URL('/volunteer', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 2. If user is unauthenticated and tries to access protected route -> Redirect to login
  if (isProtectedRoute && !session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Role-based routing checks
  if (session) {
    // /admin/* -> Admin only
    if (isAdminRoute && session.role !== 'admin') {
      return NextResponse.redirect(new URL('/403', request.url));
    }

    // /volunteer/* -> Volunteer or Admin
    if (isVolunteerRoute && session.role !== 'volunteer' && session.role !== 'admin') {
      return NextResponse.redirect(new URL('/403', request.url));
    }

    // /dashboard/* -> Any authenticated user (donor, volunteer, admin)
  }

  // Inject user role header for downstream server components if helpful
  const requestHeaders = new Headers(request.headers);
  if (session) {
    requestHeaders.set('x-user-id', session.userId);
    requestHeaders.set('x-user-role', session.role);
    requestHeaders.set('x-user-email', session.email);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/volunteer/:path*',
    '/dashboard/:path*',
    '/login',
    '/signup',
  ],
};
