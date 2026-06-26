/* app.js — PWA candidato. React + htm da CDN, nessun build tool.
   Pensata per principianti: poche scelte per schermata, pulsanti grandi. */
(function () {
  "use strict";
  const { useState, useEffect } = React;
  const html = htm.bind(React.createElement);

  /* ---------- icone nav ---------- */
  const Ico = {
    home: () => html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>`,
    libro: () => html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z"/><path d="M18 3v16"/></svg>`,
    grafico: () => html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V4M4 20h16"/><path d="M8 16v-4M13 16V8M18 16v-7"/></svg>`,
    esci: () => html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/></svg>`,
  };
  const Flag = () => html`<span class="flag" role="img" aria-label="bandiera italiana"></span>`;
  const Spinner = () => html`<div class="spinner"></div>`;

  function renderGap(text) {
    const parts = String(text).split(/_{2,}/);
    if (parts.length === 1) return text;
    const out = [];
    parts.forEach((p, i) => { out.push(p); if (i < parts.length - 1) out.push(html`<span class="gap" key=${i}>______</span>`); });
    return out;
  }

  /* ---------- audio: pronuncia con voce italiana del browser ---------- */
  const speechOK = typeof window !== "undefined" && "speechSynthesis" in window;
  function primeVoices() {
    if (!speechOK) return;
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }
  function vocePicker() {
    if (!speechOK) return null;
    const v = window.speechSynthesis.getVoices() || [];
    return v.find((x) => x.lang === "it-IT") || v.find((x) => x.lang && x.lang.toLowerCase().startsWith("it")) || null;
  }
  function speak(text) {
    if (!speechOK || !text) return;
    try {
      const s = window.speechSynthesis;
      s.cancel();
      const u = new SpeechSynthesisUtterance(String(text));
      u.lang = "it-IT";
      const v = vocePicker();
      if (v) u.voice = v;
      u.rate = 0.95;
      s.speak(u);
    } catch (e) {}
  }
  const SpeakerIcon = () => html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8 8 0 0 1 0 12"/></svg>`;
  function Speak({ text, label, variant }) {
    if (!speechOK || !text) return null;
    return html`<button type="button" class=${"speak" + (variant ? " speak--" + variant : "")}
      aria-label=${label || "Ascolta"} title="Ascolta"
      onClick=${(e) => { e.stopPropagation(); speak(text); }}><${SpeakerIcon} /></button>`;
  }
  // testo principale leggibile di un esercizio (per la pronuncia)
  function testoEsercizio(ex) {
    const c = ex.contenuto || {};
    if (c.testo) return c.testo;
    if (c.domanda) return String(c.domanda).replace(/_{2,}/g, " ... ");
    if (c.testo_template) return String(c.testo_template).replace(/\{\d+\}/g, " ... ");
    if (c.prompt) return c.prompt;
    return null;
  }

  /* =======================================================================
     WIDGET ESERCIZI — ognuno chiama setAnswer(payload)
     ======================================================================= */
  function WMcq({ ex, answer, setAnswer, locked, risultato }) {
    const scelta = answer && answer.scelta;
    const attesa = risultato && risultato.dettaglio ? risultato.dettaglio.attesa : null;
    return html`
      <div>
        <p class="domanda">${renderGap(ex.contenuto.domanda)}</p>
        <div class="opzioni">
          ${ex.contenuto.opzioni.map((opt, i) => {
            let cls = "opzione";
            if (locked) {
              if (i === attesa) cls += " opzione--ok";
              else if (i === scelta) cls += " opzione--no";
              else cls += " opzione--mut";
            } else if (i === scelta) cls += " opzione--sel";
            return html`<button key=${i} class=${cls} disabled=${locked}
              onClick=${() => setAnswer({ scelta: i })}>
              <span>${opt}</span>
              ${locked && i === attesa ? html`<span class="mark">✓</span>` : null}
              ${locked && i === scelta && i !== attesa ? html`<span class="mark">✕</span>` : null}
            </button>`;
          })}
        </div>
      </div>`;
  }

  function WTrueFalse({ ex, answer, setAnswer, locked }) {
    const valori = (answer && answer.risposte) || ex.contenuto.affermazioni.map(() => null);
    const set = (i, v) => { const a = valori.slice(); a[i] = v; setAnswer({ risposte: a }); };
    const opt = [["vero", "Vero"], ["falso", "Falso"], ["non_detto", "Non detto"]];
    const orale = ex.abilita === "comprensione_orale";
    return html`
      <div>
        ${orale && ex.contenuto.testo ? html`
          <div class="card audio-riga" style=${{ marginBottom: "14px" }}>
            <${Speak} text=${ex.contenuto.testo} label="Ascolta il testo" variant="grande" />
            <span>Ascolta il testo, poi rispondi (il testo non si legge).</span>
          </div>` : null}
        ${!orale && ex.contenuto.testo ? html`<div class="card">${ex.contenuto.testo}</div>` : null}
        ${ex.contenuto.affermazioni.map((af, i) => html`
          <div key=${i} style=${{ marginBottom: "14px" }}>
            <div style=${{ marginBottom: "8px", fontWeight: 600 }}>${i + 1}. ${af}</div>
            <div class="match-col">
              ${opt.map(([v, lbl]) => html`<button key=${v}
                class=${"match-item" + (valori[i] === v ? " match-item--sel" : "")}
                disabled=${locked} onClick=${() => set(i, v)}>${lbl}</button>`)}
            </div>
          </div>`)}
      </div>`;
  }

  function WFill({ ex, answer, setAnswer, locked }) {
    const valori = (answer && answer.risposte) || ex.contenuto.lacune.map(() => "");
    const set = (i, v) => { const a = valori.slice(); a[i] = v; setAnswer({ risposte: a }); };
    const parts = String(ex.contenuto.testo_template).split(/\{\d+\}/);
    const nodes = [];
    parts.forEach((p, i) => {
      nodes.push(html`<span key=${"t" + i}>${p}</span>`);
      if (i < ex.contenuto.lacune.length) {
        const lac = ex.contenuto.lacune[i];
        if (lac.opzioni && lac.opzioni.length) {
          nodes.push(html`<select key=${"s" + i} class="fill-sel" style=${{ display: "inline-block", width: "auto", minWidth: "120px", margin: "0 4px" }}
            disabled=${locked} value=${valori[i]} onChange=${(e) => set(i, e.target.value)}>
            <option value="">— scegli —</option>
            ${lac.opzioni.map((o) => html`<option key=${o} value=${o}>${o}</option>`)}
          </select>`);
        } else {
          nodes.push(html`<input key=${"i" + i} class="fill-sel" style=${{ display: "inline-block", width: "140px", margin: "0 4px" }}
            disabled=${locked} value=${valori[i]} onInput=${(e) => set(i, e.target.value)} />`);
        }
      }
    });
    return html`<p class="domanda" style=${{ lineHeight: 2 }}>${nodes}</p>`;
  }

  function WReorder({ ex, answer, setAnswer, locked }) {
    const tokens = ex.contenuto.parole.map((w, id) => ({ id, w }));
    const inAns = (answer && answer._ids) || [];
    const ansTokens = inAns.map((id) => tokens.find((t) => t.id === id)).filter(Boolean);
    const pool = tokens.filter((t) => !inAns.includes(t.id));
    const commit = (ids) => setAnswer({ _ids: ids, frase: ids.map((id) => tokens[id].w).join(" ") });
    return html`
      <div>
        <p class="domanda">${ex.istruzioni || "Ordina le parole"}</p>
        <div class="zona">
          ${ansTokens.map((t) => html`<button key=${t.id} class="chip" disabled=${locked}
            onClick=${() => commit(inAns.filter((x) => x !== t.id))}>${t.w}</button>`)}
        </div>
        <div class="pool">
          ${pool.map((t) => html`<button key=${t.id} class="chip" disabled=${locked}
            onClick=${() => commit([...inAns, t.id])}>${t.w}</button>`)}
        </div>
      </div>`;
  }

  function WMatch({ ex, answer, setAnswer, locked }) {
    const [selA, setSelA] = useState(null);
    const mappa = (answer && answer.mappa) || {};
    const usedB = Object.values(mappa);
    const clickA = (i) => { if (locked) return; setSelA(i); };
    const clickB = (j) => {
      if (locked || selA === null) return;
      const m = { ...mappa }; m[String(selA)] = j; setAnswer({ mappa: m }); setSelA(null);
    };
    return html`
      <div>
        <p class="domanda">${ex.istruzioni || "Abbina gli elementi"}</p>
        <div class="match-col">
          <div>
            ${ex.contenuto.colonna_a.map((a, i) => {
              const done = mappa[String(i)] !== undefined;
              return html`<div key=${i} class=${"match-item" + (selA === i ? " match-item--sel" : done ? " match-item--done" : "")}
                onClick=${() => clickA(i)}>${a}${done ? " ✓" : ""}</div>`;
            })}
          </div>
          <div>
            ${ex.contenuto.colonna_b.map((b, j) => html`<div key=${j}
              class=${"match-item" + (usedB.includes(j) ? " match-item--done" : "")}
              onClick=${() => clickB(j)}>${b}</div>`)}
          </div>
        </div>
        <p class="progress-label">Tocca un elemento a sinistra, poi il suo abbinamento a destra.</p>
      </div>`;
  }

  function WErrorFind({ ex, answer, setAnswer, locked }) {
    const sel = (answer && answer.indici) || [];
    const toggle = (i) => { if (locked) return; setAnswer({ indici: sel.includes(i) ? sel.filter((x) => x !== i) : [...sel, i] }); };
    return html`
      <div>
        <p class="domanda">${ex.istruzioni || "Tocca la parola sbagliata"}</p>
        <div class="pool">
          ${ex.contenuto.parole.map((w, i) => html`<button key=${i}
            class=${"chip" + (sel.includes(i) ? " chip--no" : "")} disabled=${locked}
            onClick=${() => toggle(i)}>${w}</button>`)}
        </div>
      </div>`;
  }

  function WWrite({ ex, answer, setAnswer, locked }) {
    const testo = (answer && answer.testo) || "";
    const n = testo.trim() ? testo.trim().split(/\s+/).length : 0;
    return html`
      <div>
        <p class="domanda">${ex.contenuto.prompt}</p>
        <textarea class="write" disabled=${locked} value=${testo}
          onInput=${(e) => setAnswer({ testo: e.target.value })}
          placeholder="Scrivi qui la tua risposta…"></textarea>
        <p class="progress-label">${n} parole ${ex.contenuto.parole_min ? `(consigliate ${ex.contenuto.parole_min}-${ex.contenuto.parole_max})` : ""}</p>
      </div>`;
  }

  const WIDGETS = { MCQ: WMcq, TRUE_FALSE: WTrueFalse, FILL: WFill, REORDER: WReorder, MATCH: WMatch, ERROR_FIND: WErrorFind, WRITE_FREE: WWrite };

  function answerPronta(tipo, answer) {
    if (!answer) return false;
    if (tipo === "MCQ") return answer.scelta !== undefined;
    if (tipo === "TRUE_FALSE") return (answer.risposte || []).every((x) => x);
    if (tipo === "FILL") return (answer.risposte || []).every((x) => x);
    if (tipo === "REORDER") return (answer._ids || []).length > 0;
    if (tipo === "MATCH") return Object.keys(answer.mappa || {}).length > 0;
    if (tipo === "ERROR_FIND") return (answer.indici || []).length > 0;
    if (tipo === "WRITE_FREE") return (answer.testo || "").trim().length > 0;
    return false;
  }

  /* =======================================================================
     SCHERMATE
     ======================================================================= */
  function Login({ onLogged }) {
    const [email, setEmail] = useState("");
    const [pwd, setPwd] = useState("");
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState(false);
    const submit = async (e) => {
      e.preventDefault(); setErr(""); setBusy(true);
      try { const c = await API.login(email.trim(), pwd); onLogged(c); }
      catch (ex) { setErr(ex.detail || "Accesso non riuscito"); setBusy(false); }
    };
    return html`
      <form class="center-screen fade" onSubmit=${submit}>
        <div class="logo-big"></div>
        <h1 class="title-big">Preparazione Esami</h1>
        <p class="sub-big">Accedi per allenarti — Italiano A2 / B1</p>
        ${err ? html`<div class="alert alert--err">${err}</div>` : null}
        <div class="field">
          <label>Email</label>
          <input type="email" inputmode="email" autocomplete="email" value=${email}
            onInput=${(e) => setEmail(e.target.value)} placeholder="la-tua-email@esempio.it" required />
        </div>
        <div class="field">
          <label>Password</label>
          <input type="password" autocomplete="current-password" value=${pwd}
            onInput=${(e) => setPwd(e.target.value)} placeholder="La tua password" required />
        </div>
        <button class="btn btn--primary" type="submit" disabled=${busy}>${busy ? "Accesso…" : "Entra"}</button>
        <p class="sub-big" style=${{ marginTop: "20px", fontSize: "14px" }}>
          Hai ricevuto un link di attivazione via email? Aprilo per creare la password.
        </p>
      </form>`;
  }

  function Attiva({ token, onLogged }) {
    const [pwd, setPwd] = useState("");
    const [pwd2, setPwd2] = useState("");
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState(false);
    const submit = async (e) => {
      e.preventDefault(); setErr("");
      if (pwd.length < 8) return setErr("La password deve avere almeno 8 caratteri.");
      if (pwd !== pwd2) return setErr("Le due password non coincidono.");
      setBusy(true);
      try { const c = await API.attiva(token, pwd); onLogged(c); }
      catch (ex) { setErr(ex.detail || "Attivazione non riuscita"); setBusy(false); }
    };
    return html`
      <form class="center-screen fade" onSubmit=${submit}>
        <div class="logo-big"></div>
        <h1 class="title-big">Attiva il tuo account</h1>
        <p class="sub-big">Scegli una password per accedere</p>
        ${err ? html`<div class="alert alert--err">${err}</div>` : null}
        <div class="field"><label>Nuova password (min. 8)</label>
          <input type="password" value=${pwd} onInput=${(e) => setPwd(e.target.value)} required /></div>
        <div class="field"><label>Ripeti la password</label>
          <input type="password" value=${pwd2} onInput=${(e) => setPwd2(e.target.value)} required /></div>
        <button class="btn btn--primary" type="submit" disabled=${busy}>${busy ? "Attivazione…" : "Attiva e entra"}</button>
      </form>`;
  }

  function Header({ candidato, titolo, sub }) {
    return html`<header class="header">
      <div><h1>${titolo}</h1>${sub ? html`<p>${sub}</p>` : null}</div>
      <div style=${{ display: "flex", alignItems: "center", gap: "8px" }}>
        ${candidato && candidato.livello ? html`<span class="badge">${candidato.livello}</span>` : null}
        <${Flag} />
      </div>
    </header>`;
  }

  function Home({ candidato, go }) {
    const [unita, setUnita] = useState(null);
    const [stats, setStats] = useState(null);
    const [err, setErr] = useState("");
    useEffect(() => {
      (async () => {
        try {
          const [u, p] = await Promise.all([API.unita(), API.progressi()]);
          const byId = {}; p.forEach((x) => (byId[x.unita_id] = x));
          setUnita(u.map((x) => ({ ...x, prog: byId[x.id] })));
          setStats(await API.statistiche());
        } catch (ex) { setErr(ex.detail); }
      })();
    }, []);
    if (err) return html`<div class="main fade"><div class="alert alert--err">${err}</div></div>`;
    if (!unita) return html`<div class="main"><${Spinner} /></div>`;
    const prossima = unita.find((u) => !u.prog || u.prog.percentuale_completamento < 100) || unita[0];
    return html`
      <div class="main fade">
        <${Header} candidato=${candidato} titolo=${"Ciao " + (candidato.nome || "") + "!"} sub=${"Pronto ad allenarti?"} />
        <div class="card card--hero">
          <h2>Continua la preparazione</h2>
          <p>${prossima ? prossima.titolo : "Inizia ora"}</p>
          <button class="btn btn--ghost" onClick=${() => go("unita", { id: prossima.id })}>Inizia ▸</button>
        </div>
        ${stats ? html`<div class="stat-row">
          <div class="stat"><div class="stat__n">${stats.esercizi_completati}</div><div class="stat__l">Esercizi fatti</div></div>
          <div class="stat"><div class="stat__n">${Math.round(stats.punteggio_medio)}%</div><div class="stat__l">Media</div></div>
          <div class="stat"><div class="stat__n">🔥 ${stats.streak_giorni}</div><div class="stat__l">Giorni</div></div>
        </div>` : null}
        <div class="sezione-tit">Le tue unità</div>
        ${unita.map((u, i) => {
          const pc = u.prog ? Math.round(u.prog.percentuale_completamento) : 0;
          return html`<button key=${u.id} class="item" onClick=${() => go("unita", { id: u.id })}>
            <span class="item__num">${i + 1}</span>
            <span class="item__body">
              <span class="item__title">${u.titolo}</span>
              <span class="item__sub">${pc}% completato</span>
            </span>
            ${pc >= 100 ? html`<span class="item__check">✓</span>` : html`<span class="item__chev">›</span>`}
          </button>`;
        })}
      </div>`;
  }

  function tipoLabel(t) {
    return { MCQ: "Scelta multipla", FILL: "Completa", REORDER: "Riordina", MATCH: "Abbina", TRUE_FALSE: "Vero/Falso", ERROR_FIND: "Trova l'errore", WRITE_FREE: "Scrittura" }[t] || t;
  }
  function abilitaLabel(a) {
    return {
      grammatica: "Grammatica", lessico: "Lessico",
      comprensione_scritta: "Comprensione scritta", comprensione_orale: "Comprensione orale 🎧",
      produzione_scritta: "Produzione scritta", produzione_orale: "Produzione orale",
    }[a] || "Grammatica";
  }

  function Lezione({ lezione }) {
    const sez = (lezione && lezione.sezioni) || [];
    return html`<div>
      ${lezione && lezione.introduzione ? html`<p class="lez-intro">${lezione.introduzione}</p>` : null}
      ${sez.map((s, i) => html`<div key=${i} class="card">
        <div class="lez-tit">${s.titolo}</div>
        ${s.testo ? html`<p style=${{ margin: "0 0 10px" }}>${s.testo}</p>` : null}
        ${s.tabella ? html`<div class="lez-tab-wrap"><table class="lez-tab">
          <thead><tr>${(s.tabella.headers || []).map((h, hi) => html`<th key=${hi}>${h}</th>`)}</tr></thead>
          <tbody>${(s.tabella.rows || []).map((r, ri) => html`<tr key=${ri}>${r.map((c, ci) => html`<td key=${ci}>${c}</td>`)}</tr>`)}</tbody>
        </table></div>` : null}
        ${(s.esempi || []).map((es, ei) => html`<div key=${ei} class="lez-esempio"><${Speak} text=${es} label="Ascolta l'esempio" /><span>${es}</span></div>`)}
      </div>`)}
    </div>`;
  }

  function Lessico({ lessico }) {
    return html`<div>${(lessico || []).map((v, i) => html`<div key=${i} class="vocab">
      <${Speak} text=${v.parola} label=${"Ascolta " + v.parola} />
      <div class="vocab__body">
        <div class="vocab__it">${v.parola}${v.traduzione ? html`<span class="vocab__en"> — ${v.traduzione}</span>` : null}</div>
        ${v.esempio ? html`<div class="vocab__ex">“${v.esempio}”</div>` : null}
      </div>
    </div>`)}</div>`;
  }

  function UnitaView({ candidato, unitaId, go }) {
    const [dett, setDett] = useState(null);
    const [err, setErr] = useState("");
    const [vista, setVista] = useState("home");
    useEffect(() => { setVista("home"); (async () => { try { setDett(await API.unitaDettaglio(unitaId)); } catch (ex) { setErr(ex.detail); } })(); }, [unitaId]);
    if (err) return html`<div class="main fade"><button class="back" onClick=${() => go("home")}>‹ Indietro</button><div class="alert alert--err">${err}</div></div>`;
    if (!dett) return html`<div class="main"><${Spinner} /></div>`;
    const haLezione = dett.lezione && (dett.lezione.introduzione || (dett.lezione.sezioni || []).length);
    const haLessico = (dett.lessico || []).length;

    if (vista === "lezione") return html`<div class="main fade">
      <button class="back" onClick=${() => setVista("home")}>‹ Torna all'unità</button>
      <${Header} candidato=${candidato} titolo=${"Lezione"} sub=${dett.titolo} />
      <${Lezione} lezione=${dett.lezione} />
      <button class="btn btn--blu" style=${{ marginTop: "12px" }} onClick=${() => setVista("home")}>Ho capito → vai agli esercizi</button>
    </div>`;
    if (vista === "lessico") return html`<div class="main fade">
      <button class="back" onClick=${() => setVista("home")}>‹ Torna all'unità</button>
      <${Header} candidato=${candidato} titolo=${"Lessico"} sub=${dett.titolo} />
      <p class="progress-label" style=${{ marginBottom: "12px" }}>Tocca 🔊 per ascoltare la pronuncia.</p>
      <${Lessico} lessico=${dett.lessico} />
    </div>`;

    return html`<div class="main fade">
      <button class="back" onClick=${() => go("home")}>‹ Le mie unità</button>
      <${Header} candidato=${candidato} titolo=${dett.titolo} sub=${dett.tema || dett.descrizione} />
      ${haLezione ? html`<button class="item" onClick=${() => setVista("lezione")}>
        <span class="item__num">📖</span><span class="item__body"><span class="item__title">Lezione</span>
          <span class="item__sub">Teoria ed esempi (con audio)</span></span><span class="item__chev">›</span></button>` : null}
      ${haLessico ? html`<button class="item" onClick=${() => setVista("lessico")}>
        <span class="item__num">🔤</span><span class="item__body"><span class="item__title">Lessico</span>
          <span class="item__sub">${dett.lessico.length} parole con pronuncia</span></span><span class="item__chev">›</span></button>` : null}
      <div class="sezione-tit">Esercizi (${dett.esercizi.length})</div>
      ${dett.esercizi.map((e, i) => html`<button key=${e.id} class="item"
        onClick=${() => go("esercizio", { lista: dett.esercizi, idx: i, unitaId })}>
        <span class="item__num">${i + 1}</span>
        <span class="item__body"><span class="item__title">${e.titolo}</span>
          <span class="item__sub">${abilitaLabel(e.abilita)} · ${tipoLabel(e.tipo)}</span></span>
        <span class="item__chev">›</span>
      </button>`)}
    </div>`;
  }

  function Esercizio({ candidato, lista, idx, unitaId, go }) {
    const item = lista[idx];
    const [ex, setEx] = useState(null);
    const [answer, setAnswer] = useState(null);
    const [ris, setRis] = useState(null);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");
    const [t0] = useState(() => Date.now());
    useEffect(() => {
      setEx(null); setAnswer(null); setRis(null); setErr("");
      (async () => { try { setEx(await API.esercizio(item.id)); } catch (e) { setErr(e.detail); } })();
    }, [item.id]);

    const invia = async () => {
      setBusy(true);
      try {
        const dur = Math.round((Date.now() - t0) / 1000);
        setRis(await API.inviaRisposta(item.id, answer || {}, dur));
      } catch (e) { setErr(e.detail); }
      setBusy(false);
    };
    const avanti = () => {
      if (idx + 1 < lista.length) go("esercizio", { lista, idx: idx + 1, unitaId });
      else go("unita", { id: unitaId });
    };

    if (err) return html`<div class="main fade"><button class="back" onClick=${() => go("unita", { id: unitaId })}>‹ Indietro</button><div class="alert alert--err">${err}</div></div>`;
    if (!ex) return html`<div class="main"><${Spinner} /></div>`;
    const W = WIDGETS[ex.tipo];
    const locked = !!ris;
    const aiType = ex.tipo === "WRITE_FREE";
    return html`
      <div class="main fade">
        <button class="back" onClick=${() => go("unita", { id: unitaId })}>‹ Esci dall'esercizio</button>
        <div class="progress" style=${{ marginBottom: "6px" }}>
          <div class="progress__fill" style=${{ width: Math.round(((idx + (locked ? 1 : 0)) / lista.length) * 100) + "%" }}></div>
        </div>
        <p class="progress-label" style=${{ marginBottom: "10px" }}>Esercizio ${idx + 1} di ${lista.length}</p>
        ${testoEsercizio(ex) ? html`
          <div class="audio-riga"><${Speak} text=${testoEsercizio(ex)} label="Ascolta la frase" variant="grande" /><span>Ascolta la pronuncia</span></div>` : null}
        ${W ? html`<${W} ex=${ex} answer=${answer} setAnswer=${setAnswer} locked=${locked} risultato=${ris} />`
            : html`<div class="alert alert--err">Tipo di esercizio non supportato.</div>`}
        ${ris ? html`
          <div class=${"feedback " + (!aiType && !ris.corretto ? "feedback--no" : "feedback--ok")}>
            ${aiType
              ? (ris.feedback_ai && ris.feedback_ai.disponibile ? html`
                  <div class="feedback__t">Valutazione: ${ris.punteggio} / ${ris.punteggio_max}</div>
                  ${(ris.feedback_ai.punti_di_forza || []).length ? html`
                    <div style=${{ marginTop: "8px" }}><strong>Punti di forza</strong>
                      <ul style=${{ margin: "4px 0 0 18px" }}>${ris.feedback_ai.punti_di_forza.map((p, i) => html`<li key=${i}>${p}</li>`)}</ul></div>` : null}
                  ${(ris.feedback_ai.suggerimenti || []).length ? html`
                    <div style=${{ marginTop: "8px" }}><strong>Suggerimenti</strong>
                      <ul style=${{ margin: "4px 0 0 18px" }}>${ris.feedback_ai.suggerimenti.map((p, i) => html`<li key=${i}>${p}</li>`)}</ul></div>` : null}
                  ${ris.feedback_ai.testo_corretto ? html`
                    <div style=${{ marginTop: "8px" }}><strong>Testo corretto</strong>
                      <div style=${{ fontStyle: "italic" }}>${ris.feedback_ai.testo_corretto}</div></div>` : null}
                ` : html`
                  <div class="feedback__t">Risposta inviata ✓</div>
                  <div>${(ris.feedback_ai && ris.feedback_ai.messaggio) || "La valutazione automatica non è disponibile al momento."}</div>
                `)
              : html`
                  <div class="feedback__t">${ris.corretto ? "Corretto! 🎉" : "Non del tutto"}</div>
                  <div>Punteggio: ${ris.punteggio} / ${ris.punteggio_max}</div>
                `}
          </div>
          <button class="btn btn--primary" style=${{ marginTop: "16px" }} onClick=${avanti}>
            ${idx + 1 < lista.length ? "Avanti ▸" : "Fine ✓"}</button>
        ` : html`
          <button class="btn btn--blu" style=${{ marginTop: "20px" }} disabled=${busy || !answerPronta(ex.tipo, answer)} onClick=${invia}>
            ${busy ? "Invio…" : "Conferma risposta"}</button>
        `}
      </div>`;
  }

  function Progressi({ candidato, go }) {
    const [prog, setProg] = useState(null);
    const [stats, setStats] = useState(null);
    const [err, setErr] = useState("");
    useEffect(() => { (async () => { try { setProg(await API.progressi()); setStats(await API.statistiche()); } catch (e) { setErr(e.detail); } })(); }, []);
    if (err) return html`<div class="main fade"><div class="alert alert--err">${err}</div></div>`;
    if (!prog) return html`<div class="main"><${Spinner} /></div>`;
    return html`
      <div class="main fade">
        <${Header} candidato=${candidato} titolo=${"I tuoi progressi"} sub=${"Livello " + (candidato.livello || "")} />
        ${stats ? html`<div class="stat-row">
          <div class="stat"><div class="stat__n">${stats.unita_completate}/${stats.unita_totali}</div><div class="stat__l">Unità</div></div>
          <div class="stat"><div class="stat__n">${Math.round(stats.punteggio_medio)}%</div><div class="stat__l">Media</div></div>
          <div class="stat"><div class="stat__n">${Math.round(stats.tempo_totale_sec / 60)}'</div><div class="stat__l">Tempo</div></div>
        </div>` : null}
        <div class="sezione-tit">Per unità</div>
        ${prog.map((p) => html`<div key=${p.unita_id} class="card">
          <div style=${{ fontWeight: 600, marginBottom: "8px" }}>${p.titolo}</div>
          <div class="progress"><div class="progress__fill" style=${{ width: Math.round(p.percentuale_completamento) + "%" }}></div></div>
          <p class="progress-label">${p.esercizi_completati}/${p.esercizi_totali} esercizi · media ${Math.round(p.punteggio_medio)}%</p>
        </div>`)}
      </div>`;
  }

  function Nav({ tab, go, onEsci }) {
    const items = [["home", "Home", Ico.home], ["percorso", "Esercizi", Ico.libro], ["progressi", "Progressi", Ico.grafico]];
    return html`<nav class="nav">
      ${items.map(([k, l, I]) => html`<button key=${k} class=${tab === k ? "active" : ""} onClick=${() => go(k)}>
        <${I} /><span>${l}</span></button>`)}
      <button onClick=${onEsci}><${Ico.esci} /><span>Esci</span></button>
    </nav>`;
  }

  /* =======================================================================
     PANNELLO ADMIN
     ======================================================================= */
  function CopyLink({ url }) {
    const [done, setDone] = useState(false);
    return html`<div class="card" style=${{ background: "var(--blu-soft)" }}>
      <div style=${{ fontSize: "13px", wordBreak: "break-all", marginBottom: "10px" }}>${url}</div>
      <button class="btn btn--light" onClick=${async () => { try { await navigator.clipboard.writeText(url); setDone(true); setTimeout(() => setDone(false), 1500); } catch (e) {} }}>
        ${done ? "Copiato! ✓" : "Copia link di attivazione"}</button>
    </div>`;
  }

  function AdminStats() {
    const [s, setS] = useState(null);
    const [err, setErr] = useState("");
    useEffect(() => { API.adminStats().then(setS).catch((e) => setErr(e.detail)); }, []);
    if (err) return html`<div class="main fade"><div class="alert alert--err">${err}</div></div>`;
    if (!s) return html`<div class="main"><${Spinner} /></div>`;
    return html`<div class="main fade">
      <header class="header"><div><h1>Statistiche</h1><p>Quadro generale</p></div><${Flag} /></header>
      <div class="stat-row">
        <div class="stat"><div class="stat__n">${s.candidati_totali}</div><div class="stat__l">Candidati</div></div>
        <div class="stat"><div class="stat__n">${s.candidati_attivi}</div><div class="stat__l">Attivi</div></div>
        <div class="stat"><div class="stat__n">${s.candidati_in_attesa}</div><div class="stat__l">In attesa</div></div>
      </div>
      <div class="stat-row">
        <div class="stat"><div class="stat__n">${s.candidati_a2}</div><div class="stat__l">Livello A2</div></div>
        <div class="stat"><div class="stat__n">${s.candidati_b1}</div><div class="stat__l">Livello B1</div></div>
        <div class="stat"><div class="stat__n">${s.tentativi_totali}</div><div class="stat__l">Esercizi svolti</div></div>
      </div>
      <div class="card"><strong>Contenuti disponibili</strong>
        <p class="progress-label">${s.unita_disponibili} unità · ${s.esercizi_disponibili} esercizi</p></div>
    </div>`;
  }

  function AdminLista() {
    const [lista, setLista] = useState(null);
    const [err, setErr] = useState("");
    const [link, setLink] = useState(null);
    const carica = () => API.adminCandidati().then(setLista).catch((e) => setErr(e.detail));
    useEffect(() => { carica(); }, []);
    const rigenera = async (id) => { try { const r = await API.adminRigenera(id); setLink(r.activation_url); } catch (e) { setErr(e.detail); } };
    const elimina = async (id) => { if (!window.confirm("Eliminare questo candidato e i suoi dati?")) return; try { await API.adminElimina(id); setLista(null); carica(); } catch (e) { setErr(e.detail); } };
    if (err) return html`<div class="main fade"><div class="alert alert--err">${err}</div></div>`;
    if (!lista) return html`<div class="main"><${Spinner} /></div>`;
    return html`<div class="main fade">
      <header class="header"><div><h1>Candidati</h1><p>${lista.length} iscritti</p></div><${Flag} /></header>
      ${link ? html`<div><div class="alert alert--ok">Link di attivazione generato. Invialo al candidato.</div><${CopyLink} url=${link} /><button class="btn btn--light" style=${{ marginBottom: "14px" }} onClick=${() => setLink(null)}>Chiudi</button></div>` : null}
      ${lista.length === 0 ? html`<div class="card">Nessun candidato. Vai su "Nuovo" per crearne.</div>` : null}
      ${lista.map((c) => html`<div key=${c.id} class="card">
        <div style=${{ display: "flex", alignItems: "center", gap: "8px" }}>
          <strong style=${{ flex: 1 }}>${c.nome} ${c.cognome}</strong>
          <span class="badge">${c.livello || "-"}</span>
        </div>
        <div class="item__sub" style=${{ margin: "4px 0 10px" }}>${c.email} · ${c.stato_account === "attivo" ? "✅ attivo" : c.stato_account === "in_attesa" ? "⏳ in attesa" : "⛔ sospeso"}</div>
        <div style=${{ display: "flex", gap: "8px" }}>
          ${c.stato_account !== "attivo" ? html`<button class="btn btn--light" style=${{ minHeight: "44px", fontSize: "15px" }} onClick=${() => rigenera(c.id)}>Link attivazione</button>` : null}
          <button class="btn btn--light" style=${{ minHeight: "44px", fontSize: "15px", color: "var(--rosso)", borderColor: "var(--rosso)" }} onClick=${() => elimina(c.id)}>Elimina</button>
        </div>
      </div>`)}
    </div>`;
  }

  function AdminNuovo() {
    const [f, setF] = useState({ nome: "", cognome: "", email: "", livello: "A2", ente_certificatore: "CILS", data_esame: "" });
    const [res, setRes] = useState(null);
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState(false);
    const [imp, setImp] = useState(null);
    const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
    const crea = async (e) => {
      e.preventDefault(); setErr(""); setBusy(true);
      try {
        const body = { ...f }; if (!body.data_esame) delete body.data_esame;
        const r = await API.adminCrea(body); setRes(r);
        setF({ nome: "", cognome: "", email: "", livello: f.livello, ente_certificatore: f.ente_certificatore, data_esame: "" });
      } catch (ex) { setErr(ex.detail); }
      setBusy(false);
    };
    const importa = async (e) => {
      const file = e.target.files && e.target.files[0]; if (!file) return;
      setErr(""); setImp(null);
      try { setImp(await API.adminImport(file)); } catch (ex) { setErr(ex.detail); }
    };
    return html`<div class="main fade">
      <header class="header"><div><h1>Nuovo candidato</h1><p>Crea un iscritto</p></div><${Flag} /></header>
      ${err ? html`<div class="alert alert--err">${err}</div>` : null}
      ${res ? html`<div><div class="alert alert--ok">Candidato creato: ${res.candidato.nome} ${res.candidato.cognome}</div><${CopyLink} url=${res.activation_url} /><button class="btn btn--light" style=${{ marginBottom: "16px" }} onClick=${() => setRes(null)}>Crea un altro</button></div>` : html`
      <form onSubmit=${crea}>
        <div class="field"><label>Nome</label><input value=${f.nome} onInput=${(e) => set("nome", e.target.value)} required /></div>
        <div class="field"><label>Cognome</label><input value=${f.cognome} onInput=${(e) => set("cognome", e.target.value)} required /></div>
        <div class="field"><label>Email</label><input type="email" value=${f.email} onInput=${(e) => set("email", e.target.value)} required /></div>
        <div class="field"><label>Livello</label>
          <select class="fill-sel" value=${f.livello} onChange=${(e) => set("livello", e.target.value)}>
            <option value="A2">A2</option><option value="B1">B1</option></select></div>
        <div class="field"><label>Ente certificatore</label>
          <select class="fill-sel" value=${f.ente_certificatore} onChange=${(e) => set("ente_certificatore", e.target.value)}>
            ${["CILS", "CELI", "PLIDA", "IT"].map((x) => html`<option key=${x} value=${x}>${x}</option>`)}</select></div>
        <div class="field"><label>Data esame (facoltativa)</label><input type="date" value=${f.data_esame} onInput=${(e) => set("data_esame", e.target.value)} /></div>
        <button class="btn btn--blu" type="submit" disabled=${busy}>${busy ? "Creazione…" : "Crea candidato"}</button>
      </form>`}

      <div class="sezione-tit" style=${{ marginTop: "24px" }}>Oppure importa un CSV</div>
      <div class="card">
        <p class="progress-label" style=${{ marginTop: 0 }}>Colonne: email, nome, cognome, livello, ente_certificatore, data_esame</p>
        <input type="file" accept=".csv,text/csv" onChange=${importa} />
        ${imp ? html`<div class="alert alert--ok" style=${{ marginTop: "12px" }}>Creati: ${imp.creati} · Falliti: ${imp.falliti}</div>
          ${imp.errori.length ? html`<div class="alert alert--err">${imp.errori.map((e) => html`<div key=${e.riga}>Riga ${e.riga} (${e.email || "?"}): ${e.errore}</div>`)}</div>` : null}` : null}
      </div>
    </div>`;
  }

  function AdminApp({ candidato, onEsci }) {
    const [screen, setScreen] = useState("stats");
    let view;
    if (screen === "stats") view = html`<${AdminStats} />`;
    else if (screen === "lista") view = html`<${AdminLista} />`;
    else view = html`<${AdminNuovo} />`;
    return html`<div class="app">
      ${view}
      <nav class="nav">
        <button class=${screen === "stats" ? "active" : ""} onClick=${() => setScreen("stats")}><${Ico.grafico} /><span>Statistiche</span></button>
        <button class=${screen === "lista" ? "active" : ""} onClick=${() => setScreen("lista")}><${Ico.libro} /><span>Candidati</span></button>
        <button class=${screen === "nuovo" ? "active" : ""} onClick=${() => setScreen("nuovo")}><${Ico.home} /><span>Nuovo</span></button>
        <button onClick=${onEsci}><${Ico.esci} /><span>Esci</span></button>
      </nav>
    </div>`;
  }

  /* =======================================================================
     APP ROOT
     ======================================================================= */
  function App() {
    const [boot, setBoot] = useState(true);
    const [candidato, setCandidato] = useState(null);
    const [screen, setScreen] = useState({ name: "login", params: {} });
    const [attivaToken, setAttivaToken] = useState(null);

    const go = (name, params = {}) => setScreen({ name, params });

    useEffect(() => { primeVoices(); }, []);

    useEffect(() => {
      const url = new URL(window.location.href);
      const tk = url.searchParams.get("attiva");
      if (tk) { setAttivaToken(tk); setBoot(false); return; }
      if (API.isLoggedIn()) {
        API.me().then((c) => { setCandidato(c); go("home"); }).catch(() => { API.logout(); }).finally(() => setBoot(false));
      } else setBoot(false);
    }, []);

    const onLogged = (c) => {
      setCandidato(c); setAttivaToken(null);
      try { window.history.replaceState({}, "", window.location.pathname); } catch (e) {}
      go("home");
    };
    const onEsci = () => { API.logout(); setCandidato(null); go("login"); };

    if (boot) return html`<div class="app"><div class="main"><${Spinner} /></div></div>`;
    if (attivaToken) return html`<div class="app"><${Attiva} token=${attivaToken} onLogged=${onLogged} /></div>`;
    if (!candidato) return html`<div class="app"><${Login} onLogged=${onLogged} /></div>`;
    if (candidato.ruolo === "admin") return html`<${AdminApp} candidato=${candidato} onEsci=${onEsci} />`;

    let view, tab = screen.name;
    if (screen.name === "home") view = html`<${Home} candidato=${candidato} go=${go} />`;
    else if (screen.name === "percorso") { view = html`<${Home} candidato=${candidato} go=${go} />`; tab = "percorso"; }
    else if (screen.name === "unita") { view = html`<${UnitaView} candidato=${candidato} unitaId=${screen.params.id} go=${go} />`; tab = "percorso"; }
    else if (screen.name === "esercizio") { view = html`<${Esercizio} candidato=${candidato} ...${screen.params} go=${go} />`; tab = "percorso"; }
    else if (screen.name === "progressi") view = html`<${Progressi} candidato=${candidato} go=${go} />`;
    else view = html`<${Home} candidato=${candidato} go=${go} />`;

    return html`<div class="app">${view}<${Nav} tab=${tab} go=${go} onEsci=${onEsci} /></div>`;
  }

  ReactDOM.createRoot(document.getElementById("root")).render(html`<${App} />`);
})();
