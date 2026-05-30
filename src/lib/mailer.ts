import "server-only";
import nodemailer from "nodemailer";
import { site } from "@/lib/site";

export type BookingInfo = {
  id: string;
  serviceLabel: string;
  prettyDate: string;
  time: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes?: string | null;
};

function getTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null; // SMTP non configurato → si salta l'invio
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || "465"),
    secure: process.env.SMTP_SECURE !== "false",
    auth: { user, pass },
  });
}

function clientHtml(b: BookingInfo) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#2a201a">
    <div style="height:6px;background:linear-gradient(90deg,#0e8f48 33%,#fff 33% 66%,#d2202f 66%)"></div>
    <div style="padding:24px">
      <h2 style="color:#0e8f48;margin:0 0 4px">USI – CUNEOServizi</h2>
      <p>Gentile <strong>${b.firstName} ${b.lastName}</strong>,<br>la tua prenotazione è stata registrata.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:6px 0;color:#4a3d33">Servizio</td><td style="padding:6px 0;text-align:right"><strong>${b.serviceLabel}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#4a3d33">Data e ora</td><td style="padding:6px 0;text-align:right"><strong>${b.prettyDate} · ${b.time}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#4a3d33">Sede</td><td style="padding:6px 0;text-align:right">${site.address}</td></tr>
        <tr><td style="padding:6px 0;color:#4a3d33">Riferimento</td><td style="padding:6px 0;text-align:right">${b.id}</td></tr>
      </table>
      <p style="font-size:13px;color:#4a3d33">Per modifiche o disdette: ${site.phone} — ${site.email}</p>
    </div>
  </div>`;
}

function officeHtml(b: BookingInfo) {
  return `
  <div style="font-family:Arial,sans-serif;color:#2a201a">
    <h3>Nuova prenotazione (${b.id})</h3>
    <ul>
      <li><strong>Servizio:</strong> ${b.serviceLabel}</li>
      <li><strong>Quando:</strong> ${b.prettyDate} · ${b.time}</li>
      <li><strong>Cliente:</strong> ${b.firstName} ${b.lastName}</li>
      <li><strong>Email:</strong> ${b.email}</li>
      <li><strong>Telefono:</strong> ${b.phone}</li>
      ${b.notes ? `<li><strong>Note:</strong> ${b.notes}</li>` : ""}
    </ul>
  </div>`;
}

/** Invia le email di conferma. Se l'SMTP non è configurato, registra solo nei log. */
export async function sendBookingEmails(b: BookingInfo) {
  const transport = getTransport();
  if (!transport) {
    console.log("[mailer] SMTP non configurato — email saltate. Prenotazione:", b.id);
    return { sent: false };
  }
  const from = process.env.MAIL_FROM || `USI - CUNEOServizi <${site.email}>`;
  const office = process.env.MAIL_OFFICE || site.email;

  await Promise.all([
    transport.sendMail({
      from,
      to: b.email,
      subject: "Conferma prenotazione — USI CUNEOServizi",
      html: clientHtml(b),
    }),
    transport.sendMail({
      from,
      to: office,
      subject: `Nuova prenotazione: ${b.serviceLabel} — ${b.prettyDate} ${b.time}`,
      html: officeHtml(b),
    }),
  ]);
  return { sent: true };
}
