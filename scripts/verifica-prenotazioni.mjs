/**
 * COLLAUDO del sistema di prenotazione — da lanciare col sito acceso in locale.
 *
 *   npm run dev                                    (in un'altra finestra)
 *   node --env-file=.env scripts/verifica-prenotazioni.mjs
 *
 * Crea prenotazioni di prova e POI LE CANCELLA. Va usato solo sul database di
 * collaudo, mai in produzione (controlla il DATABASE_URL prima di lanciarlo).
 *
 * Verifica che:
 *   1. gli orari offerti rispettino fasce, durate e orario di chiusura;
 *   2. non si possa prenotare due volte lo stesso posto;
 *   3. non si possano SOVRAPPORRE due appuntamenti (il caso che il vecchio
 *      sistema non vedeva proprio: 60 min alle 10:00 + 30 min alle 10:30);
 *   4. il preavviso di 24 ore e la finestra di 1 mese siano rispettati.
 */
import { PrismaClient } from "@prisma/client";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const prisma = new PrismaClient();

let ok = 0;
let ko = 0;
const creati = [];

function esito(passato, titolo, dettaglio = "") {
  if (passato) {
    ok++;
    console.log(`  ✓ ${titolo}`);
  } else {
    ko++;
    console.log(`  ✗ ${titolo}${dettaglio ? `\n      → ${dettaglio}` : ""}`);
  }
}

const get = async (qs) => {
  const r = await fetch(`${BASE}/api/availability?${qs}`, { cache: "no-store" });
  return { status: r.status, body: await r.json() };
};

const prenota = async (service, date, time, nome = "PROVA") => {
  const r = await fetch(`${BASE}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service,
      date,
      time,
      firstName: nome,
      lastName: "Automatica",
      email: "prova@esempio.invalid",
      phone: "+390000000000",
      locale: "it",
    }),
  });
  const body = await r.json().catch(() => ({}));
  if (r.status === 200 && body.id) creati.push(body.id);
  return { status: r.status, body };
};

// ---------------------------------------------------------------------------
console.log(`\nCollaudo su ${BASE}\n`);

// Trovo un giorno aperto abbastanza in là da non urtare il preavviso di 24 ore.
const oggi = new Date();
const mese = `${oggi.getFullYear()}-${String(oggi.getMonth() + 1).padStart(2, "0")}`;
const meseProssimo = new Date(oggi.getFullYear(), oggi.getMonth() + 1, 1);
const mese2 = `${meseProssimo.getFullYear()}-${String(meseProssimo.getMonth() + 1).padStart(2, "0")}`;

const m1 = await get(`service=caf&month=${mese}`);
const m2 = await get(`service=caf&month=${mese2}`);
const giorniAperti = [
  ...Object.entries(m1.body.days || {}),
  ...Object.entries(m2.body.days || {}),
]
  .filter(([, aperto]) => aperto)
  .map(([g]) => g)
  .sort();

console.log("1) FINESTRA E CALENDARIO");
esito(m1.status === 200, "l'API del mese risponde");
esito(giorniAperti.length > 0, "esistono giorni prenotabili", "nessun giorno aperto trovato");
esito(
  giorniAperti.every((g) => {
    const [y, mo, d] = g.split("-").map(Number);
    const gs = new Date(y, mo - 1, d).getDay();
    return gs !== 0 && gs !== 6;
  }),
  "nessun sabato o domenica è prenotabile"
);
esito(
  !giorniAperti.includes(`${oggi.getFullYear()}-08-15`),
  "Ferragosto (15 agosto) non è prenotabile"
);

// Prendo un giorno con margine, per non lavorare sul limite del preavviso.
const giorno = giorniAperti[Math.min(2, giorniAperti.length - 1)];
console.log(`\n   Giorno scelto per le prove: ${giorno}\n`);

console.log("2) ORARI OFFERTI (fasce 10:00-12:00 e 16:00-18:00)");
const caf = await get(`service=caf&date=${giorno}`);
const lang = await get(`service=lang&date=${giorno}`);
const oreCaf = caf.body.slots.map((s) => s.time);
const oreLang = lang.body.slots.map((s) => s.time);

esito(
  JSON.stringify(oreCaf) ===
    JSON.stringify(["10:00", "10:30", "11:00", "11:30", "16:00", "16:30", "17:00", "17:30"]),
  "servizio da 30 min → 8 orari",
  `ricevuti: ${oreCaf.join(", ")}`
);
esito(
  JSON.stringify(oreLang) ===
    JSON.stringify(["10:00", "10:30", "11:00", "16:00", "16:30", "17:00"]),
  "servizio da 60 min → 6 orari (niente 11:30: finirebbe alle 12:30)",
  `ricevuti: ${oreLang.join(", ")}`
);

console.log("\n3) DOPPIA PRENOTAZIONE E SOVRAPPOSIZIONI");
// Esame di lingua (60 min) alle 10:00 → occupa 10:00 e 10:30
const p1 = await prenota("lang", giorno, "10:00");
esito(p1.status === 200, "prima prenotazione accettata (lingua 60 min alle 10:00)", JSON.stringify(p1.body));

const p2 = await prenota("lang", giorno, "10:00");
esito(p2.status === 409, "STESSO orario rifiutato (409)", `ricevuto ${p2.status} ${JSON.stringify(p2.body)}`);

const p3 = await prenota("caf", giorno, "10:30");
esito(
  p3.status === 409,
  "orario SOVRAPPOSTO rifiutato (CAF alle 10:30 dentro l'esame 10:00-11:00)",
  `ricevuto ${p3.status} ${JSON.stringify(p3.body)}`
);

const p4 = await prenota("caf", giorno, "11:00");
esito(p4.status === 200, "orario libero subito dopo accettato (CAF alle 11:00)", JSON.stringify(p4.body));

console.log("\n4) L'AGENDA RIFLETTE LA REALTÀ");
const dopo = await get(`service=caf&date=${giorno}`);
const stato = Object.fromEntries(dopo.body.slots.map((s) => [s.time, s.available]));
esito(stato["10:00"] === false, "le 10:00 risultano occupate");
esito(stato["10:30"] === false, "le 10:30 risultano occupate (coda dell'esame)");
esito(stato["11:00"] === false, "le 11:00 risultano occupate");
esito(stato["11:30"] === true, "le 11:30 risultano ancora libere");

console.log("\n5) REGOLE DI TEMPO");
const fuoriFascia = await prenota("lang", giorno, "11:30");
esito(
  fuoriFascia.status === 400 && fuoriFascia.body.error === "slot_not_offered",
  "esame da 60 min alle 11:30 rifiutato (sfonderebbe la chiusura)",
  `ricevuto ${fuoriFascia.status} ${JSON.stringify(fuoriFascia.body)}`
);

const ieri = new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate() - 1);
const kIeri = `${ieri.getFullYear()}-${String(ieri.getMonth() + 1).padStart(2, "0")}-${String(ieri.getDate()).padStart(2, "0")}`;
const passato = await prenota("caf", kIeri, "10:00");
esito(passato.status === 400, "una data passata è rifiutata", `ricevuto ${passato.status}`);

const lontano = new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate() + 60);
const kLontano = `${lontano.getFullYear()}-${String(lontano.getMonth() + 1).padStart(2, "0")}-${String(lontano.getDate()).padStart(2, "0")}`;
const troppoAvanti = await prenota("caf", kLontano, "10:00");
esito(troppoAvanti.status === 400, "oltre 1 mese è rifiutato", `ricevuto ${troppoAvanti.status}`);

// ---------------------------------------------------------------------------
console.log("\n6) PULIZIA");
if (creati.length) {
  await prisma.booking.deleteMany({ where: { id: { in: creati } } });
  const rimaste = await prisma.bookingSlot.count({ where: { bookingId: { in: creati } } });
  esito(rimaste === 0, `cancellate ${creati.length} prenotazioni di prova e liberate le caselle`);
} else {
  console.log("  (niente da cancellare)");
}

console.log(`\n${"─".repeat(52)}`);
console.log(ko === 0 ? `TUTTO OK — ${ok} controlli superati.` : `${ok} OK, ${ko} FALLITI.`);
await prisma.$disconnect();
process.exit(ko === 0 ? 0 : 1);
