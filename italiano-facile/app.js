/* ============================================================================
   app.js — Logica React di "Italiano Facile"
   React + ReactDOM + htm caricati da CDN (nessun build tool).
   htm fornisce una sintassi tipo-JSX usando i template literals.
   ============================================================================ */

(function () {
  "use strict";

  const { useState, useEffect, useRef, useMemo } = React;
  const html = htm.bind(React.createElement);
  const DATA = window.APP_DATA;

  /* ---------------------------------------------------------------------- */
  /*  Stato iniziale                                                         */
  /* ---------------------------------------------------------------------- */
  const initialState = {
    currentLevel: null,          // 'A2' | 'B1'
    currentTab: "home",          // 'home' | 'lessons' | 'vocab' | 'profile'
    currentUnit: null,           // 0-3
    currentSection: null,        // 'vocab' | 'grammar' | 'exercises' | 'result'
    currentExerciseIndex: 0,
    unitProgress: {
      A2: [null, null, null, null],
      B1: [null, null, null, null]
    },
    wrongAnswers: [],            // [{word, translation, example, emoji, category}]
    sessionStats: { wordsStudied: 0, exercisesCompleted: 0, correctAnswers: 0 },
    exerciseAnswers: {},         // risposte dell'unità corrente { idx: {correct:bool} }
    streak: 1                    // contatore di sessione (in memoria)
  };

  /* ---------------------------------------------------------------------- */
  /*  Icone SVG (bottom nav)                                                 */
  /* ---------------------------------------------------------------------- */
  const Icon = {
    home: (p) => html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ...${p}><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/></svg>`,
    lessons: (p) => html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ...${p}><path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z"/><path d="M18 3v16"/><path d="M8 7h6M8 11h6"/></svg>`,
    vocab: (p) => html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ...${p}><path d="m12 3 2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z"/></svg>`,
    profile: (p) => html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ...${p}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6"/></svg>`,
    chevron: (p) => html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" ...${p}><path d="m9 6 6 6-6 6"/></svg>`,
    back: (p) => html`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" ...${p}><path d="m15 6-6 6 6 6"/></svg>`
  };

  const Flag = () => html`<span class="flag-chip" role="img" aria-label="bandiera italiana"></span>`;

  /* ---------------------------------------------------------------------- */
  /*  Sintesi vocale italiana (Web Speech API)                               */
  /* ---------------------------------------------------------------------- */
  const speechOK = typeof window !== "undefined" && "speechSynthesis" in window;

  function pickItalianVoice() {
    if (!speechOK) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    return (
      voices.find((v) => v.lang === "it-IT") ||
      voices.find((v) => v.lang && v.lang.toLowerCase().startsWith("it")) ||
      null
    );
  }

  // Pre-carica l'elenco voci (su alcuni browser è asincrono).
  function primeVoices() {
    if (!speechOK) return;
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }

  function speak(text) {
    if (!speechOK || !text) return;
    const synth = window.speechSynthesis;
    try {
      synth.cancel(); // interrompe eventuale pronuncia in corso
      const u = new SpeechSynthesisUtterance(String(text));
      u.lang = "it-IT";
      const v = pickItalianVoice();
      if (v) u.voice = v;
      u.rate = 0.95;
      u.pitch = 1;
      synth.speak(u);
    } catch (e) { /* ignora errori di sintesi */ }
  }

  const SpeakerIcon = (p) => html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ...${p}><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8 8 0 0 1 0 12"/></svg>`;

  // Pulsante 🔊 riutilizzabile. Non propaga il click (per non girare la flashcard).
  function SpeakButton({ text, label, variant }) {
    if (!speechOK) return null;
    const cls = "speak-btn" + (variant ? " speak-btn--" + variant : "");
    return html`
      <button type="button" class=${cls}
        aria-label=${label || ("Ascolta: " + text)} title="Ascolta"
        onClick=${(e) => { e.stopPropagation(); speak(text); }}>
        <${SpeakerIcon} />
      </button>`;
  }

  /* ---------------------------------------------------------------------- */
  /*  Helper                                                                 */
  /* ---------------------------------------------------------------------- */
  function starsFor(score, total) {
    const wrong = total - score;
    if (wrong <= 2) return 3;
    if (wrong <= 4) return 2;
    return 1;
  }
  function starString(n) { return "⭐".repeat(n) + "☆".repeat(3 - n); }

  function renderPromptWithBlank(text) {
    // Evidenzia "_____" come blank dorato
    const parts = text.split(/_{2,}/);
    if (parts.length === 1) return text;
    const out = [];
    parts.forEach((p, i) => {
      out.push(p);
      if (i < parts.length - 1) out.push(html`<span class="blank" key=${i}>______</span>`);
    });
    return out;
  }

  /* ---------------------------------------------------------------------- */
  /*  Header riutilizzabile                                                  */
  /* ---------------------------------------------------------------------- */
  function Header({ title, sub, level }) {
    return html`
      <header class="header">
        <div>
          <h1 class="header__title">${title}</h1>
          ${sub ? html`<p class="header__sub">${sub}</p>` : null}
        </div>
        <div style=${{ display: "flex", alignItems: "center", gap: "8px" }}>
          ${level ? html`<span class="badge">${level}</span>` : null}
          <${Flag} />
        </div>
      </header>`;
  }

  /* ---------------------------------------------------------------------- */
  /*  Selezione livello (onboarding)                                         */
  /* ---------------------------------------------------------------------- */
  function LevelSelect({ onPick }) {
    return html`
      <main class="app__main paper-bg fadein-view">
        <div style=${{ textAlign: "center", marginTop: "8vh" }}>
          <div style=${{ display: "flex", justifyContent: "center", marginBottom: "16px" }}><${Flag} /></div>
          <h1 class="header__title" style=${{ fontSize: "34px" }}>Italiano Facile</h1>
          <p style=${{ color: "var(--testo-light)", marginTop: "6px" }}>
            Impara l'italiano passo dopo passo.<br/>Scegli il tuo livello per iniziare.
          </p>
        </div>
        <div style=${{ marginTop: "32px" }}>
          ${["A2", "B1"].map((lv) => html`
            <button key=${lv} class="card" style=${{ width: "100%", textAlign: "left", cursor: "pointer", border: "none" }}
              onClick=${() => onPick(lv)}>
              <div style=${{ display: "flex", alignItems: "center", gap: "14px" }}>
                <span class="badge badge--green" style=${{ fontSize: "18px", padding: "10px 16px" }}>${lv}</span>
                <div>
                  <div style=${{ fontWeight: 700, fontSize: "17px" }}>Livello ${lv}</div>
                  <div style=${{ color: "var(--testo-light)", fontSize: "14px" }}>
                    ${lv === "A2" ? "Elementare — basi e vita quotidiana" : "Intermedio — comunicazione più ricca"}
                  </div>
                </div>
                <${Icon.chevron} style=${{ marginLeft: "auto", width: 22, height: 22, color: "var(--verde-salvia)" }} />
              </div>
            </button>`)}
        </div>
      </main>`;
  }

  /* ---------------------------------------------------------------------- */
  /*  HOME                                                                   */
  /* ---------------------------------------------------------------------- */
  function HomeView({ state, openUnit, goTab, installPrompt, onInstall, dismissInstall }) {
    const level = state.currentLevel;
    const units = DATA.LEVELS[level].units;
    const progress = state.unitProgress[level];
    const completed = progress.filter(Boolean).length;
    const pct = Math.round((completed / units.length) * 100);

    // Trova la prossima unità da fare (o l'ultima toccata)
    let resumeIdx = progress.findIndex((p) => !p);
    if (resumeIdx === -1) resumeIdx = 0;
    const resumeUnit = units[resumeIdx];

    return html`
      <main class="app__main paper-bg fadein-view">
        <${Header} title=${html`Ciao! 🇮🇹`} sub=${"Bentornato/a"} level=${level} />

        ${installPrompt ? html`
          <div class="install-banner">
            <p>Installa l'app sul telefono per usarla offline.</p>
            <button class="btn btn--primary" onClick=${onInstall}>Installa</button>
            <button class="install-banner__close" aria-label="chiudi" onClick=${dismissInstall}>×</button>
          </div>` : null}

        <div class="card card--hero">
          <h2>Continua a imparare</h2>
          <p>${completed >= units.length ? "Hai completato tutte le unità! 🎉" : `Unità ${resumeIdx + 1}: ${resumeUnit.title}`}</p>
          <button class="btn btn--primary" onClick=${() => openUnit(resumeIdx)}>
            ${resumeUnit.emoji}  ${completed >= units.length ? "Ripassa" : "Continua"}
          </button>
        </div>

        <div class="card">
          <div style=${{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <strong>Progresso</strong>
            <span class="badge badge--green">${completed}/${units.length} unità</span>
          </div>
          <div class="progress"><div class="progress__fill" style=${{ width: pct + "%" }}></div></div>
          <p class="progress-label">${pct}% del livello ${level} completato</p>
        </div>

        <div class="card" style=${{ display: "flex", alignItems: "center", gap: "14px" }}>
          <span style=${{ fontSize: "30px" }}>🔥</span>
          <div>
            <div style=${{ fontWeight: 700, fontSize: "18px" }}>${state.streak} ${state.streak === 1 ? "giorno" : "giorni"} di fila</div>
            <div style=${{ color: "var(--testo-light)", fontSize: "13px" }}>Continua così, non perdere lo streak!</div>
          </div>
        </div>

        <div class="card-row">
          <div class="card stat-card">
            <div class="stat-card__emoji">📖</div>
            <div class="stat-card__num">${state.sessionStats.wordsStudied}</div>
            <div class="stat-card__label">Parole studiate oggi</div>
          </div>
          <div class="card stat-card">
            <div class="stat-card__emoji">✏️</div>
            <div class="stat-card__num">${state.sessionStats.exercisesCompleted}</div>
            <div class="stat-card__label">Esercizi completati</div>
          </div>
        </div>

        <button class="btn btn--outline btn--block" style=${{ marginTop: "6px" }} onClick=${() => goTab("lessons")}>
          Vai alle lezioni
        </button>
      </main>`;
  }

  /* ---------------------------------------------------------------------- */
  /*  LISTA LEZIONI                                                          */
  /* ---------------------------------------------------------------------- */
  function LessonsView({ state, openUnit }) {
    const level = state.currentLevel;
    const units = DATA.LEVELS[level].units;
    const progress = state.unitProgress[level];

    return html`
      <main class="app__main paper-bg fadein-view">
        <${Header} title=${"Lezioni"} sub=${`Livello ${level} — ${DATA.LEVELS[level].name}`} level=${level} />
        ${units.map((u, i) => {
          const p = progress[i];
          return html`
            <button key=${i} class="lesson-item" onClick=${() => openUnit(i)}>
              <span class="lesson-item__emoji">${u.emoji}</span>
              <span class="lesson-item__body">
                <span class="lesson-item__title">${i + 1}. ${u.title}</span>
                <span class="lesson-item__sub">${u.subtitle}</span>
              </span>
              ${p
                ? html`<span class="lesson-item__stars">${starString(p.stars)}</span>`
                : html`<${Icon.chevron} class="lesson-item__chevron" />`}
            </button>`;
        })}
      </main>`;
  }

  /* ---------------------------------------------------------------------- */
  /*  Flashcard 3D (riusata in unità-vocab e ripasso)                        */
  /* ---------------------------------------------------------------------- */
  function FlashDeck({ cards, onAdvance }) {
    const [idx, setIdx] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const touch = useRef(null);

    useEffect(() => { setFlipped(false); }, [idx]);

    if (!cards.length) {
      return html`
        <div class="empty-state">
          <div class="empty-state__emoji">🎉</div>
          <p>Nessuna parola da ripassare!<br/>Completa le unità per trovare qui le parole sbagliate.</p>
        </div>`;
    }

    const card = cards[idx];
    const go = (dir) => {
      const next = idx + dir;
      if (next >= 0 && next < cards.length) {
        setIdx(next);
        if (dir > 0 && onAdvance) onAdvance();
      }
    };
    const onTouchStart = (e) => { touch.current = e.changedTouches[0].clientX; };
    const onTouchEnd = (e) => {
      if (touch.current == null) return;
      const dx = e.changedTouches[0].clientX - touch.current;
      if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      touch.current = null;
    };

    return html`
      <div class="flash-area">
        <div class=${"flash" + (flipped ? " flash--flipped" : "")}
             onClick=${() => setFlipped((f) => !f)}
             onTouchStart=${onTouchStart} onTouchEnd=${onTouchEnd}>
          <div class="flash__inner">
            <div class="flash__face flash__face--front">
              <div class="flash__emoji">${card.emoji || "📘"}</div>
              <div class="flash__word">${card.it || card.word}</div>
              <${SpeakButton} text=${card.it || card.word} label="Ascolta la parola" variant="big" />
              ${card.category ? html`<div class="flash__cat">${card.category}</div>` : null}
              <div class="flash__hint">Tocca per girare ↻</div>
            </div>
            <div class="flash__face flash__face--back">
              <div class="flash__translation">${card.en || card.translation}</div>
              ${(card.example) ? html`<div class="flash__example">“${card.example}”</div>` : null}
              ${(card.example) ? html`<${SpeakButton} text=${card.example} label="Ascolta la frase" variant="ondark" />` : null}
              <div class="flash__hint" style=${{ color: "rgba(255,255,255,0.7)" }}>Tocca per girare ↻</div>
            </div>
          </div>
        </div>
        <div class="flash-nav">
          <button class="flash-nav__btn" onClick=${() => go(-1)} disabled=${idx === 0} aria-label="precedente">‹</button>
          <span class="flash-counter">${idx + 1} / ${cards.length}</span>
          <button class="flash-nav__btn" onClick=${() => go(1)} disabled=${idx === cards.length - 1} aria-label="successiva">›</button>
        </div>
      </div>`;
  }

  /* ---------------------------------------------------------------------- */
  /*  VOCABOLARIO (tab ripasso)                                              */
  /* ---------------------------------------------------------------------- */
  function VocabView({ state, level }) {
    // deduplica per parola
    const seen = {};
    const cards = state.wrongAnswers.filter((w) => {
      const k = (w.it || w.word) + "|" + (w.en || w.translation);
      if (seen[k]) return false; seen[k] = true; return true;
    });
    return html`
      <main class="app__main paper-bg fadein-view">
        <${Header} title=${"Vocabolario"} sub=${"Ripassa le parole sbagliate"} level=${level} />
        ${cards.length ? html`
          <p class="progress-label" style=${{ marginBottom: "12px" }}>
            ${cards.length} ${cards.length === 1 ? "parola" : "parole"} da ripassare. Scorri o tocca per girare.
          </p>` : null}
        <${FlashDeck} cards=${cards} />
      </main>`;
  }

  /* ---------------------------------------------------------------------- */
  /*  PROFILO                                                                */
  /* ---------------------------------------------------------------------- */
  function ProfileView({ state, setLevel, resetProgress }) {
    const level = state.currentLevel;
    const totalUnits = DATA.LEVELS.A2.units.length + DATA.LEVELS.B1.units.length;
    const doneUnits = state.unitProgress.A2.filter(Boolean).length + state.unitProgress.B1.filter(Boolean).length;

    return html`
      <main class="app__main paper-bg fadein-view">
        <${Header} title=${"Profilo"} sub=${"Le tue impostazioni"} level=${level} />

        <div class="card">
          <strong style=${{ display: "block", marginBottom: "12px" }}>Livello attivo</strong>
          <div class="level-switch">
            ${["A2", "B1"].map((lv) => html`
              <button key=${lv} class=${lv === level ? "active" : ""} onClick=${() => setLevel(lv)}>${lv}</button>`)}
          </div>
        </div>

        <div class="card">
          <strong style=${{ display: "block", marginBottom: "6px" }}>Statistiche di sessione</strong>
          <div class="profile-row"><span>Parole studiate</span><strong>${state.sessionStats.wordsStudied}</strong></div>
          <div class="profile-row"><span>Esercizi completati</span><strong>${state.sessionStats.exercisesCompleted}</strong></div>
          <div class="profile-row"><span>Risposte corrette</span><strong>${state.sessionStats.correctAnswers}</strong></div>
          <div class="profile-row"><span>Unità completate</span><strong>${doneUnits}/${totalUnits}</strong></div>
          <div class="profile-row"><span>Streak</span><strong>🔥 ${state.streak}</strong></div>
          <div class="profile-row"><span>Parole da ripassare</span><strong>${state.wrongAnswers.length}</strong></div>
        </div>

        <button class="btn btn--block" style=${{ background: "var(--rosso-soft)", color: "var(--rosso-mattone)", marginTop: "4px" }}
          onClick=${resetProgress}>
          Azzera i progressi
        </button>
        <p class="progress-label" style=${{ textAlign: "center", marginTop: "16px" }}>
          Italiano Facile · PWA offline · v1
        </p>
      </main>`;
  }

  /* ---------------------------------------------------------------------- */
  /*  ESERCIZIO: scelta multipla / completa                                  */
  /* ---------------------------------------------------------------------- */
  function MultipleChoice({ ex, onAnswer }) {
    const [picked, setPicked] = useState(null);
    const answered = picked !== null;

    const choose = (i) => {
      if (answered) return;
      setPicked(i);
      onAnswer(i === ex.answer);
    };

    return html`
      <div>
        <p class="exercise-prompt">${renderPromptWithBlank(ex.prompt)}</p>
        <div class="options">
          ${ex.options.map((opt, i) => {
            let cls = "option";
            if (answered) {
              if (i === ex.answer) cls += " option--correct";
              else if (i === picked) cls += " option--wrong";
              else cls += " option--muted";
            }
            return html`
              <button key=${i} class=${cls} disabled=${answered} onClick=${() => choose(i)}>
                <span>${opt}</span>
                ${answered && i === ex.answer ? html`<span class="option__mark">✓</span>` : null}
                ${answered && i === picked && i !== ex.answer ? html`<span class="option__mark">✕</span>` : null}
              </button>`;
          })}
        </div>
        ${answered ? html`
          <div class=${"feedback " + (picked === ex.answer ? "feedback--ok" : "feedback--no")}>
            <div class="feedback__title">${picked === ex.answer ? "Corretto! 🎉" : "Non proprio…"}</div>
            ${picked !== ex.answer ? html`<div style=${{ marginBottom: "4px" }}>Risposta giusta: <strong>${ex.options[ex.answer]}</strong></div>` : null}
            <div>${ex.explanation}</div>
          </div>` : null}
      </div>`;
  }

  /* ---------------------------------------------------------------------- */
  /*  ESERCIZIO: riordina le parole                                          */
  /* ---------------------------------------------------------------------- */
  function Reorder({ ex, onAnswer }) {
    // pool con id stabili
    const initialPool = useMemo(
      () => ex.words.map((w, i) => ({ id: i, w })),
      [ex]
    );
    const [pool, setPool] = useState(initialPool);
    const [answer, setAnswer] = useState([]);
    const [checked, setChecked] = useState(false);
    const [correct, setCorrect] = useState(false);

    useEffect(() => { setPool(initialPool); setAnswer([]); setChecked(false); setCorrect(false); }, [initialPool]);

    const toAnswer = (item) => {
      if (checked) return;
      setPool((p) => p.filter((x) => x.id !== item.id));
      setAnswer((a) => [...a, item]);
    };
    const toPool = (item) => {
      if (checked) return;
      setAnswer((a) => a.filter((x) => x.id !== item.id));
      setPool((p) => [...p, item]);
    };

    const normalize = (s) => s.toLowerCase().replace(/[.?!,]/g, "").replace(/\s+/g, " ").trim();
    const check = () => {
      const built = answer.map((x) => x.w).join(" ");
      const ok = normalize(built) === normalize(ex.solution);
      setChecked(true);
      setCorrect(ok);
      onAnswer(ok);
    };

    return html`
      <div>
        <p class="exercise-prompt">${ex.prompt}</p>

        <div class="reorder-answer">
          ${answer.map((item) => html`
            <button key=${item.id}
              class=${"chip chip--in-answer" + (checked ? (correct ? " chip--correct" : " chip--wrong") : "")}
              onClick=${() => toPool(item)}>${item.w}</button>`)}
        </div>

        <div class="reorder-pool">
          ${pool.map((item) => html`
            <button key=${item.id} class="chip" onClick=${() => toAnswer(item)}>${item.w}</button>`)}
        </div>

        ${!checked ? html`
          <button class="btn btn--green btn--block" disabled=${answer.length === 0} onClick=${check}>Controlla</button>
        ` : html`
          <div class=${"feedback " + (correct ? "feedback--ok" : "feedback--no")}>
            <div class="feedback__title">${correct ? "Perfetto! 🎉" : "Quasi…"}</div>
            <div>Soluzione: <strong>${ex.solution}</strong></div>
            <div style=${{ marginTop: "4px" }}>${ex.explanation}</div>
          </div>`}
      </div>`;
  }

  /* ---------------------------------------------------------------------- */
  /*  SCHERMATA UNITÀ (vocab → grammar → exercises → result)                 */
  /* ---------------------------------------------------------------------- */
  function UnitScreen({ state, dispatch }) {
    const level = state.currentLevel;
    const unit = DATA.LEVELS[level].units[state.currentUnit];
    const section = state.currentSection;
    const exTotal = unit.exercises.length;

    const dotState = (name) => {
      const order = ["vocab", "grammar", "exercises"];
      const cur = order.indexOf(section === "result" ? "exercises" : section);
      const idx = order.indexOf(name);
      if (section === "result" && name === "exercises") return "done";
      if (idx < cur) return "done";
      if (idx === cur) return "active";
      return "";
    };

    const Dots = () => html`
      <div class="dots">
        <span class=${"dot dot--" + dotState("vocab")}><span class="dot__mark"></span>Vocabolario</span>
        <span class="dot__arrow">→</span>
        <span class=${"dot dot--" + dotState("grammar")}><span class="dot__mark"></span>Grammatica</span>
        <span class="dot__arrow">→</span>
        <span class=${"dot dot--" + dotState("exercises")}><span class="dot__mark"></span>Esercizi</span>
      </div>`;

    const back = () => dispatch({ type: "closeUnit" });

    /* ---- Sezione VOCAB ---- */
    if (section === "vocab") {
      return html`
        <main class="app__main paper-bg fadein-view">
          <button class="back-link" onClick=${back}><${Icon.back} /> Lezioni</button>
          <${Header} title=${unit.title} sub=${"1. Vocabolario"} level=${level} />
          <${Dots} />
          <div class="table-wrap" style=${{ background: "transparent", boxShadow: "none" }}>
            <div class="card" style=${{ marginBottom: 0 }}>
              ${unit.vocab.map((v, i) => html`
                <div class="vocab-row" key=${i}>
                  <span class="vocab-row__emoji">${v.emoji}</span>
                  <span style=${{ flex: 1 }}>
                    <span class="vocab-row__it">${v.it}</span> — <span class="vocab-row__en">${v.en}</span>
                    <span class="vocab-row__cat" style=${{ display: "block" }}>${v.category} · “${v.example}”</span>
                  </span>
                  <${SpeakButton} text=${v.it} label=${"Ascolta " + v.it} />
                </div>`)}
            </div>
          </div>
          <button class="btn btn--green btn--block" style=${{ marginTop: "18px" }}
            onClick=${() => dispatch({ type: "studiedVocab", count: unit.vocab.length, section: "grammar" })}>
            Continua → Grammatica
          </button>
        </main>`;
    }

    /* ---- Sezione GRAMMAR ---- */
    if (section === "grammar") {
      const g = unit.grammar;
      return html`
        <main class="app__main paper-bg fadein-view">
          <button class="back-link" onClick=${back}><${Icon.back} /> Lezioni</button>
          <${Header} title=${unit.title} sub=${"2. Grammatica"} level=${level} />
          <${Dots} />
          <h3 class="section-title" style=${{ marginTop: "4px" }}>${g.title}</h3>
          <div class="grammar-explain">${g.explanation}</div>
          <div class="table-wrap">
            <table class="gram">
              <thead><tr>${g.table.headers.map((h, i) => html`<th key=${i}>${h}</th>`)}</tr></thead>
              <tbody>
                ${g.table.rows.map((row, ri) => html`
                  <tr key=${ri}>${row.map((c, ci) => html`<td key=${ci}>${c}</td>`)}</tr>`)}
              </tbody>
            </table>
          </div>
          <button class="btn btn--green btn--block" style=${{ marginTop: "18px" }}
            onClick=${() => dispatch({ type: "goSection", section: "exercises", exIndex: 0 })}>
            Inizia gli esercizi →
          </button>
        </main>`;
    }

    /* ---- Sezione EXERCISES ---- */
    if (section === "exercises") {
      const i = state.currentExerciseIndex;
      const ex = unit.exercises[i];
      const answered = state.exerciseAnswers[i] !== undefined;
      const isLast = i === exTotal - 1;
      const pct = Math.round(((i + (answered ? 1 : 0)) / exTotal) * 100);

      const handleAnswer = (ok) => dispatch({ type: "answerExercise", index: i, correct: ok, exercise: ex });
      const next = () => {
        if (isLast) dispatch({ type: "finishUnit" });
        else dispatch({ type: "goSection", section: "exercises", exIndex: i + 1 });
      };

      return html`
        <main class="app__main paper-bg fadein-view">
          <button class="back-link" onClick=${back}><${Icon.back} /> Lezioni</button>
          <${Header} title=${unit.title} sub=${"3. Esercizi"} level=${level} />
          <div class="progress" style=${{ marginBottom: "6px" }}>
            <div class="progress__fill progress__fill--green" style=${{ width: pct + "%" }}></div>
          </div>
          <p class="progress-label" style=${{ marginBottom: "16px" }}>Esercizio ${i + 1} di ${exTotal}</p>

          ${ex.type === "reorder"
            ? html`<${Reorder} key=${i} ex=${ex} onAnswer=${handleAnswer} />`
            : html`<${MultipleChoice} key=${i} ex=${ex} onAnswer=${handleAnswer} />`}

          ${answered ? html`
            <button class="btn btn--primary btn--block" style=${{ marginTop: "20px" }} onClick=${next}>
              ${isLast ? "Vedi risultato" : "Avanti →"}
            </button>` : null}
        </main>`;
    }

    /* ---- Sezione RESULT ---- */
    if (section === "result") {
      const answers = state.exerciseAnswers;
      const score = Object.values(answers).filter((a) => a && a.correct).length;
      const stars = starsFor(score, exTotal);
      const wrongList = unit.exercises.filter((ex, idx) => answers[idx] && !answers[idx].correct);
      const msg = stars === 3 ? "Eccellente!" : stars === 2 ? "Bel lavoro!" : "Continua a esercitarti!";
      const hasNext = state.currentUnit < DATA.LEVELS[level].units.length - 1;

      return html`
        <main class="app__main paper-bg fadein-view">
          <${Header} title=${"Risultato"} sub=${unit.title} level=${level} />
          <div class="result">
            <div class="result__score">${score}/${exTotal}</div>
            <div class="result__stars">${starString(stars)}</div>
            <p class="result__msg">${msg}</p>

            ${wrongList.length ? html`
              <div class="card review-list">
                <h4>Da ripassare (${wrongList.length})</h4>
                ${wrongList.map((ex, k) => html`
                  <div key=${k} class="vocab-row">
                    <span class="vocab-row__emoji">📝</span>
                    <span style=${{ flex: 1 }}>
                      <span class="vocab-row__it">${ex.solution || ex.options[ex.answer]}</span>
                      <span class="vocab-row__cat" style=${{ display: "block" }}>${ex.explanation}</span>
                    </span>
                  </div>`)}
              </div>` : html`
              <div class="card" style=${{ color: "var(--verde-bosco)" }}>Nessun errore. Perfetto! 🌟</div>`}

            <button class="btn btn--green btn--block" style=${{ marginTop: "8px" }}
              onClick=${() => dispatch({ type: "retryUnit" })}>Riprova</button>
            ${hasNext ? html`
              <button class="btn btn--primary btn--block" style=${{ marginTop: "12px" }}
                onClick=${() => dispatch({ type: "openUnit", unit: state.currentUnit + 1 })}>Prossima unità →</button>
            ` : html`
              <button class="btn btn--outline btn--block" style=${{ marginTop: "12px" }}
                onClick=${() => dispatch({ type: "closeUnit" })}>Torna alle lezioni</button>`}
          </div>
        </main>`;
    }

    return null;
  }

  /* ---------------------------------------------------------------------- */
  /*  Bottom navigation                                                      */
  /* ---------------------------------------------------------------------- */
  function BottomNav({ tab, onTab }) {
    const items = [
      { key: "home", label: "Home", icon: Icon.home },
      { key: "lessons", label: "Lezioni", icon: Icon.lessons },
      { key: "vocab", label: "Vocabolario", icon: Icon.vocab },
      { key: "profile", label: "Profilo", icon: Icon.profile }
    ];
    return html`
      <nav class="bottom-nav">
        ${items.map((it) => html`
          <button key=${it.key} class=${"nav-btn" + (tab === it.key ? " active" : "")} onClick=${() => onTab(it.key)}>
            ${tab === it.key ? html`<span class="nav-btn__dot"></span>` : null}
            <${it.icon} />
            <span>${it.label}</span>
          </button>`)}
      </nav>`;
  }

  /* ---------------------------------------------------------------------- */
  /*  APP root + riduttore di stato                                          */
  /* ---------------------------------------------------------------------- */
  function App() {
    const [state, setState] = useState(initialState);
    const [installPrompt, setInstallPrompt] = useState(null);

    // beforeinstallprompt (Android/Chrome)
    useEffect(() => {
      const onBip = (e) => { e.preventDefault(); setInstallPrompt(e); };
      window.addEventListener("beforeinstallprompt", onBip);
      return () => window.removeEventListener("beforeinstallprompt", onBip);
    }, []);

    // Pre-carica le voci per la sintesi vocale italiana
    useEffect(() => { primeVoices(); }, []);

    function dispatch(action) {
      setState((s) => reducer(s, action));
    }

    function reducer(s, a) {
      switch (a.type) {
        case "setLevel":
          return { ...s, currentLevel: a.level };
        case "setTab":
          return { ...s, currentTab: a.tab, currentUnit: null, currentSection: null };
        case "openUnit":
          return { ...s, currentUnit: a.unit, currentSection: "vocab", currentExerciseIndex: 0, exerciseAnswers: {} };
        case "closeUnit":
          return { ...s, currentUnit: null, currentSection: null, currentTab: "lessons" };
        case "goSection":
          return { ...s, currentSection: a.section, currentExerciseIndex: a.exIndex != null ? a.exIndex : s.currentExerciseIndex };
        case "studiedVocab":
          return {
            ...s,
            currentSection: a.section,
            sessionStats: { ...s.sessionStats, wordsStudied: s.sessionStats.wordsStudied + a.count }
          };
        case "answerExercise": {
          const answers = { ...s.exerciseAnswers, [a.index]: { correct: a.correct } };
          let wrong = s.wrongAnswers;
          if (!a.correct) {
            const ex = a.exercise;
            const item = {
              word: ex.solution || (ex.options ? ex.options[ex.answer] : ""),
              translation: ex.explanation,
              example: ex.prompt,
              emoji: "📝",
              category: "da ripassare"
            };
            wrong = [...s.wrongAnswers, item];
          }
          return {
            ...s,
            exerciseAnswers: answers,
            wrongAnswers: wrong,
            sessionStats: {
              ...s.sessionStats,
              exercisesCompleted: s.sessionStats.exercisesCompleted + 1,
              correctAnswers: s.sessionStats.correctAnswers + (a.correct ? 1 : 0)
            }
          };
        }
        case "finishUnit": {
          const level = s.currentLevel;
          const unit = DATA.LEVELS[level].units[s.currentUnit];
          const total = unit.exercises.length;
          const score = Object.values(s.exerciseAnswers).filter((x) => x && x.correct).length;
          const stars = starsFor(score, total);
          const progress = { ...s.unitProgress };
          const arr = progress[level].slice();
          arr[s.currentUnit] = { score, total, stars, completed: true };
          progress[level] = arr;
          return { ...s, unitProgress: progress, currentSection: "result" };
        }
        case "retryUnit":
          return { ...s, currentSection: "vocab", currentExerciseIndex: 0, exerciseAnswers: {} };
        case "resetProgress":
          return {
            ...initialState,
            currentLevel: s.currentLevel,
            currentTab: "profile",
            streak: s.streak
          };
        default:
          return s;
      }
    }

    const onInstall = async () => {
      if (!installPrompt) return;
      installPrompt.prompt();
      try { await installPrompt.userChoice; } catch (e) {}
      setInstallPrompt(null);
    };

    /* ---- Render ---- */
    if (!state.currentLevel) {
      return html`
        <div class="app">
          <${LevelSelect} onPick=${(lv) => dispatch({ type: "setLevel", level: lv })} />
        </div>`;
    }

    // In un'unità aperta
    if (state.currentUnit !== null && state.currentSection) {
      return html`
        <div class="app">
          <${UnitScreen} state=${state} dispatch=${dispatch} />
          <${BottomNav} tab=${state.currentTab} onTab=${(t) => dispatch({ type: "setTab", tab: t })} />
        </div>`;
    }

    let view;
    if (state.currentTab === "home")
      view = html`<${HomeView} state=${state}
        openUnit=${(i) => dispatch({ type: "openUnit", unit: i })}
        goTab=${(t) => dispatch({ type: "setTab", tab: t })}
        installPrompt=${installPrompt} onInstall=${onInstall}
        dismissInstall=${() => setInstallPrompt(null)} />`;
    else if (state.currentTab === "lessons")
      view = html`<${LessonsView} state=${state} openUnit=${(i) => dispatch({ type: "openUnit", unit: i })} />`;
    else if (state.currentTab === "vocab")
      view = html`<${VocabView} state=${state} level=${state.currentLevel} />`;
    else
      view = html`<${ProfileView} state=${state}
        setLevel=${(lv) => dispatch({ type: "setLevel", level: lv })}
        resetProgress=${() => dispatch({ type: "resetProgress" })} />`;

    return html`
      <div class="app">
        ${view}
        <${BottomNav} tab=${state.currentTab} onTab=${(t) => dispatch({ type: "setTab", tab: t })} />
      </div>`;
  }

  ReactDOM.createRoot(document.getElementById("root")).render(html`<${App} />`);
})();
