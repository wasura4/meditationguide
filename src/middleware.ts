import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Redirect signed-in users away from Home to Dashboard immediately
  if (pathname === '/') {
    const isAuth = req.cookies.get('ni_auth')?.value === '1';
    if (isAuth) {
      const url = req.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/',],
};

