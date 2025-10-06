import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Skip middleware for API routes, static files, and root (login page)
  if (
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/favicon') ||
    request.nextUrl.pathname === '/'
  ) {
    return NextResponse.next()
  }

  // Check for authentication cookie
  const authToken = request.cookies.get('hunt-wet-auth')
  const correctPassword = process.env.HUNT_WET_PASSWORD || 'huntseason2024'

  // If no auth token or invalid, redirect to root (login)
  if (!authToken || authToken.value !== correctPassword) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login page
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login).*)',
  ],
}