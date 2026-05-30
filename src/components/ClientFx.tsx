"use client";

import { useEffect } from "react";

/** Gestisce le animazioni client-side: comparsa allo scroll + contatori numerici. */
export default function ClientFx() {
  useEffect(() => {
    // Reveal con effetto a cascata
    const revealEls = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    const ro = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            const el = en.target as HTMLElement;
            const siblings = Array.from(el.parentElement?.children ?? []).filter((c) =>
              c.classList.contains("reveal")
            );
            const idx = siblings.indexOf(el);
            el.style.transitionDelay = `${idx >= 0 ? idx * 90 : 0}ms`;
            el.classList.add("in");
            ro.unobserve(el);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => ro.observe(el));

    // Contatori animati
    const animate = (el: HTMLElement) => {
      const target = Number(el.dataset.target || "0");
      const suffix = el.dataset.suffix || "";
      const dur = 1400;
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = Math.floor(eased * target);
        el.textContent = val.toLocaleString("it-IT") + suffix;
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = target.toLocaleString("it-IT") + suffix;
      };
      requestAnimationFrame(tick);
    };
    const co = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            animate(en.target as HTMLElement);
            co.unobserve(en.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    document.querySelectorAll<HTMLElement>(".counter").forEach((el) => co.observe(el));

    return () => {
      ro.disconnect();
      co.disconnect();
    };
  }, []);

  return null;
}
