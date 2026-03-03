import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secretKey = process.env.JWT_SECRET || "default_super_secret_key_for_quiz";
const key = new TextEncoder().encode(secretKey);

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only protect /admin routes
    if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
        const sessionCookie = request.cookies.get("admin_session")?.value;

        if (!sessionCookie) {
            return NextResponse.redirect(new URL("/admin/login", request.url));
        }

        try {
            await jwtVerify(sessionCookie, key, { algorithms: ["HS256"] });
            // Session is valid
            return NextResponse.next();
        } catch {
            // Session is invalid or expired
            return NextResponse.redirect(new URL("/admin/login", request.url));
        }
    }

    // Allow all other requests
    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt (metadata files)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
    ],
};
