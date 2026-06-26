/* api.js — client autenticato verso il backend FastAPI.
   Espone window.API. Il token JWT è in localStorage. */
(function () {
  "use strict";

  const TOKEN_KEY = "prep_access_token";
  const REFRESH_KEY = "prep_refresh_token";
  // stesso host: il backend serve anche la PWA. In dev separato, cambiare qui.
  const BASE = "/api/v1";

  function getToken() { return localStorage.getItem(TOKEN_KEY); }
  function setTokens(access, refresh) {
    if (access) localStorage.setItem(TOKEN_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  }
  function clearTokens() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }

  async function request(path, { method = "GET", body, auth = true } = {}) {
    const headers = { "Content-Type": "application/json" };
    if (auth && getToken()) headers["Authorization"] = "Bearer " + getToken();
    let res;
    try {
      res = await fetch(BASE + path, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      throw { status: 0, detail: "Connessione assente. Controlla internet." };
    }
    if (res.status === 204) return null;
    let data = null;
    try { data = await res.json(); } catch (e) { data = null; }
    if (!res.ok) {
      throw { status: res.status, detail: (data && data.detail) || "Errore (" + res.status + ")" };
    }
    return data;
  }

  const API = {
    isLoggedIn() { return !!getToken(); },
    logout() { clearTokens(); },

    async login(email, password) {
      const data = await request("/auth/login", {
        method: "POST",
        auth: false,
        body: { email, password },
      });
      setTokens(data.access_token, data.refresh_token);
      return data.candidato;
    },

    async attiva(token, password) {
      const data = await request("/auth/attiva/" + encodeURIComponent(token), {
        method: "POST",
        auth: false,
        body: { password },
      });
      setTokens(data.access_token, data.refresh_token);
      return data.candidato;
    },

    me() { return request("/me"); },
    unita() { return request("/unita"); },
    unitaDettaglio(id) { return request("/unita/" + id); },
    esercizio(id) { return request("/esercizi/" + id); },
    inviaRisposta(id, risposta, durataSec) {
      return request("/esercizi/" + id + "/invia", {
        method: "POST",
        body: { risposta, durata_sec: durataSec || 0 },
      });
    },
    progressi() { return request("/me/progressi"); },
    statistiche() { return request("/me/statistiche"); },

    // --- Simulazione d'esame ---
    esameInizia() { return request("/esame/inizia", { method: "POST" }); },
    esameStato(id) { return request("/esame/sessione/" + id); },
    esameConsegna(id, risposte) {
      return request("/esame/sessione/" + id + "/consegna", { method: "POST", body: { risposte } });
    },
    esameReport(id) { return request("/esame/sessione/" + id + "/report"); },
    esameStorico() { return request("/esame/storico"); },

    // --- Admin ---
    adminStats() { return request("/admin/statistiche/globali"); },
    adminCandidati(livello) { return request("/admin/candidati" + (livello ? "?livello=" + livello : "")); },
    adminCrea(dati) { return request("/admin/candidati", { method: "POST", body: dati }); },
    adminRigenera(id) { return request("/admin/candidati/" + id + "/attivazione", { method: "POST" }); },
    adminElimina(id) { return request("/admin/candidati/" + id, { method: "DELETE" }); },
    async adminImport(file) {
      const fd = new FormData();
      fd.append("file", file);
      const headers = {};
      if (getToken()) headers["Authorization"] = "Bearer " + getToken();
      let res;
      try { res = await fetch(BASE + "/admin/candidati/import", { method: "POST", headers, body: fd }); }
      catch (e) { throw { status: 0, detail: "Connessione assente." }; }
      let data = null; try { data = await res.json(); } catch (e) {}
      if (!res.ok) throw { status: res.status, detail: (data && data.detail) || "Errore import" };
      return data;
    },
  };

  window.API = API;
})();
