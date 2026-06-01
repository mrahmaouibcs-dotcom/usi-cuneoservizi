/** Elenco dei servizi prenotabili. Le etichette arrivano dai dizionari (chiavi svc.<id>.t). */
export const serviceIds = ["caf", "patr", "sind", "lang", "immig", "legal", "tutela"] as const;
export type ServiceId = (typeof serviceIds)[number];

export const isServiceId = (v: string | null | undefined): v is ServiceId =>
  !!v && (serviceIds as readonly string[]).includes(v);

/** Durata indicativa dell'appuntamento per servizio (minuti). */
export const serviceDuration: Record<ServiceId, number> = {
  caf: 30,
  patr: 30,
  sind: 45,
  lang: 60,
  immig: 45,
  legal: 45,
  tutela: 30,
};

/** Slug URL leggibili per le pagine dei servizi. */
export const serviceSlug: Record<ServiceId, string> = {
  caf: "caf",
  patr: "patronato",
  sind: "sindacato",
  lang: "esami-lingua-italiana",
  immig: "immigrazione",
  legal: "assistenza-giuridica",
  tutela: "tutela-consumatori",
};

const slugToId: Record<string, ServiceId> = Object.fromEntries(
  (Object.entries(serviceSlug) as [ServiceId, string][]).map(([id, slug]) => [slug, id])
);

export const serviceFromSlug = (slug: string): ServiceId | null => slugToId[slug] ?? null;
