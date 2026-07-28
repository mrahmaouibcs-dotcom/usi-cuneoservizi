/**
 * Ricostruisce le caselle di agenda (BookingSlot) per le prenotazioni GIÀ esistenti.
 *
 * Perché serve: la tabella BookingSlot è nuova. Senza questo passaggio, gli
 * appuntamenti presi prima non occuperebbero nulla e qualcuno potrebbe prenotare
 * sopra di loro.
 *
 * Va eseguito UNA VOLTA per ogni database (collaudo e produzione), subito dopo
 * `npx prisma db push`.
 *
 *   node --env-file=.env scripts/backfill-slots.mjs           (prova, non scrive)
 *   node --env-file=.env scripts/backfill-slots.mjs --scrivi  (esegue davvero)
 *
 * Le prenotazioni "cancelled" vengono ignorate: non devono occupare l'agenda.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SCRIVI = process.argv.includes("--scrivi");

// Copia volutamente in chiaro di src/lib/services.ts e src/lib/booking.ts:
// questo script deve poter girare da solo sul server, senza compilare il TypeScript.
const DURATA = { caf: 30, patr: 30, sind: 45, lang: 60, immig: 45, legal: 45, tutela: 30 };
const PASSO = 30;

const inMinuti = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const inOrario = (min) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

const caselle = (time, durata) => {
  const start = inMinuti(time);
  const n = Math.ceil(durata / PASSO);
  return Array.from({ length: n }, (_, i) => inOrario(start + i * PASSO));
};

const bookings = await prisma.booking.findMany({
  where: { status: { not: "cancelled" } },
  orderBy: [{ date: "asc" }, { time: "asc" }, { createdAt: "asc" }],
});

console.log(`Prenotazioni attive trovate: ${bookings.length}`);
if (bookings.length === 0) {
  console.log("Niente da ricostruire.");
  await prisma.$disconnect();
  process.exit(0);
}

// Prima passata: individuo le sovrapposizioni già presenti nei dati.
// (Il vecchio sistema non le impediva: se ce ne sono, vanno risolte a mano.)
const proprietario = new Map(); // chiave casella -> id prenotazione
const daInserire = [];
const conflitti = [];

for (const b of bookings) {
  const durata = DURATA[b.service];
  if (!durata) {
    console.log(`⚠  ${b.id}: servizio sconosciuto "${b.service}" — saltata`);
    continue;
  }
  const mie = caselle(b.time, durata);
  const scontro = mie.find((c) => proprietario.has(`${b.date}T${c}`));
  if (scontro) {
    conflitti.push({
      id: b.id,
      quando: `${b.date} ${b.time}`,
      chi: `${b.firstName} ${b.lastName}`,
      contro: proprietario.get(`${b.date}T${scontro}`),
    });
    continue; // la prima prenotazione in ordine di tempo tiene la casella
  }
  for (const c of mie) {
    proprietario.set(`${b.date}T${c}`, b.id);
    daInserire.push({ key: `${b.date}T${c}`, date: b.date, time: c, bookingId: b.id });
  }
}

console.log(`Caselle da creare: ${daInserire.length}`);

if (conflitti.length > 0) {
  console.log(`\n⚠  ATTENZIONE — ${conflitti.length} prenotazioni si sovrappongono ad altre.`);
  console.log("   Sono state create con il vecchio sistema, che non lo impediva.");
  console.log("   NON occuperanno l'agenda: vanno sistemate a mano in /it/admin.\n");
  for (const c of conflitti) {
    console.log(`   · ${c.quando} — ${c.chi} (${c.id}) si sovrappone a ${c.contro}`);
  }
  console.log("");
}

if (!SCRIVI) {
  console.log("PROVA a vuoto: non ho scritto niente. Rilancia con --scrivi per eseguire.");
  await prisma.$disconnect();
  process.exit(0);
}

const res = await prisma.bookingSlot.createMany({ data: daInserire, skipDuplicates: true });
console.log(`✓ Caselle create: ${res.count}`);

await prisma.$disconnect();
