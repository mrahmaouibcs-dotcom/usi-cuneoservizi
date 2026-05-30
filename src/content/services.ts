import type { ServiceId } from "@/lib/services";

export type ServiceContent = {
  intro: string;
  prestazioni: string[];
  documenti: string[];
  note?: string;
};

/**
 * Contenuti in italiano basati sulle fonti ufficiali:
 * Agenzia delle Entrate, INPS, Polizia di Stato / Portale Immigrazione,
 * Ministero dell'Interno, enti certificatori CILS/CELI/PLIDA.
 */
export const serviceContent: Record<ServiceId, ServiceContent> = {
  caf: {
    intro:
      "Assistenza fiscale completa per la dichiarazione dei redditi e gli adempimenti con l'Agenzia delle Entrate, l'INPS e i Comuni.",
    prestazioni: [
      "Modello 730 e Modello Redditi Persone Fisiche",
      "Calcolo e attestazione ISEE (DSU)",
      "IMU, TARI e tributi locali",
      "Successioni e volture catastali",
      "Contratti di locazione e cedolare secca",
      "Bonus, detrazioni e domande di assegni/contributi",
    ],
    documenti: [
      "Documento d'identità e tessera sanitaria (codice fiscale) tue e dei familiari a carico",
      "Certificazione Unica (CU) e altri redditi (lavoro, pensione, locazioni)",
      "Spese detraibili: sanitarie, scolastiche, interessi del mutuo, assicurazioni (con pagamenti tracciabili)",
      "Documentazione immobili: visure, atti di proprietà, ricevute imposte",
      "Spese per ristrutturazioni e bonus edilizi: fatture e bonifici",
      "Dichiarazione dei redditi dell'anno precedente (se disponibile)",
    ],
    note:
      "Per l'ISEE servono inoltre giacenza media e saldo al 31/12 dei conti correnti e i dati del patrimonio (immobili e veicoli) di tutto il nucleo familiare.",
  },
  patr: {
    intro:
      "Tutela previdenziale e assistenziale gratuita: ti accompagniamo nelle pratiche con INPS e INAIL.",
    prestazioni: [
      "Domande di pensione (vecchiaia, anticipata, reversibilità)",
      "Invalidità civile, Legge 104 e indennità di accompagnamento",
      "NASpI e indennità di disoccupazione",
      "Assegno Unico Universale per i figli",
      "Maternità, congedi e bonus famiglia",
      "Infortuni e malattie professionali (INAIL)",
    ],
    documenti: [
      "Documento d'identità valido e tessera sanitaria (codice fiscale)",
      "Credenziali SPID o CIE, se disponibili",
      "Per la NASpI: lettera di licenziamento/cessazione (Unilav) e ultima busta paga",
      "IBAN intestato al richiedente per l'accredito",
      "Documentazione sanitaria (per invalidità e Legge 104)",
      "Stato di famiglia o autocertificazione",
    ],
    note: "La domanda NASpI deve essere presentata entro 68 giorni dalla cessazione del rapporto di lavoro.",
  },
  sind: {
    intro:
      "Tutela dei diritti dei lavoratori: assistenza su contratti, vertenze e rapporti di lavoro.",
    prestazioni: [
      "Consulenza sul contratto e sulla busta paga",
      "Vertenze individuali e recupero dei crediti di lavoro",
      "Licenziamenti, dimissioni e conciliazioni",
      "Verifica di inquadramento e mansioni",
      "Assistenza su appalti e sicurezza sul lavoro",
      "Iscrizione e tutela sindacale",
    ],
    documenti: [
      "Documento d'identità e codice fiscale",
      "Contratto di lavoro e ultime buste paga",
      "Lettere ricevute dal datore di lavoro (contestazioni, licenziamento)",
      "Comunicazioni di assunzione/cessazione (Unilav)",
      "Documentazione utile alla vertenza (email, messaggi, eventuali testimoni)",
    ],
  },
  lang: {
    intro:
      "Centro per la preparazione e gli esami di lingua italiana per stranieri (livelli A2 e B1), validi per il permesso di soggiorno UE e per la cittadinanza.",
    prestazioni: [
      "Corsi di italiano per stranieri (A1, A2, B1)",
      "Test A2 per l'Accordo di integrazione e il permesso UE di lungo periodo",
      "Certificazione B1 valida per la domanda di cittadinanza",
      "Preparazione agli esami CILS, CELI e PLIDA",
      "Simulazioni e materiale d'esame",
      "Iscrizione alle sessioni d'esame",
    ],
    documenti: [
      "Documento d'identità o passaporto",
      "Permesso di soggiorno (o ricevuta della richiesta)",
      "Codice fiscale",
      "Attestati di corsi o certificazioni precedenti (se disponibili)",
      "Modulo di iscrizione all'esame e ricevuta di pagamento",
    ],
    note:
      "Per la cittadinanza il livello B1 è valido solo se rilasciato da enti riconosciuti dal Ministero: CILS (Università per Stranieri di Siena), CELI (Università per Stranieri di Perugia), PLIDA (Società Dante Alighieri) e CERT.IT (Università Roma Tre).",
  },
  immig: {
    intro:
      "Assistenza completa per le pratiche di soggiorno e immigrazione, dalla prima richiesta al rinnovo.",
    prestazioni: [
      "Rilascio e rinnovo del permesso di soggiorno (kit postale)",
      "Permesso UE di lungo periodo (ex carta di soggiorno)",
      "Ricongiungimento familiare e nulla osta",
      "Cittadinanza italiana per residenza o matrimonio",
      "Conversione del permesso (lavoro, studio, famiglia)",
      "Decreto flussi e regolarizzazioni",
    ],
    documenti: [
      "Copia del permesso di soggiorno in scadenza (fronte-retro)",
      "Copia del passaporto (pagina con dati anagrafici e numero)",
      "Codice fiscale / tessera sanitaria",
      "Stato di famiglia e certificato di residenza (o autocertificazione)",
      "Marca da bollo da 16 €",
      "Documentazione secondo il motivo del permesso (busta paga/contratto, iscrizione scolastica, ecc.)",
      "Foto tessera recenti",
    ],
    note:
      "Per la cittadinanza per residenza servono di norma 10 anni di residenza legale e continuativa, i redditi degli ultimi 3 anni e la certificazione di lingua italiana di livello B1.",
  },
  legal: {
    intro:
      "Consulenza e assistenza legale su diritto civile, di famiglia, amministrativo e dell'immigrazione.",
    prestazioni: [
      "Consulenza legale e pareri",
      "Diritto di famiglia (separazioni, divorzi, affidamento)",
      "Contrattualistica e locazioni",
      "Diritto amministrativo e ricorsi",
      "Ricorsi in materia di immigrazione e soggiorno",
      "Assistenza stragiudiziale e mediazione",
    ],
    documenti: [
      "Documento d'identità e codice fiscale",
      "Documentazione relativa al caso (contratti, atti, provvedimenti, lettere)",
      "Eventuali atti ricevuti (notifiche, ricorsi, diniego)",
      "ISEE (per l'eventuale patrocinio a spese dello Stato)",
      "Ogni comunicazione utile alla pratica",
    ],
    note:
      "Per il patrocinio a spese dello Stato (gratuito patrocinio) occorre rientrare nei limiti di reddito previsti dalla legge.",
  },
};
