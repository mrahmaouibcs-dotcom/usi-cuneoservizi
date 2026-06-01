type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const ArrowRight = ({ className }: IconProps) => (
  <svg className={className} {...base}><path d="M5 12h14M12 5l7 7-7 7" /></svg>
);
export const Calendar = ({ className }: IconProps) => (
  <svg className={className} {...base}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
);
export const User = ({ className }: IconProps) => (
  <svg className={className} {...base}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);
export const Phone = ({ className }: IconProps) => (
  <svg className={className} {...base}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
);
export const Mail = ({ className }: IconProps) => (
  <svg className={className} {...base}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 5L2 7" /></svg>
);
export const Pin = ({ className }: IconProps) => (
  <svg className={className} {...base}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
);
export const Check = ({ className }: IconProps) => (
  <svg className={className} {...base}><path d="M20 6 9 17l-5-5" /></svg>
);
export const Globe = ({ className }: IconProps) => (
  <svg className={className} {...base}><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" /></svg>
);
export const Chevron = ({ className }: IconProps) => (
  <svg className={className} {...base}><path d="m6 9 6 6 6-6" /></svg>
);
export const WhatsApp = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91A9.86 9.86 0 0 0 12.04 2zm5.8 14.04c-.25.7-1.44 1.33-1.98 1.41-.53.08-1.02.29-3.44-.72-2.9-1.2-4.74-4.18-4.88-4.37-.14-.19-1.16-1.54-1.16-2.94s.73-2.08 1-2.37c.25-.29.55-.36.73-.36.18 0 .37 0 .53.01.17.01.4-.06.62.48.25.6.85 2.08.93 2.23.07.15.12.32.02.51-.1.19-.15.31-.29.48-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.76 1.25 1.63 2.03 1.12 1 2.06 1.31 2.35 1.46.29.15.46.12.63-.07.17-.19.73-.85.92-1.14.19-.29.39-.24.65-.15.27.1 1.71.81 2 .96.29.15.49.22.56.34.07.12.07.7-.18 1.4z" /></svg>
);

// Icone servizi
export const IconCaf = ({ className }: IconProps) => (
  <svg className={className} {...base}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></svg>
);
export const IconPatronato = ({ className }: IconProps) => (
  <svg className={className} {...base}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" /></svg>
);
export const IconSindacato = ({ className }: IconProps) => (
  <svg className={className} {...base}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);
export const IconLingua = ({ className }: IconProps) => (
  <svg className={className} {...base}><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
);
export const IconLegale = ({ className }: IconProps) => (
  <svg className={className} {...base}><path d="M12 3v18M3 7h18M5 7l3 7H2zM19 7l3 7h-6z" /><path d="M7 21h10" /></svg>
);
export const IconTutela = ({ className }: IconProps) => (
  <svg className={className} {...base}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
);
