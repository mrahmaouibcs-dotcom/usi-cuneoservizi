import type { Dictionary } from "@/lib/i18n";

export default function MarqueeBanner({ dict }: { dict: Dictionary }) {
  const t = (k: string) => dict[k] ?? k;
  const items = [
    { label: t("svc.caf.t"), dot: "text-ita-green" },
    { label: t("svc.patr.t"), dot: "text-white" },
    { label: t("svc.sind.t"), dot: "text-ita-red" },
    { label: t("svc.lang.t"), dot: "text-ita-green" },
    { label: t("svc.immig.t"), dot: "text-white" },
    { label: t("svc.legal.t"), dot: "text-ita-red" },
  ];
  const Row = ({ ariaHidden }: { ariaHidden?: boolean }) => (
    <span className="flex items-center gap-10" aria-hidden={ariaHidden}>
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-10">
          {it.label}
          <span className={it.dot}>●</span>
        </span>
      ))}
    </span>
  );
  return (
    <div
      className="bg-ink-900 text-white py-3 overflow-hidden"
      style={{ borderTop: "4px solid transparent", borderBottom: "4px solid transparent", borderImage: "linear-gradient(90deg,#0e8f48 33%,#fff 33% 66%,#d2202f 66%) 1" }}
    >
      <div className="marquee gap-10 text-sm font-semibold uppercase tracking-wider">
        <Row />
        <Row ariaHidden />
      </div>
    </div>
  );
}
