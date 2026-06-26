# Italiano Facile — PWA

Progressive Web App per imparare l'italiano (livelli **A2** e **B1**),
installabile su Android e iOS come app nativa. Funziona **offline** dopo
il primo caricamento.

## Caratteristiche

- 📚 8 unità (4 A2 + 4 B1): vocabolario, grammatica con tabelle ed esercizi
- ✍️ Esercizi a scelta multipla, completamento frase e riordino parole
- ⭐ Flashcard 3D per il ripasso delle parole sbagliate
- 📊 Dashboard con progresso, streak e statistiche di sessione
- 📲 Installabile (PWA) + Service Worker per uso offline
- 🎨 Design mobile-first, palette ispirata alla campagna italiana

## Stack

Nessun build tool. React + ReactDOM + [htm](https://github.com/developit/htm)
caricati da CDN. Tutto il resto è vanilla HTML/CSS/JS.

## File

| File | Ruolo |
|------|-------|
| `index.html` | shell HTML + meta tag PWA |
| `app.js` | logica React (htm, no JSX/build) |
| `data.js` | contenuti didattici |
| `styles.css` | CSS mobile-first |
| `manifest.json` | manifest PWA |
| `sw.js` | Service Worker (cache-first, offline) |
| `icon.svg`, `icon-192.png`, `icon-512.png` | icone app |

## Come avviare

Serve un server (il Service Worker non funziona via `file://`):

```bash
cd italiano-facile
python3 -m http.server 8000
# apri http://localhost:8000
```

## Deploy su GitHub Pages

I percorsi sono **relativi**, quindi l'app funziona anche servita da una
sottocartella. Abilita GitHub Pages sulla cartella che contiene questi file.

> Nota: la prima visita richiede una connessione a internet per scaricare
> React e i font dalla CDN; dopodiché l'app è memorizzata e funziona offline.
