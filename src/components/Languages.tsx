import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/locales";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Languages({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const t = (k: string) => dict[k] ?? k;
  return (
    <section id="lingue" className="py-16 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 text-center reveal">
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-ink-900">{t("lang.title")}</h2>
        <p className="mt-2 text-ink-700">{t("lang.subtitle")}</p>
        <LanguageSwitcher current={lang} variant="buttons" />
      </div>
    </section>
  );
}
