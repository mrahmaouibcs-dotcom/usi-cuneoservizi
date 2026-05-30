/**
 * Generazione delle fasce orarie dell'agenda.
 * Per ora la disponibilità è simulata in modo DETERMINISTICO (stessa data → stessi slot),
 * così l'interfaccia è realistica. In seguito verrà sostituita da una vera API/database.
 */

export type Slot = { time: string; available: boolean };

// Orari di apertura: mattina 9:00–13:00, pomeriggio 14:30–18:00, slot da 30 min.
const MORNING = { startH: 9, startM: 0, endH: 13, endM: 0 };
const AFTERNOON = { startH: 14, startM: 30, endH: 18, endM: 0 };
const STEP_MIN = 30;

/** Chiave AAAA-MM-GG in orario locale (no fuso UTC). */
export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isWeekend(d: Date): boolean {
  const g = d.getDay();
  return g === 0 || g === 6;
}

export function isPastDay(d: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime() < today.getTime();
}

// Pseudo-random deterministico a partire da una stringa (per stabilità degli slot).
function seeded(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

function buildRange(range: typeof MORNING): string[] {
  const out: string[] = [];
  let h = range.startH;
  let m = range.startM;
  while (h < range.endH || (h === range.endH && m < range.endM)) {
    out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    m += STEP_MIN;
    if (m >= 60) {
      m -= 60;
      h += 1;
    }
  }
  return out;
}

/** Slot della mattina o del pomeriggio per una data. */
export function getSlots(date: Date, part: "morning" | "afternoon"): Slot[] {
  if (isWeekend(date) || isPastDay(date)) return [];
  const range = part === "morning" ? MORNING : AFTERNOON;
  const key = dateKey(date);
  return buildRange(range).map((time) => {
    // ~35% occupati, deterministico per data+ora
    const available = seeded(`${key}-${time}`) > 0.35;
    return { time, available };
  });
}

export function hasAnySlot(date: Date): boolean {
  return [...getSlots(date, "morning"), ...getSlots(date, "afternoon")].some((s) => s.available);
}
