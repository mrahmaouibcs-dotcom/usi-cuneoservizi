"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { locales, localeNames, type Locale } from "@/lib/locales";
import { Globe, Chevron } from "@/components/icons";

function swapLocale(pathname: string, next: Locale): string {
  const parts = pathname.split("/");
  // parts[0] === "" , parts[1] === locale
  if (parts.length > 1 && (locales as readonly string[]).includes(parts[1])) {
    parts[1] = next;
  } else {
    parts.splice(1, 0, next);
  }
  return parts.join("/") || `/${next}`;
}

export default function LanguageSwitcher({
  current,
  variant = "dropdown",
}: {
  current: Locale;
  variant?: "dropdown" | "buttons";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const go = (loc: Locale) => {
    setOpen(false);
    router.push(swapLocale(pathname, loc));
  };

  if (variant === "buttons") {
    return (
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {locales.map((loc) => (
          <button
            key={loc}
            onClick={() => go(loc)}
            className={`px-5 py-3 rounded-lg border font-bold transition hover:-translate-y-0.5 ${
              loc === current
                ? "bg-ita-green text-white border-ita-green"
                : "bg-cream border-slate-200 text-ink-700 hover:border-ita-green"
            }`}
          >
            {localeNames[loc]}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 hover:border-ita-green text-sm font-semibold text-ink-700 transition"
        aria-label="Cambia lingua"
      >
        <Globe className="w-4 h-4 text-ita-green" />
        <span>{current.toUpperCase()}</span>
        <Chevron className="w-3.5 h-3.5 opacity-60" />
      </button>
      {open && (
        <div className="absolute end-0 mt-2 w-44 bg-white rounded-lg shadow-xl border border-slate-200 p-1.5 z-50">
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => go(loc)}
              className="w-full text-start px-3 py-2 rounded-md hover:bg-green-50 text-sm font-medium flex items-center justify-between text-ink-800"
            >
              <span>{localeNames[loc]}</span>
              <span className="text-xs text-slate-400">{loc.toUpperCase()}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
