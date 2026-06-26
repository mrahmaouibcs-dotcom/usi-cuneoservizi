/* ============================================================================
   data.js — Contenuti didattici di "Italiano Facile"
   Tutti i dati sono hardcoded. Nessuna dipendenza esterna.
   Esposto come window.APP_DATA per essere usato da app.js.
   ----------------------------------------------------------------------------
   Tipi di esercizio:
     - 'multiple' : scelta multipla          { prompt, options[], answer(idx), explanation }
     - 'fill'     : completa la frase         { prompt(con ___), options[], answer(idx), explanation }
     - 'reorder'  : riordina le parole        { prompt, words[], solution, explanation }
   ========================================================================== */

(function () {
  "use strict";

  const LEVELS = {
    /* ====================================================================== */
    /*  LIVELLO A2                                                             */
    /* ====================================================================== */
    A2: {
      label: "A2",
      name: "Elementare",
      units: [
        /* ---------------- Unità 1: La famiglia ---------------- */
        {
          title: "La famiglia",
          emoji: "👨‍👩‍👧‍👦",
          subtitle: "Parenti e aggettivi possessivi",
          vocab: [
            { it: "madre",    en: "mother",      emoji: "👩",  category: "nome (f.)", example: "Mia madre cucina molto bene." },
            { it: "padre",    en: "father",      emoji: "👨",  category: "nome (m.)", example: "Mio padre legge il giornale." },
            { it: "fratello", en: "brother",     emoji: "👦",  category: "nome (m.)", example: "Mio fratello gioca a calcio." },
            { it: "sorella",  en: "sister",      emoji: "👧",  category: "nome (f.)", example: "Mia sorella studia medicina." },
            { it: "nonno",    en: "grandfather", emoji: "👴",  category: "nome (m.)", example: "Mio nonno ha una bella barba." },
            { it: "nonna",    en: "grandmother", emoji: "👵",  category: "nome (f.)", example: "La nonna prepara la torta." },
            { it: "figlio",   en: "son",         emoji: "🧒",  category: "nome (m.)", example: "Il loro figlio è simpatico." },
            { it: "figlia",   en: "daughter",    emoji: "👧",  category: "nome (f.)", example: "La mia figlia ama disegnare." },
            { it: "marito",   en: "husband",     emoji: "🤵",  category: "nome (m.)", example: "Suo marito lavora in banca." },
            { it: "moglie",   en: "wife",        emoji: "👰",  category: "nome (f.)", example: "Questa è mia moglie, Anna." }
          ],
          grammar: {
            title: "Aggettivi possessivi",
            explanation:
              "L'aggettivo possessivo concorda in genere e numero con la cosa posseduta, " +
              "non con il possessore. Di solito si usa con l'articolo (la mia casa, i miei amici), " +
              "ma con i nomi di parentela al singolare l'articolo si omette (mia madre, tuo fratello).",
            table: {
              headers: ["Persona", "Masch. sing.", "Masch. plur.", "Femm. sing.", "Femm. plur."],
              rows: [
                ["io",      "mio",     "miei",  "mia",     "mie"],
                ["tu",      "tuo",     "tuoi",  "tua",     "tue"],
                ["lui/lei", "suo",     "suoi",  "sua",     "sue"],
                ["noi",     "nostro",  "nostri","nostra",  "nostre"],
                ["voi",     "vostro",  "vostri","vostra",  "vostre"],
                ["loro",    "loro",    "loro",  "loro",    "loro"]
              ]
            }
          },
          exercises: [
            { type: "multiple",
              prompt: "_____ madre lavora in ospedale.",
              options: ["La mia", "Il mio", "La tua", "Mia"],
              answer: 0,
              explanation: "Con \"madre\" + aggettivo che descrive (qui c'è una frase con verbo), si usa \"La mia\". Madre è femminile singolare → mia, e qui l'articolo è corretto perché la frase è completa." },
            { type: "multiple",
              prompt: "Ho due _____ sorelle.",
              options: ["mie", "mio", "miei", "mia"],
              answer: 0,
              explanation: "\"Sorelle\" è femminile plurale → mie. (due mie sorelle)" },
            { type: "reorder",
              prompt: "Riordina le parole per formare la frase.",
              words: ["nonno", "mio", "ottantadue", "ha", "anni", "Il"],
              solution: "Il mio nonno ha ottantadue anni.",
              explanation: "Soggetto + verbo + complemento: \"Il mio nonno ha ottantadue anni.\"" },
            { type: "fill",
              prompt: "_____ figli si chiamano Marco e Sofia.",
              options: ["I nostri", "Il nostro", "Le nostre", "Nostri"],
              answer: 0,
              explanation: "\"Figli\" è maschile plurale → i nostri." },
            { type: "multiple",
              prompt: "Questa è _____ moglie.",
              options: ["sua", "suo", "sue", "suoi"],
              answer: 0,
              explanation: "\"Moglie\" è femminile singolare → sua. (parentela singolare: senza articolo)" }
          ]
        },

        /* ---------------- Unità 2: La routine quotidiana ---------------- */
        {
          title: "La routine quotidiana",
          emoji: "⏰",
          subtitle: "Verbi riflessivi al presente",
          vocab: [
            { it: "svegliarsi",        en: "to wake up",     emoji: "😴", category: "verbo rifl.", example: "Mi sveglio alle sette." },
            { it: "alzarsi",           en: "to get up",      emoji: "🛏️", category: "verbo rifl.", example: "Ti alzi subito?" },
            { it: "lavarsi",           en: "to wash up",     emoji: "🚿", category: "verbo rifl.", example: "Si lava le mani." },
            { it: "vestirsi",          en: "to get dressed", emoji: "👕", category: "verbo rifl.", example: "Mi vesto in fretta." },
            { it: "fare colazione",    en: "to have breakfast", emoji: "🥐", category: "espressione", example: "Faccio colazione con un caffè." },
            { it: "andare a lavorare", en: "to go to work",  emoji: "💼", category: "espressione", example: "Vado a lavorare in autobus." },
            { it: "pranzare",          en: "to have lunch",  emoji: "🍝", category: "verbo",        example: "Pranziamo all'una." },
            { it: "riposarsi",         en: "to rest",        emoji: "🛋️", category: "verbo rifl.", example: "Si riposa dopo pranzo." },
            { it: "cenare",            en: "to have dinner", emoji: "🍽️", category: "verbo",        example: "Ceniamo alle otto." },
            { it: "addormentarsi",     en: "to fall asleep", emoji: "🌙", category: "verbo rifl.", example: "Mi addormento presto." }
          ],
          grammar: {
            title: "Verbi riflessivi (presente indicativo)",
            explanation:
              "I verbi riflessivi indicano un'azione che ricade sul soggetto stesso. " +
              "Si formano con i pronomi riflessivi (mi, ti, si, ci, vi, si) + il verbo coniugato. " +
              "Esempio con svegliarsi:",
            table: {
              headers: ["Persona", "svegliarsi"],
              rows: [
                ["io",        "mi sveglio"],
                ["tu",        "ti svegli"],
                ["lui/lei",   "si sveglia"],
                ["noi",       "ci svegliamo"],
                ["voi",       "vi svegliate"],
                ["loro",      "si svegliano"]
              ]
            }
          },
          exercises: [
            { type: "fill",
              prompt: "Ogni mattina (io) _____ alle sette.",
              options: ["mi sveglio", "ti svegli", "si sveglia", "ci svegliamo"],
              answer: 0,
              explanation: "1ª persona singolare → mi sveglio." },
            { type: "fill",
              prompt: "A che ora _____ di solito?",
              options: ["ti alzi", "mi alzo", "si alza", "vi alzate"],
              answer: 0,
              explanation: "Domanda rivolta a \"tu\" → ti alzi." },
            { type: "reorder",
              prompt: "Riordina le parole per formare la frase.",
              words: ["si", "Marco", "sempre", "prima", "veste", "di", "uscire"],
              solution: "Marco si veste sempre prima di uscire.",
              explanation: "Soggetto + pronome riflessivo + verbo: \"Marco si veste sempre prima di uscire.\"" },
            { type: "fill",
              prompt: "Noi _____ alle otto di sera.",
              options: ["ceniamo", "ci ceniamo", "cenate", "cenano"],
              answer: 0,
              explanation: "\"Cenare\" NON è riflessivo: si dice \"noi ceniamo\", senza pronome." },
            { type: "fill",
              prompt: "I bambini _____ tardi la domenica.",
              options: ["si alzano", "ci alziamo", "si alza", "vi alzate"],
              answer: 0,
              explanation: "3ª persona plurale → si alzano." }
          ]
        },

        /* ---------------- Unità 3: Fare la spesa ---------------- */
        {
          title: "Fare la spesa",
          emoji: "🛒",
          subtitle: "Articoli partitivi e quantità",
          vocab: [
            { it: "supermercato", en: "supermarket", emoji: "🏬", category: "nome (m.)", example: "Vado al supermercato." },
            { it: "negozio",      en: "shop",        emoji: "🏪", category: "nome (m.)", example: "Il negozio è chiuso." },
            { it: "mercato",      en: "market",      emoji: "🍅", category: "nome (m.)", example: "Compro frutta al mercato." },
            { it: "cassa",        en: "checkout",    emoji: "💳", category: "nome (f.)", example: "Pago alla cassa." },
            { it: "scontrino",    en: "receipt",     emoji: "🧾", category: "nome (m.)", example: "Vuole lo scontrino?" },
            { it: "prezzo",       en: "price",       emoji: "🏷️", category: "nome (m.)", example: "Il prezzo è alto." },
            { it: "offerta",      en: "offer/deal",  emoji: "🔖", category: "nome (f.)", example: "C'è un'offerta speciale." },
            { it: "carrello",     en: "cart",        emoji: "🛒", category: "nome (m.)", example: "Riempio il carrello." },
            { it: "busta",        en: "bag",         emoji: "🛍️", category: "nome (f.)", example: "Vorrei una busta." },
            { it: "resto",        en: "change",      emoji: "🪙", category: "nome (m.)", example: "Ecco il resto." }
          ],
          grammar: {
            title: "Articoli partitivi e quantità",
            explanation:
              "L'articolo partitivo (del, dello, della, dei, degli, delle) indica una quantità " +
              "indeterminata, come l'inglese \"some/any\": \"Vorrei del pane\". " +
              "Per una quantità precisa si usano espressioni come: un chilo di, un litro di, " +
              "una bottiglia di, un pacchetto di.",
            table: {
              headers: ["Articolo", "Forma", "Esempio"],
              rows: [
                ["il → del",     "del",   "del pane"],
                ["lo → dello",   "dello", "dello zucchero"],
                ["la → della",   "della", "della pasta"],
                ["i → dei",      "dei",   "dei pomodori"],
                ["gli → degli",  "degli", "degli spinaci"],
                ["le → delle",   "delle", "delle mele"]
              ]
            }
          },
          exercises: [
            { type: "fill",
              prompt: "Vorrei _____ pane, per favore.",
              options: ["del", "della", "dei", "delle"],
              answer: 0,
              explanation: "\"Pane\" è maschile singolare (il pane) → del." },
            { type: "fill",
              prompt: "Compro _____ mele al mercato.",
              options: ["delle", "dei", "del", "della"],
              answer: 0,
              explanation: "\"Mele\" è femminile plurale (le mele) → delle." },
            { type: "fill",
              prompt: "Ha bisogno di _____ aiuto?",
              options: ["un po' di", "delle", "dei", "una"],
              answer: 0,
              explanation: "Con i nomi non numerabili si usa spesso \"un po' di\": un po' di aiuto." },
            { type: "reorder",
              prompt: "Riordina le parole per formare la frase.",
              words: ["vorrei", "latte", "litro", "un", "di"],
              solution: "Vorrei un litro di latte.",
              explanation: "Espressione di quantità: \"Vorrei un litro di latte.\"" },
            { type: "fill",
              prompt: "Prendo _____ pasta e _____ pomodori.",
              options: ["della … dei", "del … delle", "dei … della", "delle … del"],
              answer: 0,
              explanation: "Pasta (f. sing.) → della; pomodori (m. plur.) → dei." }
          ]
        },

        /* ---------------- Unità 4: Il tempo libero ---------------- */
        {
          title: "Il tempo libero",
          emoji: "🎨",
          subtitle: "Il verbo \"piacere\"",
          vocab: [
            { it: "calcio",       en: "football/soccer", emoji: "⚽", category: "nome (m.)", example: "Mi piace il calcio." },
            { it: "nuoto",        en: "swimming",        emoji: "🏊", category: "nome (m.)", example: "Il nuoto fa bene." },
            { it: "lettura",      en: "reading",         emoji: "📖", category: "nome (f.)", example: "Amo la lettura." },
            { it: "musica",       en: "music",           emoji: "🎵", category: "nome (f.)", example: "Ascolto musica." },
            { it: "cucina",       en: "cooking",         emoji: "🍳", category: "nome (f.)", example: "La cucina italiana è famosa." },
            { it: "cinema",       en: "cinema/movies",   emoji: "🎬", category: "nome (m.)", example: "Andiamo al cinema?" },
            { it: "passeggiata",  en: "walk",            emoji: "🚶", category: "nome (f.)", example: "Faccio una passeggiata." },
            { it: "giardinaggio", en: "gardening",       emoji: "🪴", category: "nome (m.)", example: "Il giardinaggio rilassa." },
            { it: "fotografia",   en: "photography",     emoji: "📷", category: "nome (f.)", example: "Studio fotografia." },
            { it: "viaggi",       en: "travel/trips",    emoji: "✈️", category: "nome (m.pl.)", example: "Adoro i viaggi." }
          ],
          grammar: {
            title: "Il verbo \"piacere\"",
            explanation:
              "Il verbo \"piacere\" funziona in modo diverso dall'inglese. " +
              "Si usa \"piace\" + nome singolare o verbo, e \"piacciono\" + nome plurale. " +
              "Il pronome indica a chi piace: mi, ti, gli/le, ci, vi, gli.",
            table: {
              headers: ["A chi", "Singolare / verbo", "Plurale"],
              rows: [
                ["a me",     "mi piace",  "mi piacciono"],
                ["a te",     "ti piace",  "ti piacciono"],
                ["a lui/lei","gli/le piace","gli/le piacciono"],
                ["a noi",    "ci piace",  "ci piacciono"],
                ["a voi",    "vi piace",  "vi piacciono"],
                ["a loro",   "gli piace", "gli piacciono"]
              ]
            }
          },
          exercises: [
            { type: "fill",
              prompt: "_____ il calcio? — Sì, mi piace molto!",
              options: ["Ti piace", "Ti piacciono", "Mi piace", "Vi piace"],
              answer: 0,
              explanation: "Domanda a \"tu\" + nome singolare → Ti piace." },
            { type: "fill",
              prompt: "A Maria _____ i romanzi storici.",
              options: ["piacciono", "piace", "piaci", "piace"],
              answer: 0,
              explanation: "\"I romanzi\" è plurale → piacciono." },
            { type: "fill",
              prompt: "Non mi _____ alzarmi presto.",
              options: ["piace", "piacciono", "piaccio", "piaci"],
              answer: 0,
              explanation: "Con un verbo all'infinito si usa il singolare → piace." },
            { type: "reorder",
              prompt: "Riordina le parole per formare la frase.",
              words: ["piacciono", "mi", "molto", "lunghe", "le", "passeggiate"],
              solution: "Mi piacciono molto le lunghe passeggiate.",
              explanation: "\"Le passeggiate\" è plurale → piacciono. \"Mi piacciono molto le lunghe passeggiate.\"" },
            { type: "fill",
              prompt: "_____ cucinare?",
              options: ["Vi piace", "Vi piacciono", "Ci piace", "Gli piacciono"],
              answer: 0,
              explanation: "Rivolto a \"voi\" + verbo → Vi piace." }
          ]
        }
      ]
    },

    /* ====================================================================== */
    /*  LIVELLO B1                                                             */
    /* ====================================================================== */
    B1: {
      label: "B1",
      name: "Intermedio",
      units: [
        /* ---------------- Unità 1: Lavoro e professioni ---------------- */
        {
          title: "Lavoro e professioni",
          emoji: "💼",
          subtitle: "Il congiuntivo presente",
          vocab: [
            { it: "colloquio",   en: "interview",      emoji: "🤝", category: "nome (m.)", example: "Ho un colloquio domani." },
            { it: "curriculum",  en: "résumé/CV",      emoji: "📄", category: "nome (m.)", example: "Invio il curriculum." },
            { it: "stipendio",   en: "salary",         emoji: "💶", category: "nome (m.)", example: "Lo stipendio è buono." },
            { it: "contratto",   en: "contract",       emoji: "📑", category: "nome (m.)", example: "Firmo il contratto." },
            { it: "candidarsi",  en: "to apply",       emoji: "✍️", category: "verbo rifl.", example: "Mi candido per il posto." },
            { it: "licenziare",  en: "to fire/lay off",emoji: "📤", category: "verbo",      example: "L'azienda deve licenziare." },
            { it: "assumere",    en: "to hire",        emoji: "📥", category: "verbo",      example: "Vogliono assumere due persone." },
            { it: "mansione",    en: "task/duty/role", emoji: "🗂️", category: "nome (f.)", example: "Quali sono le tue mansioni?" },
            { it: "scadenza",    en: "deadline",       emoji: "⏳", category: "nome (f.)", example: "La scadenza è venerdì." },
            { it: "telelavoro",  en: "remote work",    emoji: "🏠", category: "nome (m.)", example: "Faccio telelavoro." }
          ],
          grammar: {
            title: "Congiuntivo presente",
            explanation:
              "Il congiuntivo esprime opinione, dubbio, desiderio o necessità. " +
              "Si usa dopo verbi ed espressioni come: sperare che, pensare che, credere che, " +
              "volere che, è importante che. Esempio: \"Penso che lui sia bravo\".",
            table: {
              headers: ["Persona", "essere", "avere", "parlare", "credere", "partire"],
              rows: [
                ["io",      "sia",   "abbia",   "parli",   "creda",   "parta"],
                ["tu",      "sia",   "abbia",   "parli",   "creda",   "parta"],
                ["lui/lei", "sia",   "abbia",   "parli",   "creda",   "parta"],
                ["noi",     "siamo", "abbiamo", "parliamo","crediamo","partiamo"],
                ["voi",     "siate", "abbiate", "parliate","crediate","partiate"],
                ["loro",    "siano", "abbiano", "parlino", "credano", "partano"]
              ]
            }
          },
          exercises: [
            { type: "fill",
              prompt: "Spero che il colloquio _____ bene.",
              options: ["vada", "va", "andrà", "andasse"],
              answer: 0,
              explanation: "\"Sperare che\" richiede il congiuntivo presente: vada." },
            { type: "fill",
              prompt: "È importante che tu _____ il curriculum aggiornato.",
              options: ["abbia", "hai", "abbi", "avrai"],
              answer: 0,
              explanation: "\"È importante che\" + congiuntivo: tu abbia." },
            { type: "reorder",
              prompt: "Riordina le parole per formare la frase.",
              words: ["che", "penso", "abbia", "lui", "esperienza", "molta"],
              solution: "Penso che lui abbia molta esperienza.",
              explanation: "\"Penso che\" + congiuntivo: \"Penso che lui abbia molta esperienza.\"" },
            { type: "fill",
              prompt: "Voglio che i colleghi _____ più collaborativi.",
              options: ["siano", "sono", "siate", "saranno"],
              answer: 0,
              explanation: "\"Volere che\" + congiuntivo, 3ª plur.: siano." },
            { type: "fill",
              prompt: "Credo che questa azienda _____ le migliori condizioni.",
              options: ["offra", "offre", "offrirà", "offrisse"],
              answer: 0,
              explanation: "\"Credere che\" + congiuntivo: offra." }
          ]
        },

        /* ---------------- Unità 2: Viaggi e trasporti ---------------- */
        {
          title: "Viaggi e trasporti",
          emoji: "✈️",
          subtitle: "Il futuro semplice",
          vocab: [
            { it: "prenotare",    en: "to book",        emoji: "📅", category: "verbo",      example: "Devo prenotare il volo." },
            { it: "biglietteria", en: "ticket office",  emoji: "🎟️", category: "nome (f.)", example: "La biglietteria è là." },
            { it: "coincidenza",  en: "connection",     emoji: "🔁", category: "nome (f.)", example: "Perdo la coincidenza." },
            { it: "ritardo",      en: "delay",          emoji: "⏰", category: "nome (m.)", example: "Il treno è in ritardo." },
            { it: "volo",         en: "flight",         emoji: "🛫", category: "nome (m.)", example: "Il volo parte alle sei." },
            { it: "crociera",     en: "cruise",         emoji: "🛳️", category: "nome (f.)", example: "Faremo una crociera." },
            { it: "ostello",      en: "hostel",         emoji: "🛏️", category: "nome (m.)", example: "Dormiamo in ostello." },
            { it: "bagaglio",     en: "luggage",        emoji: "🧳", category: "nome (m.)", example: "Il bagaglio è pesante." },
            { it: "dogana",       en: "customs",        emoji: "🛂", category: "nome (f.)", example: "Passiamo la dogana." },
            { it: "itinerario",   en: "itinerary",      emoji: "🗺️", category: "nome (m.)", example: "Preparo l'itinerario." }
          ],
          grammar: {
            title: "Futuro semplice",
            explanation:
              "Il futuro semplice si usa per previsioni, promesse e probabilità. " +
              "Si forma dalla radice del verbo + le desinenze: -ò, -ai, -à, -emo, -ete, -anno. " +
              "Attenzione ai verbi irregolari (andare → andr-, avere → avr-, essere → sar-, venire → verr-).",
            table: {
              headers: ["Persona", "andare", "venire", "essere", "avere", "parlare", "partire"],
              rows: [
                ["io",      "andrò",   "verrò",   "sarò",   "avrò",   "parlerò",   "partirò"],
                ["tu",      "andrai",  "verrai",  "sarai",  "avrai",  "parlerai",  "partirai"],
                ["lui/lei", "andrà",   "verrà",   "sarà",   "avrà",   "parlerà",   "partirà"],
                ["noi",     "andremo", "verremo", "saremo", "avremo", "parleremo", "partiremo"],
                ["voi",     "andrete", "verrete", "sarete", "avrete", "parlerete", "partirete"],
                ["loro",    "andranno","verranno","saranno","avranno","parleranno","partiranno"]
              ]
            }
          },
          exercises: [
            { type: "fill",
              prompt: "Il treno _____ alle 14:30.",
              options: ["arriverà", "arriva", "arrivò", "arriverebbe"],
              answer: 0,
              explanation: "Previsione → futuro semplice: arriverà." },
            { type: "fill",
              prompt: "L'anno prossimo _____ in Sicilia.",
              options: ["andremo", "andiamo", "andavamo", "andremmo"],
              answer: 0,
              explanation: "\"L'anno prossimo\" → futuro, 1ª plur.: andremo." },
            { type: "reorder",
              prompt: "Riordina le parole per formare la domanda.",
              words: ["il", "prenoterai", "quando", "albergo", "?"],
              solution: "Quando prenoterai l'albergo?",
              explanation: "Domanda al futuro: \"Quando prenoterai l'albergo?\"" },
            { type: "fill",
              prompt: "Probabilmente _____ pioggia domani.",
              options: ["ci sarà", "c'è", "ci sarebbe", "c'era"],
              answer: 0,
              explanation: "Probabilità al futuro: ci sarà." },
            { type: "fill",
              prompt: "Vi _____ quando arrivo a Roma.",
              options: ["chiamerò", "chiamo", "chiamavo", "chiamerei"],
              answer: 0,
              explanation: "Promessa → futuro, 1ª sing.: chiamerò." }
          ]
        },

        /* ---------------- Unità 3: Salute e benessere ---------------- */
        {
          title: "Salute e benessere",
          emoji: "🩺",
          subtitle: "L'imperativo (tu / Lei)",
          vocab: [
            { it: "farmacia",     en: "pharmacy",       emoji: "💊", category: "nome (f.)", example: "Vado in farmacia." },
            { it: "ricetta",      en: "prescription",   emoji: "📝", category: "nome (f.)", example: "Ho la ricetta del medico." },
            { it: "visita medica",en: "medical exam",   emoji: "🩺", category: "espressione", example: "Faccio una visita medica." },
            { it: "sintomo",      en: "symptom",        emoji: "🤒", category: "nome (m.)", example: "Quali sintomi ha?" },
            { it: "guarire",      en: "to recover/heal",emoji: "💪", category: "verbo",      example: "Spero di guarire presto." },
            { it: "dolore",       en: "pain",           emoji: "😣", category: "nome (m.)", example: "Ho un forte dolore." },
            { it: "febbre",       en: "fever",          emoji: "🌡️", category: "nome (f.)", example: "Ho la febbre alta." },
            { it: "allergia",     en: "allergy",        emoji: "🤧", category: "nome (f.)", example: "Ho un'allergia al polline." },
            { it: "riposo",       en: "rest",           emoji: "🛌", category: "nome (m.)", example: "Il riposo è importante." },
            { it: "appuntamento", en: "appointment",    emoji: "📆", category: "nome (m.)", example: "Prendo un appuntamento." }
          ],
          grammar: {
            title: "Imperativo (tu / Lei) e negazione",
            explanation:
              "L'imperativo dà ordini e consigli. Con \"tu\" (informale): mangia! dormi! vai!. " +
              "Con \"Lei\" (formale) si usa la forma del congiuntivo: mangi! dorma! vada!. " +
              "La negazione con \"tu\" usa NON + infinito: non mangiare!. Con \"Lei\": non mangi!.",
            table: {
              headers: ["Verbo", "tu (afferm.)", "tu (neg.)", "Lei (afferm.)", "Lei (neg.)"],
              rows: [
                ["mangiare", "mangia!", "non mangiare!", "mangi!", "non mangi!"],
                ["dormire",  "dormi!",  "non dormire!",  "dorma!", "non dorma!"],
                ["andare",   "vai!",    "non andare!",   "vada!",  "non vada!"]
              ]
            }
          },
          exercises: [
            { type: "fill",
              prompt: "Dottore, _____ questi sciroppi tre volte al giorno.",
              options: ["prenda", "prendi", "prende", "prendere"],
              answer: 0,
              explanation: "Forma di cortesia (Lei) → imperativo formale: prenda." },
            { type: "fill",
              prompt: "Marco, non _____ fuori con la febbre!",
              options: ["uscire", "esci", "esca", "uscito"],
              answer: 0,
              explanation: "Negazione con \"tu\": NON + infinito → non uscire!" },
            { type: "reorder",
              prompt: "Riordina le parole per formare la frase.",
              words: ["vitamina", "prenda", "della", "ogni", "C", "giorno"],
              solution: "Prenda della vitamina C ogni giorno.",
              explanation: "Imperativo formale: \"Prenda della vitamina C ogni giorno.\"" },
            { type: "fill",
              prompt: "Non _____ troppo caffè!",
              options: ["beva", "bevi", "bere", "beve"],
              answer: 0,
              explanation: "Forma formale (Lei) negativa → non beva!" },
            { type: "fill",
              prompt: "_____ a letto e riposati.",
              options: ["Vai", "Vada", "Andare", "Va'"],
              answer: 0,
              explanation: "Imperativo informale (tu) di andare: Vai (o Va')." }
          ]
        },

        /* ---------------- Unità 4: Opinioni e dibattiti ---------------- */
        {
          title: "Opinioni e dibattiti",
          emoji: "💬",
          subtitle: "Il periodo ipotetico",
          vocab: [
            { it: "secondo me",            en: "in my opinion",      emoji: "💭", category: "espressione", example: "Secondo me hai ragione." },
            { it: "a mio parere",          en: "in my view",         emoji: "🗨️", category: "espressione", example: "A mio parere è giusto." },
            { it: "sono d'accordo",        en: "I agree",            emoji: "✅", category: "espressione", example: "Sono d'accordo con te." },
            { it: "non sono convinto",     en: "I'm not convinced",  emoji: "🤨", category: "espressione", example: "Non sono convinto di questo." },
            { it: "dal mio punto di vista",en: "from my standpoint", emoji: "👓", category: "espressione", example: "Dal mio punto di vista, no." },
            { it: "in conclusione",        en: "in conclusion",      emoji: "🏁", category: "espressione", example: "In conclusione, conviene." },
            { it: "tuttavia",              en: "however",            emoji: "↔️", category: "avverbio",    example: "Tuttavia, ci sono dubbi." },
            { it: "nonostante",            en: "despite/although",   emoji: "🚧", category: "congiunz.",   example: "Nonostante tutto, riesce." },
            { it: "d'altra parte",         en: "on the other hand",  emoji: "🤲", category: "espressione", example: "D'altra parte, è caro." },
            { it: "in effetti",            en: "indeed/in fact",     emoji: "💡", category: "espressione", example: "In effetti, è vero." }
          ],
          grammar: {
            title: "Il periodo ipotetico",
            explanation:
              "Periodo ipotetico della REALTÀ: Se + presente indicativo, + futuro/presente " +
              "(Se ho tempo, verrò). " +
              "Periodo ipotetico della POSSIBILITÀ: Se + congiuntivo imperfetto, + condizionale presente " +
              "(Se avessi tempo, verrei).",
            table: {
              headers: ["Tipo", "Condizione (se…)", "Conseguenza"],
              rows: [
                ["Realtà",      "Se + presente",                "futuro / presente"],
                ["Es. realtà",  "Se studio,",                   "passerò l'esame."],
                ["Possibilità", "Se + congiuntivo imperfetto",  "condizionale presente"],
                ["Es. possib.", "Se studiassi,",                "passerei l'esame."]
              ]
            }
          },
          exercises: [
            { type: "fill",
              prompt: "Se _____ tempo, verrò alla festa.",
              options: ["avrò", "avessi", "ho avuto", "avrei"],
              answer: 0,
              explanation: "Periodo ipotetico della realtà (con futuro nella conseguenza) → Se avrò." },
            { type: "fill",
              prompt: "Se _____ più soldi, viaggerei di più.",
              options: ["avessi", "avrò", "ho", "avrei"],
              answer: 0,
              explanation: "Conseguenza al condizionale (viaggerei) → condizione al congiuntivo imperfetto: avessi." },
            { type: "reorder",
              prompt: "Riordina le parole per formare la frase.",
              words: ["d'accordo", "sono", "non", "con", "te", "questa", "su", "cosa"],
              solution: "Non sono d'accordo con te su questa cosa.",
              explanation: "\"Non sono d'accordo con te su questa cosa.\"" },
            { type: "fill",
              prompt: "Se lui _____ la verità, non ci sarebbero problemi.",
              options: ["dicesse", "dice", "dirà", "direbbe"],
              answer: 0,
              explanation: "Conseguenza al condizionale → condizione al congiuntivo imperfetto: dicesse." },
            { type: "fill",
              prompt: "A mio parere, questa soluzione _____ la migliore.",
              options: ["è", "sia", "sarebbe", "fosse"],
              answer: 0,
              explanation: "Dopo \"a mio parere\" si afferma un'opinione come fatto → indicativo: è." }
          ]
        }
      ]
    }
  };

  window.APP_DATA = { LEVELS };
})();
