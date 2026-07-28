import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendBookingEmails } from "@/lib/mailer";
import { getDictionary } from "@/lib/i18n";
import { hasLocale, defaultLocale } from "@/lib/locales";
import { isServiceId, serviceDuration } from "@/lib/services";
import { slotsForDay, cellsFor } from "@/lib/booking";
import { fromDateKey } from "@/lib/schedule";

export const dynamic = "force-dynamic";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Il database ha rifiutato un duplicato (casella di agenda già occupata). */
function isSlotConflict(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: string }).code === "P2002"
  );
}

export async function POST(request: Request) {
  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { service, date, time, firstName, lastName, email, phone, notes } = body;
  const locale = hasLocale(body.locale) ? body.locale : defaultLocale;

  // ---- Validazione dei campi ----
  if (!isServiceId(service)) return NextResponse.json({ error: "invalid_service" }, { status: 400 });
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return NextResponse.json({ error: "invalid_time" }, { status: 400 });
  if (!firstName?.trim() || !lastName?.trim() || !phone?.trim())
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  if (!email || !emailRe.test(email)) return NextResponse.json({ error: "invalid_email" }, { status: 400 });

  const durationMin = serviceDuration[service];
  const day = fromDateKey(date);

  // ---- Verifica dell'orario LATO SERVER ----
  // Il client ha già mostrato solo orari validi, ma non ci fidiamo: chiunque può
  // inviare una richiesta a mano. Qui si ricontrolla fascia, durata, preavviso,
  // festivi e occupazione reale.
  const presi = await prisma.bookingSlot.findMany({ where: { date }, select: { time: true } });
  const occupied = new Set(presi.map((r) => r.time));
  const slots = slotsForDay({ date: day, durationMin, occupied });
  const slot = slots.find((s) => s.time === time);

  if (!slot) {
    // L'orario non esiste proprio: fuori fascia, giorno chiuso, festivo, troppo
    // in là nel tempo, o l'appuntamento sfonderebbe l'orario di chiusura.
    return NextResponse.json({ error: "slot_not_offered" }, { status: 400 });
  }
  if (!slot.available) {
    return NextResponse.json({ error: "slot_taken" }, { status: 409 });
  }

  // ---- Salvataggio atomico: o passa tutto, o non passa niente ----
  // Le caselle di agenda hanno la chiave primaria "AAAA-MM-GGTHH:MM": se un'altra
  // prenotazione le ha occupate in questo istante, il database rifiuta e la
  // transazione viene annullata per intero (niente prenotazione fantasma).
  const cells = cellsFor(time, durationMin);
  let booking;
  try {
    booking = await prisma.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: {
          service,
          date,
          time,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          notes: notes?.trim() || null,
          locale,
          status: "pending",
        },
      });
      await tx.bookingSlot.createMany({
        data: cells.map((c) => ({
          key: `${date}T${c}`,
          date,
          time: c,
          bookingId: created.id,
        })),
      });
      return created;
    });
  } catch (e) {
    if (isSlotConflict(e)) {
      return NextResponse.json({ error: "slot_taken" }, { status: 409 });
    }
    console.error("[bookings] salvataggio fallito:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  // ---- Etichette per l'email ----
  const dict = await getDictionary(locale);
  const serviceLabel = dict[`svc.${service}.t`] ?? service;
  const [y, m, d] = date.split("-").map(Number);
  const prettyDate = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, d));

  // Email (non bloccante: se fallisce, la prenotazione resta salvata)
  try {
    await sendBookingEmails({
      id: booking.id,
      serviceLabel,
      prettyDate,
      time,
      firstName: booking.firstName,
      lastName: booking.lastName,
      email: booking.email,
      phone: booking.phone,
      notes: booking.notes,
    });
  } catch (e) {
    console.error("[bookings] invio email fallito:", e);
  }

  return NextResponse.json({ id: booking.id, serviceLabel, prettyDate });
}
