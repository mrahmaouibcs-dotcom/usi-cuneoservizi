import { NextRequest, NextResponse } from "next/server";
import { locales, defaultLocale, type Locale } from "@/lib/locales";

function getLocale(request: NextRequest): Locale {
  const header = request.headers.get("accept-language");
  if (header) {
    const preferred = header
      .split(",")
      .map((part) => part.split(";")[0].trim().slice(0, 2).toLowerCase());
    for (const lang of preferred) {
      if ((locales as readonly string[]).includes(lang)) return lang as Locale;
    }
  }
  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const pathnameHasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );
  if (pathnameHasLocale) return;

  const locale = getLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  // Salta file interni, asset statici e file con estensione (es. .png, .ico)
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
