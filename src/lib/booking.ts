/**
 * Calcolo degli orari prenotabili — SENZA finzioni.
 *
 * Prima di questa versione la disponibilità era simulata (~35% di slot finti
 * occupati): il calendario nascondeva orari liberi e mostrava come liberi orari
 * già presi. Ora la verità arriva da chi occupa davvero l'agenda.
 *
 * Le funzioni qui sono PURE: ricevono gli slot occupati e restituiscono il
 * risultato, senza toccare il database. Il database lo interroga chi le chiama
 * (`/api/availability` e `/api/bookings`), sempre lato server.
 *
 * REGOLA CHIAVE: un appuntamento deve stare INTERAMENTE dentro la fascia.
 * Con un solo operatore, due appuntamenti non possono mai sovrapporsi.
 */

import {
  SLOT_STEP_MIN,
  toMinutes,
  toHHMM,
  dateKey,
  windowsFor,
  earliestBookable,
  isOutOfRange,
} from "@/lib/schedule";

export type Part = "morning" | "afternoon";
export type Slot = { time: string; part: Part; available: boolean };

/** Motivo per cui un giorno non ha orari (serve a spiegarlo all'utente). */
export type DayStatus = "open" | "closed" | "out-of-range" | "full";

export { dateKey };

export function isWeekend(d: Date): boolean {
  const g = d.getDay();
  return g === 0 || g === 6;
}

export function isPastDay(d: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return x.getTime() < today.getTime();
}

/** Quante caselle da 30 minuti occupa un appuntamento (si arrotonda per eccesso). */
export function cellsNeeded(durationMin: number): number {
  return Math.ceil(durationMin / SLOT_STEP_MIN);
}

/**
 * Le caselle della griglia occupate da un appuntamento.
 * Es. 60 minuti alle 10:00 → ["10:00", "10:30"].
 * Es. 45 minuti alle 10:00 → ["10:00", "10:30"] (finisce 10:45, la casella resta bloccata).
 */
export function cellsFor(time: string, durationMin: number): string[] {
  const start = toMinutes(time);
  return Array.from({ length: cellsNeeded(durationMin) }, (_, i) =>
    toHHMM(start + i * SLOT_STEP_MIN)
  );
}

function partOf(windowStart: number): Part {
  return windowStart < toMinutes("13:00") ? "morning" : "afternoon";
}

/**
 * Orari di inizio possibili in un giorno per un dato servizio.
 *
 * Vengono restituiti SOLO gli orari che esistono davvero (l'appuntamento ci sta
 * per intero nella fascia). Un orario che esiste ma è occupato — o troppo vicino
 * per rispettare il preavviso — torna con `available: false`, così l'utente lo
 * vede barrato e capisce che l'ufficio quel giorno lavora.
 */
export function slotsForDay(opts: {
  date: Date;
  durationMin: number;
  /** Caselle "HH:MM" già occupate quel giorno (dal database). */
  occupied: Set<string>;
  now?: Date;
}): Slot[] {
  const { date, durationMin, occupied } = opts;
  const now = opts.now ?? new Date();

  if (isPastDay(date) || isOutOfRange(date, now)) return [];

  const minStart = earliestBookable(now);
  const out: Slot[] = [];

  for (const w of windowsFor(date)) {
    const wStart = toMinutes(w.start);
    const wEnd = toMinutes(w.end);
    const part = partOf(wStart);

    // L'appuntamento deve FINIRE entro la chiusura della fascia.
    for (let t = wStart; t + durationMin <= wEnd; t += SLOT_STEP_MIN) {
      const time = toHHMM(t);
      const libero = cellsFor(time, durationMin).every((c) => !occupied.has(c));

      const quando = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
      quando.setMinutes(t);
      const conPreavviso = quando.getTime() >= minStart.getTime();

      out.push({ time, part, available: libero && conPreavviso });
    }
  }

  return out;
}

/** Stato sintetico di un giorno, per spiegare all'utente perché non ci sono orari. */
export function dayStatus(opts: {
  date: Date;
  slots: Slot[];
  now?: Date;
}): DayStatus {
  const { date, slots } = opts;
  const now = opts.now ?? new Date();
  if (isPastDay(date) || isOutOfRange(date, now)) return "out-of-range";
  if (windowsFor(date).length === 0) return "closed";
  if (slots.some((s) => s.available)) return "open";
  return "full";
}
