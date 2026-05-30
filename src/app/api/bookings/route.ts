import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendBookingEmails } from "@/lib/mailer";
import { getDictionary } from "@/lib/i18n";
import { hasLocale, defaultLocale } from "@/lib/locales";
import { isServiceId } from "@/lib/services";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { service, date, time, firstName, lastName, email, phone, notes } = body;
  const locale = hasLocale(body.locale) ? body.locale : defaultLocale;

  // Validazione
  if (!isServiceId(service)) return NextResponse.json({ error: "invalid_service" }, { status: 400 });
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return NextResponse.json({ error: "invalid_time" }, { status: 400 });
  if (!firstName?.trim() || !lastName?.trim() || !phone?.trim())
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  if (!email || !emailRe.test(email)) return NextResponse.json({ error: "invalid_email" }, { status: 400 });

  // Salvataggio
  const booking = await prisma.booking.create({
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

  // Etichette per l'email
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
