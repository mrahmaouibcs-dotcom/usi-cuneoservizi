import type { Dictionary } from "@/lib/i18n";
import { site } from "@/lib/site";
import { Phone, Mail, WhatsApp } from "@/components/icons";

export default function TopBar({ dict }: { dict: Dictionary }) {
  const t = (k: string) => dict[k] ?? k;
  return (
    <div className="bg-ink-900 text-amber-50/95 text-[13px]">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <a href={site.phoneHref} className="hidden sm:inline-flex items-center gap-1.5 hover:text-white transition">
            <Phone className="w-3.5 h-3.5 text-ita-green" />
            {site.phone}
          </a>
          <a href={`mailto:${site.email}`} className="inline-flex items-center gap-1.5 hover:text-white transition">
            <Mail className="w-3.5 h-3.5 text-ita-red" />
            {site.email}
          </a>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden md:inline text-amber-50/80">{site.usicons}</span>
          <span className="hidden lg:inline">{t("topbar.hours")}</span>
          <a
            href={site.whatsappHref}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1.5 text-white hover:opacity-80 font-semibold"
          >
            <WhatsApp className="w-3.5 h-3.5 text-[#25D366]" />
            WhatsApp
          </a>
        </div>
      </div>
      {/* Dicitura USICONS sempre visibile su mobile (su desktop è nella riga sopra) */}
      <div className="md:hidden border-t border-white/10">
        <p className="max-w-7xl mx-auto px-4 py-1.5 text-center text-[11px] leading-tight text-amber-50/80">
          {site.usicons}
        </p>
      </div>
    </div>
  );
}
