"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, User, Calendar } from "@/components/icons";

type NavItem = { href: string; label: string };

export default function MobileNav({
  nav,
  lang,
  loginLabel,
  bookLabel,
}: {
  nav: NavItem[];
  lang: string;
  loginLabel: string;
  bookLabel: string;
}) {
  const [open, setOpen] = useState(false);

  // Blocca lo scroll del corpo pagina e chiudi con Esc quando il menù è aperto
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Apri il menù"
        aria-expanded={open}
        className="inline-flex items-center justify-center w-11 h-11 rounded-lg border border-slate-300 text-ink-800 hover:border-ita-green transition"
      >
        <Menu className="w-6 h-6" />
      </button>

      {open && (
        <>
          {/* Sfondo scuro cliccabile per chiudere */}
          <div
            className="fixed inset-0 z-[60] bg-ink-900/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          {/* Pannello laterale */}
          <div className="fixed top-0 end-0 z-[70] h-full w-[82%] max-w-sm bg-white shadow-2xl flex flex-col">
            <div className="tricolor-flow h-1.5" />
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <span className="font-serif font-bold text-lg">
                <span className="text-ita-green">USI</span> – CUNEO
                <span className="text-ita-red">Servizi</span>
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Chiudi il menù"
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-ink-800 hover:bg-slate-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
              {nav.map((n) => (
                <a
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="px-4 py-3 rounded-lg text-lg font-semibold text-ink-800 hover:bg-green-50 hover:text-ita-green transition"
                >
                  {n.label}
                </a>
              ))}
            </nav>

            <div className="px-4 py-4 border-t border-slate-200 flex flex-col gap-3">
              <a
                href="#"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg bg-ink-900 hover:bg-ink-800 text-white font-bold transition"
              >
                <User className="w-5 h-5" />
                <span>{loginLabel}</span>
              </a>
              <Link
                href={`/${lang}/prenota`}
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg bg-ita-red hover:bg-ita-red-dark text-white font-bold transition"
              >
                <Calendar className="w-5 h-5" />
                <span>{bookLabel}</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
