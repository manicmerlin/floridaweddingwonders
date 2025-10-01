import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if the request is for admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Check for venue owner authentication cookie
    const venueOwnerAuth = request.cookies.get('venue-owner-auth');
    
    // If not authenticated, redirect to login page
    if (!venueOwnerAuth || venueOwnerAuth.value !== 'authenticated') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  // Check if the request is for venue management routes
  if (request.nextUrl.pathname.includes('/manage')) {
    // Check for venue owner authentication cookie
    const venueOwnerAuth = request.cookies.get('venue-owner-auth');
    
    // If not authenticated, redirect to login
    if (!venueOwnerAuth || venueOwnerAuth.value !== 'authenticated') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/venues/:path*/manage']
};
