import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
export default auth((req) => {
    if (!req.auth) {
        const url = new URL("/login", req.nextUrl.origin);
        url.searchParams.set("callbackUrl", req.nextUrl.pathname);
        return NextResponse.redirect(url);
    }
    return NextResponse.next();
});
export const config = {
    matcher: [
        "/learn/:path*",
        "/lesson/:path*",
        "/progress/:path*",
        "/review/:path*",
        "/onboarding/:path*",
        "/admin/:path*",
    ],
};
