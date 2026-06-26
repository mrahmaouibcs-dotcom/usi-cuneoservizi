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
  };

  window.API = API;
})();
