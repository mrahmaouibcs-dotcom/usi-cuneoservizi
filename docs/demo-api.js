/* demo-api.js — finto backend in memoria per la DEMO pubblica (nessun server).
   I dati sono di esempio. L'audio 🔊 usa la sintesi vocale reale del browser.
   Accesso: una email qualsiasi entra come STUDENTE; un'email con "admin"
   (es. admin@demo.it) entra come AMMINISTRATORE. La password è ignorata. */
(function () {
  "use strict";
  const LS = window.localStorage;
  function role() { return LS.getItem("demo_role") || "candidato"; }

  const candidato = { id: "c1", nome: "Aïcha", cognome: "El Amrani", livello: "B1", ente_certificatore: "CILS", ruolo: "candidato", stato_account: "attivo" };
  const admin = { id: "a1", nome: "Amministratore", cognome: "", livello: null, ruolo: "admin", stato_account: "attivo" };

  const unita = [
    { id: "u1", livello: "B1", sezione: "unità", numero: 1, titolo: "Il congiuntivo presente: opinioni e desideri", tema: "Esprimere opinioni, dubbi e desideri", descrizione: "Uso del congiuntivo dopo verbi di opinione e desiderio.", obiettivi_cefr: ["Esprimere opinioni", "Usare il congiuntivo presente"], ordine: 1 },
    { id: "u2", livello: "B1", sezione: "unità", numero: 2, titolo: "Il periodo ipotetico (I e II tipo)", tema: "Ipotesi reali e possibili", descrizione: "Se + presente/congiuntivo imperfetto.", obiettivi_cefr: ["Formulare ipotesi"], ordine: 2 },
    { id: "u3", livello: "B1", sezione: "unità", numero: 3, titolo: "Connettivi e coesione testuale", tema: "Collegare le idee", descrizione: "Causa, conseguenza, contrasto.", obiettivi_cefr: ["Collegare frasi"], ordine: 3 },
    { id: "u4", livello: "B1", sezione: "unità", numero: 4, titolo: "Il congiuntivo imperfetto e l'irrealtà", tema: "Desideri e rimpianti", descrizione: "Se fossi... vorrei che...", obiettivi_cefr: ["Esprimere irrealtà"], ordine: 4 },
  ];
  const progressi = [
    { unita_id: "u1", sezione: "unità", titolo: unita[0].titolo, numero: 1, percentuale_completamento: 100, punteggio_medio: 88, esercizi_totali: 10, esercizi_completati: 10 },
    { unita_id: "u2", sezione: "unità", titolo: unita[1].titolo, numero: 2, percentuale_completamento: 60, punteggio_medio: 74, esercizi_totali: 11, esercizi_completati: 7 },
    { unita_id: "u3", sezione: "unità", titolo: unita[2].titolo, numero: 3, percentuale_completamento: 0, punteggio_medio: 0, esercizi_totali: 11, esercizi_completati: 0 },
    { unita_id: "u4", sezione: "unità", titolo: unita[3].titolo, numero: 4, percentuale_completamento: 0, punteggio_medio: 0, esercizi_totali: 10, esercizi_completati: 0 },
  ];
  const dettaglio = {
    id: "u1", livello: "B1", sezione: "unità", numero: 1, titolo: unita[0].titolo, tema: unita[0].tema, descrizione: unita[0].descrizione, obiettivi_cefr: unita[0].obiettivi_cefr, ordine: 1,
    lezione: {
      introduzione: "Il congiuntivo presente esprime opinioni, dubbi, desideri e stati d'animo. Si usa nelle frasi dipendenti dopo verbi come penso che, credo che, voglio che, è importante che.",
      sezioni: [
        { titolo: "Coniugazione regolare", testo: "Si formano dalle tre coniugazioni regolari.", tabella: { headers: ["Pronome", "parlare", "prendere", "dormire"], rows: [["io", "parli", "prenda", "dorma"], ["tu", "parli", "prenda", "dorma"], ["lui/lei", "parli", "prenda", "dorma"], ["noi", "parliamo", "prendiamo", "dormiamo"], ["voi", "parliate", "prendiate", "dormiate"], ["loro", "parlino", "prendano", "dormano"]] }, esempi: ["Penso che lui parli bene l'italiano.", "Voglio che tu prenda una decisione."] },
        { titolo: "Verbi irregolari comuni", testo: "Alcuni verbi molto usati sono irregolari.", tabella: { headers: ["Pronome", "essere", "avere", "fare", "andare"], rows: [["io", "sia", "abbia", "faccia", "vada"], ["tu", "sia", "abbia", "faccia", "vada"], ["lui/lei", "sia", "abbia", "faccia", "vada"], ["noi", "siamo", "abbiamo", "facciamo", "andiamo"], ["voi", "siate", "abbiate", "facciate", "andiate"], ["loro", "siano", "abbiano", "facciano", "vadano"]] }, esempi: ["Credo che sia una buona idea.", "È importante che tu abbia pazienza."] },
      ],
    },
    lessico: [
      { parola: "pensare", traduzione: "to think", esempio: "Penso che sia giusto." },
      { parola: "credere", traduzione: "to believe", esempio: "Credo che lui abbia ragione." },
      { parola: "desiderare", traduzione: "to wish", esempio: "Desidero che tu venga." },
      { parola: "il dubbio", traduzione: "the doubt", esempio: "Ho un dubbio." },
      { parola: "l'opinione", traduzione: "the opinion", esempio: "La mia opinione è chiara." },
      { parola: "sembrare", traduzione: "to seem", esempio: "Sembra che piova." },
    ],
    esercizi: [
      { id: "e1", tipo: "MCQ", abilita: "grammatica", titolo: "Verbo di opinione", ordine: 0, punteggio_max: 10 },
      { id: "e2", tipo: "FILL", abilita: "grammatica", titolo: "Completa col congiuntivo", ordine: 1, punteggio_max: 10 },
      { id: "e3", tipo: "MATCH", abilita: "lessico", titolo: "Lessico e traduzione", ordine: 2, punteggio_max: 10 },
      { id: "e4", tipo: "TRUE_FALSE", abilita: "comprensione_orale", titolo: "Ascolto: un'opinione", ordine: 3, punteggio_max: 10 },
      { id: "e5", tipo: "WRITE_FREE", abilita: "produzione_scritta", titolo: "Scrivi la tua opinione", ordine: 4, punteggio_max: 20 },
      { id: "e6", tipo: "SPEAK_SIM", abilita: "produzione_orale", titolo: "Parla: esprimi un desiderio", ordine: 5, punteggio_max: 20 },
    ],
  };
  const esercizi = {
    e1: { id: "e1", unita_id: "u1", tipo: "MCQ", abilita: "grammatica", titolo: "Verbo di opinione", istruzioni: "Scegli la forma corretta del congiuntivo.", contenuto: { domanda: "Penso che lui _____ ragione.", opzioni: ["abbia", "ha", "avere", "avrà"] }, audio_url: null, punteggio_max: 10, tempo_limite_sec: null, ordine: 0 },
    e2: { id: "e2", unita_id: "u1", tipo: "FILL", abilita: "grammatica", titolo: "Completa col congiuntivo", istruzioni: "Completa con il congiuntivo.", contenuto: { testo_template: "Voglio che tu {0} a casa presto.", lacune: [{ opzioni: ["torni", "torna", "tornerai"] }] }, audio_url: null, punteggio_max: 10, tempo_limite_sec: null, ordine: 1 },
    e3: { id: "e3", unita_id: "u1", tipo: "MATCH", abilita: "lessico", titolo: "Lessico e traduzione", istruzioni: "Abbina parola e traduzione.", contenuto: { colonna_a: ["pensare", "credere", "il dubbio"], colonna_b: ["to think", "to believe", "the doubt"] }, audio_url: null, punteggio_max: 10, tempo_limite_sec: null, ordine: 2 },
    e4: { id: "e4", unita_id: "u1", tipo: "TRUE_FALSE", abilita: "comprensione_orale", titolo: "Ascolto: un'opinione", istruzioni: "Ascolta e indica se è vero o falso.", contenuto: { testo: "Secondo me, è importante che i giovani studino le lingue straniere per trovare un buon lavoro.", affermazioni: ["Studiare le lingue è importante.", "Parla del tempo libero."] }, audio_url: null, punteggio_max: 10, tempo_limite_sec: null, ordine: 3 },
    e5: { id: "e5", unita_id: "u1", tipo: "WRITE_FREE", abilita: "produzione_scritta", titolo: "Scrivi la tua opinione", istruzioni: "Scrivi un breve testo.", contenuto: { prompt: "Esprimi la tua opinione sull'importanza di imparare l'italiano (40-60 parole). Usa 'penso che', 'credo che' + congiuntivo.", parole_min: 40, parole_max: 60 }, audio_url: null, punteggio_max: 20, tempo_limite_sec: null, ordine: 4 },
    e6: { id: "e6", unita_id: "u1", tipo: "SPEAK_SIM", abilita: "produzione_orale", titolo: "Parla: esprimi un desiderio", istruzioni: "Tocca Parla ed esprimi un desiderio.", contenuto: { prompt: "Esprimi un desiderio per il tuo futuro usando 'vorrei che' o 'spero che' + congiuntivo.", traccia_modello: "Vorrei che il mondo fosse più giusto e spero che tutti abbiano le stesse opportunità.", parole_min: 20, parole_max: 40 }, audio_url: null, punteggio_max: 20, tempo_limite_sec: null, ordine: 5 },
  };
  const examEserc = [esercizi.e4, esercizi.e1, esercizi.e2, esercizi.e3, esercizi.e5, esercizi.e6];

  const wait = (v) => new Promise((r) => setTimeout(() => r(v), 120));
  function feedback(tipo) {
    if (tipo === "WRITE_FREE" || tipo === "SPEAK_SIM") return { disponibile: false, messaggio: "Nella demo la valutazione automatica non è attiva. Nell'app reale qui appare la correzione AI." };
    return null;
  }

  window.API = {
    isLoggedIn() { return !!LS.getItem("demo_token"); },
    logout() { LS.removeItem("demo_token"); LS.removeItem("demo_role"); },
    login(email) { LS.setItem("demo_role", (email || "").toLowerCase().includes("admin") ? "admin" : "candidato"); LS.setItem("demo_token", "demo"); return wait(role() === "admin" ? admin : candidato); },
    attiva() { LS.setItem("demo_role", "candidato"); LS.setItem("demo_token", "demo"); return wait(candidato); },
    me() { return wait(role() === "admin" ? admin : candidato); },
    unita() { return wait(unita); },
    unitaDettaglio() { return wait(dettaglio); },
    esercizio(id) { return wait(esercizi[id] || esercizi.e1); },
    inviaRisposta(id) { const ex = esercizi[id] || esercizi.e1; return wait({ punteggio: ex.punteggio_max, punteggio_max: ex.punteggio_max, corretto: ex.tipo === "WRITE_FREE" || ex.tipo === "SPEAK_SIM" ? null : true, dettaglio: { attesa: 0 }, feedback_ai: feedback(ex.tipo) }); },
    progressi() { return wait(progressi); },
    statistiche() { return wait({ esercizi_completati: 17, tentativi_totali: 23, punteggio_medio: 81, tempo_totale_sec: 4260, streak_giorni: 5, unita_completate: 1, unita_totali: 8 }); },

    esameInizia() { return wait({ id: "s1", livello: "B1", ente: "CILS", durata_totale_sec: 4200, tempo_rimanente_sec: 4200, stato: "in_corso", n_esercizi: examEserc.length, esercizi: examEserc }); },
    esameStato() { return this.esameInizia(); },
    esameConsegna() { return wait({ id: "s1", livello: "B1", stato: "consegnata", punteggio: 78, soglia: 60, esito: "superato", superato: true, produzioni_in_attesa: 2, sezioni: [{ abilita: "comprensione_orale", etichetta: "Ascolto", ottenuto: 18, massimo: 20, valutata: true }, { abilita: "comprensione_scritta", etichetta: "Comprensione della lettura", ottenuto: 16, massimo: 20, valutata: true }, { abilita: "grammatica", etichetta: "Strutture grammaticali", ottenuto: 40, massimo: 50, valutata: true }, { abilita: "lessico", etichetta: "Lessico", ottenuto: 16, massimo: 20, valutata: true }, { abilita: "produzione_scritta", etichetta: "Produzione scritta", ottenuto: 0, massimo: 0, valutata: false }, { abilita: "produzione_orale", etichetta: "Produzione orale", ottenuto: 0, massimo: 0, valutata: false }], consegnata_at: "2026-06-26T12:00:00" }); },
    esameReport() { return this.esameConsegna(); },
    esameStorico() { return wait([{ id: "s0", livello: "B1", punteggio: 72, esito: "superato", iniziata_at: "2026-06-20T10:00:00", consegnata_at: "2026-06-20T11:05:00" }, { id: "sx", livello: "B1", punteggio: 54, esito: "non_superato", iniziata_at: "2026-06-12T09:00:00", consegnata_at: "2026-06-12T10:02:00" }]); },

    adminStats() { return wait({ candidati_totali: 42, candidati_attivi: 35, candidati_in_attesa: 7, candidati_a2: 22, candidati_b1: 20, tentativi_totali: 1284, unita_disponibili: 16, esercizi_disponibili: 166 }); },
    adminCandidati() { return wait([{ id: "k1", nome: "Aïcha", cognome: "El Amrani", email: "aicha@example.com", livello: "B1", stato_account: "attivo" }, { id: "k2", nome: "Wang", cognome: "Lei", email: "wang@example.com", livello: "A2", stato_account: "in_attesa" }, { id: "k3", nome: "Maria", cognome: "Silva", email: "maria@example.com", livello: "A2", stato_account: "attivo" }]); },
    adminCrea() { return wait({ candidato: { nome: "Nuovo", cognome: "Candidato" }, activation_url: "https://app.esempio.it/?attiva=TOKEN-DEMO" }); },
    adminRigenera() { return wait({ activation_url: "https://app.esempio.it/?attiva=NUOVO-TOKEN-DEMO" }); },
    adminElimina() { return wait(null); },
    adminImport() { return wait({ creati: 12, falliti: 0, errori: [] }); },
  };
})();
