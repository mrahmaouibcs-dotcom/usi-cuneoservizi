/**
 * UNICA FONTE DI VERITÀ sugli orari dello sportello.
 *
 * Da qui derivano sia gli slot prenotabili sia il testo mostrato sul sito:
 * se cambi un orario qui, cambia ovunque. Non riscrivere gli orari altrove.
 *
 * Sportello di Cuneo — Lun-Ven, 10:00-12:00 e 16:00-18:00.
 */

/** Una fascia di apertura, in formato "HH:MM". */
export type Window = { start: string; end: string };

/** Fasce valide dal lunedì al venerdì. */
const GIORNI_FERIALI: Window[] = [
  { start: "10:00", end: "12:00" },
  { start: "16:00", end: "18:00" },
];

/** Apertura per giorno della settimana (0 = domenica, 6 = sabato). */
export const OPENING: Record<number, Window[]> = {
  0: [], // domenica — chiuso
  1: GIORNI_FERIALI,
  2: GIORNI_FERIALI,
  3: GIORNI_FERIALI,
  4: GIORNI_FERIALI,
  5: GIORNI_FERIALI,
  6: [], // sabato — chiuso
};

/** Griglia degli orari di inizio: ogni 30 minuti. */
export const SLOT_STEP_MIN = 30;

/** Preavviso minimo: non si prenota per le prossime 24 ore. */
export const MIN_NOTICE_HOURS = 24;

/** Orizzonte massimo: si prenota al massimo fino a 30 giorni da oggi. */
export const MAX_DAYS_AHEAD = 30;

// ---------------------------------------------------------------------------
// Conversioni orario  "HH:MM"  <->  minuti da mezzanotte
// ---------------------------------------------------------------------------

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function toHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Chiave giorno AAAA-MM-GG in orario locale (mai UTC: sposterebbe il giorno). */
export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Da "AAAA-MM-GG" a Date locale a mezzanotte. */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// ---------------------------------------------------------------------------
// Festività italiane
// ---------------------------------------------------------------------------

/** Domenica di Pasqua (algoritmo di Meeus/Jones/Butcher, calendario gregoriano). */
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = marzo, 4 = aprile
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/**
 * Festività nazionali italiane di un anno, come chiavi "AAAA-MM-GG".
 * NOTA: il patrono locale NON è incluso (varia per comune). Se lo sportello
 * chiude per il patrono, aggiungilo in CHIUSURE_EXTRA qui sotto.
 */
export function italianHolidays(year: number): Set<string> {
  const fixed = [
    `${year}-01-01`, // Capodanno
    `${year}-01-06`, // Epifania
    `${year}-04-25`, // Liberazione
    `${year}-05-01`, // Festa del Lavoro
    `${year}-06-02`, // Festa della Repubblica
    `${year}-08-15`, // Ferragosto
    `${year}-11-01`, // Ognissanti
    `${year}-12-08`, // Immacolata
    `${year}-12-25`, // Natale
    `${year}-12-26`, // Santo Stefano
  ];
  // Lunedì dell'Angelo (Pasquetta) = Pasqua + 1 giorno
  const easter = easterSunday(year);
  const pasquetta = new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() + 1);
  return new Set([...fixed, dateKey(pasquetta)]);
}

/**
 * Chiusure straordinarie aggiuntive (ferie, patrono, ponti).
 * Scrivi le date come "AAAA-MM-GG". Esempio: ["2026-08-17", "2026-08-18"].
 */
export const CHIUSURE_EXTRA: string[] = [];

/** Il giorno è una festività o una chiusura straordinaria? */
export function isHoliday(d: Date): boolean {
  const key = dateKey(d);
  return italianHolidays(d.getFullYear()).has(key) || CHIUSURE_EXTRA.includes(key);
}

// ---------------------------------------------------------------------------
// Regole sul giorno
// ---------------------------------------------------------------------------

/** Fasce di apertura del giorno (vuoto = chiuso: weekend o festivo). */
export function windowsFor(d: Date): Window[] {
  if (isHoliday(d)) return [];
  return OPENING[d.getDay()] ?? [];
}

/** Primo istante prenotabile: adesso + preavviso minimo. */
export function earliestBookable(now: Date = new Date()): Date {
  return new Date(now.getTime() + MIN_NOTICE_HOURS * 60 * 60 * 1000);
}

/** Ultimo giorno prenotabile (compreso). */
export function latestBookableDay(now: Date = new Date()): Date {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() + MAX_DAYS_AHEAD);
  return d;
}

/** Il giorno è fuori dalla finestra prenotabile (troppo presto o troppo in là)? */
export function isOutOfRange(d: Date, now: Date = new Date()): boolean {
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const last = latestBookableDay(now);
  if (day.getTime() > last.getTime()) return true;
  // Un giorno è ancora utile se contiene almeno un istante dopo il preavviso.
  const endOfDay = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59);
  return endOfDay.getTime() < earliestBookable(now).getTime();
}

/** Etichetta orari per l'interfaccia, es. "10:00-12:00 · 16:00-18:00". */
export function hoursLabel(sep = " · "): string {
  return GIORNI_FERIALI.map((w) => `${w.start}-${w.end}`).join(sep);
}
