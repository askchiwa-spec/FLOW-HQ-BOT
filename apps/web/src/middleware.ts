import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    
    // Protect portal routes
    if (pathname.startsWith('/app') && !token) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }
    
    // Redirect logic based on setup status
    if (token && pathname.startsWith('/app')) {
      const hasSetupRequest = (token as any).hasSetupRequest;
      
      // If no setup request and not on onboarding, redirect to onboarding
      if (!hasSetupRequest && pathname !== '/app/onboarding') {
        return NextResponse.redirect(new URL('/app/onboarding', req.url));
      }
      
      // If has setup request and on onboarding, redirect to status
      if (hasSetupRequest && pathname === '/app/onboarding') {
        return NextResponse.redirect(new URL('/app/status', req.url));
      }
    }
  },
  {
    callbacks: {
      authorized({ req, token }) {
        if (req.nextUrl.pathname.startsWith('/app')) {
          return token !== null;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/app/:path*'],
};
