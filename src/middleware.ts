import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isApi = req.nextUrl.pathname.startsWith("/api");
    const isAdminRoute = req.nextUrl.pathname.startsWith("/api/master-standard") || 
                         req.nextUrl.pathname.startsWith("/master");
    const isImportRoute = req.nextUrl.pathname.startsWith("/api/inventory/import") ||
                          req.nextUrl.pathname.startsWith("/import");

    if (isAdminRoute && token?.role !== "ADMIN") {
      if (isApi) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (isImportRoute && token?.role !== "ADMIN" && token?.role !== "OPERATOR_SATUAN") {
      if (isApi) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/login", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/master-standard/:path*",
    "/api/inventory/:path*",
    "/api/metrics/:path*",
    "/import/:path*",
    "/master/:path*",
    "/" // Redirect root to dashboard later
  ],
};
