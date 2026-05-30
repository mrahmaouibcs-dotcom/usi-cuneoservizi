export type LegalSection = { h: string; p?: string; list?: string[] };
export type LegalDoc = { titleKey: string; updated: string; intro: string; sections: LegalSection[] };

export type LegalKey = "privacy" | "cookie" | "termini";

export const legalDocs: Record<LegalKey, LegalDoc> = {
  privacy: {
    titleKey: "footer.privacy",
    updated: "maggio 2026",
    intro:
      "La presente informativa descrive come USI – CUNEOServizi tratta i dati personali degli utenti del sito e di chi richiede i nostri servizi, ai sensi del Regolamento (UE) 2016/679 (GDPR).",
    sections: [
      {
        h: "Titolare del trattamento",
        p: "Il Titolare del trattamento è USI – CUNEOServizi (1912 - Unione Sindacale Italiana - Federazione Provinciale di Cuneo). I recapiti completi sono indicati in fondo a questa pagina e nella sezione Contatti.",
      },
      {
        h: "Dati che raccogliamo",
        list: [
          "Dati di prenotazione: nome, cognome, email, telefono, servizio richiesto, data e ora, eventuali note.",
          "Dati necessari all'erogazione dei servizi (es. documenti anagrafici, fiscali, previdenziali), raccolti principalmente allo sportello.",
          "Dati tecnici di navigazione strettamente necessari al funzionamento del sito.",
        ],
      },
      {
        h: "Categorie particolari di dati",
        p: "Per alcuni servizi (ad esempio invalidità o pratiche sanitarie) possono essere trattati dati relativi alla salute, esclusivamente se necessario alla pratica e in presenza di idonea base giuridica.",
      },
      {
        h: "Finalità e base giuridica",
        list: [
          "Gestione degli appuntamenti e contatto con l'interessato (misure precontrattuali e fornitura del servizio).",
          "Erogazione dei servizi richiesti e relativi adempimenti (esecuzione del contratto e obblighi di legge).",
          "Adempimenti fiscali, contabili e amministrativi previsti dalla normativa.",
        ],
      },
      {
        h: "Destinatari dei dati",
        p: "I dati possono essere comunicati, solo se necessario alla pratica, agli enti competenti (ad esempio Agenzia delle Entrate, INPS, INAIL, Questura e Prefettura) e a fornitori di servizi tecnici che agiscono come responsabili del trattamento. I dati non vengono venduti a terzi.",
      },
      {
        h: "Conservazione dei dati",
        p: "I dati sono conservati per il tempo necessario alle finalità indicate e secondo gli obblighi di legge; al termine vengono cancellati o resi anonimi.",
      },
      {
        h: "I tuoi diritti",
        p: "Puoi esercitare i diritti di accesso, rettifica, cancellazione, limitazione, opposizione e portabilità dei dati, e revocare il consenso in qualsiasi momento. Hai inoltre diritto di proporre reclamo al Garante per la protezione dei dati personali (www.garanteprivacy.it).",
      },
      {
        h: "Come esercitare i diritti",
        p: "Per esercitare i tuoi diritti puoi contattare il Titolare ai recapiti indicati in fondo a questa pagina.",
      },
    ],
  },
  cookie: {
    titleKey: "footer.cookie",
    updated: "maggio 2026",
    intro:
      "Questo sito utilizza esclusivamente cookie e tecnologie strettamente necessari al suo funzionamento. Non utilizziamo cookie di profilazione o di marketing.",
    sections: [
      {
        h: "Cookie tecnici essenziali",
        list: [
          "Cookie di sessione dell'area riservata, necessario per l'accesso degli operatori.",
          "Preferenza della lingua, salvata nel tuo browser per mostrarti il sito nella lingua scelta.",
        ],
      },
      {
        h: "Cookie di terze parti",
        p: "Il sito non installa cookie di profilazione di terze parti. Eventuali servizi esterni (ad esempio mappe o pagamenti) saranno attivati solo previo consenso, qualora introdotti in futuro.",
      },
      {
        h: "Gestione dei cookie",
        p: "Puoi gestire o eliminare i cookie dalle impostazioni del tuo browser. La disattivazione dei cookie tecnici può compromettere alcune funzioni del sito.",
      },
    ],
  },
  termini: {
    titleKey: "footer.terms",
    updated: "maggio 2026",
    intro: "Utilizzando questo sito accetti le presenti condizioni d'uso.",
    sections: [
      {
        h: "Servizi del sito",
        p: "Il sito consente di consultare i servizi offerti e di richiedere un appuntamento online. La prenotazione costituisce una richiesta di appuntamento; la conferma definitiva può essere comunicata via email, telefono o WhatsApp.",
      },
      {
        h: "Esattezza delle informazioni",
        p: "Le informazioni sui servizi e sui documenti hanno carattere informativo e possono variare in base alla normativa vigente e al caso specifico. Fa sempre fede quanto previsto dagli enti competenti.",
      },
      {
        h: "Responsabilità",
        p: "Pur impegnandoci a mantenere le informazioni aggiornate, non garantiamo l'assenza di errori o interruzioni del servizio. L'uso del sito avviene sotto la responsabilità dell'utente.",
      },
      {
        h: "Pagamenti",
        p: "Eventuali pagamenti online dei servizi saranno gestiti tramite operatori di pagamento sicuri e disciplinati da condizioni specifiche al momento della loro introduzione.",
      },
      {
        h: "Legge applicabile",
        p: "Le presenti condizioni sono regolate dalla legge italiana. Per ogni controversia è competente il Foro di Cuneo.",
      },
    ],
  },
};
