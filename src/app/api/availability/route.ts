/**
 * Disponibilità reale dell'agenda — letta dal database, calcolata sul server.
 *
 * Due usi:
 *   GET /api/availability?service=caf&date=2026-07-29   → orari di quel giorno
 *   GET /api/availability?service=caf&month=2026-07     → quali giorni hanno posto
 *
 * Perché sul server: il browser non sa (e non deve sapere) chi ha già prenotato.
 * Se la disponibilità la calcolasse il client, sarebbe un'ipotesi, non un fatto.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isServiceId, serviceDuration } from "@/lib/services";
import { slotsForDay, dayStatus, dateKey } from "@/lib/booking";
import { fromDateKey, latestBookableDay, MIN_NOTICE_HOURS, MAX_DAYS_AHEAD } from "@/lib/schedule";

// L'agenda cambia in continuazione: questa risposta non va mai messa in cache.
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store, max-age=0" };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const service = searchParams.get("service");
  const date = searchParams.get("date");
  const month = searchParams.get("month");

  if (!isServiceId(service)) {
    return NextResponse.json({ error: "invalid_service" }, { status: 400, headers: noStore });
  }
  const durationMin = serviceDuration[service];
  const now = new Date();

  // ---- Modalità GIORNO: gli orari prenotabili di una data ----
  if (date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "invalid_date" }, { status: 400, headers: noStore });
    }
    const day = fromDateKey(date);

    const rows = await prisma.bookingSlot.findMany({
      where: { date },
      select: { time: true },
    });
    const occupied = new Set(rows.map((r) => r.time));

    const slots = slotsForDay({ date: day, durationMin, occupied, now });
    const status = dayStatus({ date: day, slots, now });

    return NextResponse.json(
      { service, date, durationMin, status, slots },
      { headers: noStore }
    );
  }

  // ---- Modalità MESE: quali giorni hanno almeno un orario libero ----
  if (month) {
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: "invalid_month" }, { status: 400, headers: noStore });
    }
    const [y, m] = month.split("-").map(Number);

    // Una sola interrogazione per tutto il mese.
    const rows = await prisma.bookingSlot.findMany({
      where: { date: { startsWith: month } },
      select: { date: true, time: true },
    });
    const perDay = new Map<string, Set<string>>();
    for (const r of rows) {
      if (!perDay.has(r.date)) perDay.set(r.date, new Set());
      perDay.get(r.date)!.add(r.time);
    }

    const daysInMonth = new Date(y, m, 0).getDate();
    const days: Record<string, boolean> = {};
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(y, m - 1, i);
      const key = dateKey(d);
      const slots = slotsForDay({
        date: d,
        durationMin,
        occupied: perDay.get(key) ?? new Set(),
        now,
      });
      days[key] = slots.some((s) => s.available);
    }

    return NextResponse.json(
      {
        service,
        month,
        days,
        lastBookableDay: dateKey(latestBookableDay(now)),
        minNoticeHours: MIN_NOTICE_HOURS,
        maxDaysAhead: MAX_DAYS_AHEAD,
      },
      { headers: noStore }
    );
  }

  return NextResponse.json({ error: "missing_date_or_month" }, { status: 400, headers: noStore });
}
