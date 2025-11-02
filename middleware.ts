import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // Ignorar requests con _rsc
    if (request.nextUrl.searchParams.has('_rsc')) {
        return NextResponse.next()
    }

    return NextResponse.next()
}

export const config = {
    matcher: '/admin/:path*',
}