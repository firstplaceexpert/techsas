import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)

  const { pathname } = request.nextUrl

  // Check demo session cookie
  const demoSession = request.cookies.get('techsas_demo_session')?.value
  const isAuthenticated = Boolean(user || demoSession)

  // Public routes that don't need auth
  const publicRoutes = ['/login', '/unauthorized', '/api/qr', '/scan']
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // Redirect unauthenticated users to login
  if (!isAuthenticated && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from login page
  if (isAuthenticated && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
