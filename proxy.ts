import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const ADMIN_JWT_SECRET = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET);

const intlMiddleware = createMiddleware(routing);

function resolveLocale(request: NextRequest): string {
  const pathnameLocale = request.nextUrl.pathname.split('/')[1];
  if (routing.locales.includes(pathnameLocale as (typeof routing.locales)[number])) {
    return pathnameLocale;
  }

  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && routing.locales.includes(cookieLocale as (typeof routing.locales)[number])) {
    return cookieLocale;
  }

  return routing.defaultLocale;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const locale = resolveLocale(request);
  const session = request.cookies.get('session')?.value;
  const adminSession = request.cookies.get('admin_session')?.value;

  // Admin routes (now under /spike)
  const isAdminRoute = pathname.startsWith('/spike');
  const isClientAuthRoute =
    pathname.startsWith('/dashboard') || pathname === '/login';

  // Admin routes
  if (isAdminRoute) {
    if (pathname === '/spike/login') {
      if (adminSession) {
        try {
          await jwtVerify(adminSession, ADMIN_JWT_SECRET);
          return NextResponse.redirect(
            new URL('/spike/dashboard', request.url)
          );
        } catch { }
      }
      return NextResponse.next();
    }

    if (!adminSession) {
      return NextResponse.redirect(new URL('/spike/login', request.url));
    }

    try {
      await jwtVerify(adminSession, ADMIN_JWT_SECRET);
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL('/spike/login', request.url));
    }
  }

  // Client dashboard
  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }

    try {
      await jwtVerify(session, JWT_SECRET);
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
  }

  // Client login redirect
  if (pathname === '/login') {
    if (!session) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }

    try {
      await jwtVerify(session, JWT_SECRET);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
  }

  // i18n for public routes only
  if (!isAdminRoute && !isClientAuthRoute) {
    return intlMiddleware(request);
  }

  return NextResponse.next();
}

// Next.js 16 supports both named and default exports for proxy
export default proxy;

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
