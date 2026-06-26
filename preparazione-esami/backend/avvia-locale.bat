@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

REM ============================================================
REM  Preparazione Esami - avvio locale (Windows, SQLite)
REM  Doppio clic per avviare. CTRL+C per fermare.
REM ============================================================

REM --- Trova Python ---
set "PY="
where py >nul 2>&1 && set "PY=py"
if not defined PY ( where python >nul 2>&1 && set "PY=python" )
if not defined PY (
  echo.
  echo  [!] Python non trovato. Installalo da https://www.python.org/downloads/
  echo      e durante l'installazione spunta "Add python.exe to PATH".
  echo.
  pause
  exit /b 1
)

REM --- Crea l'ambiente virtuale alla prima esecuzione ---
if not exist ".venv\Scripts\python.exe" (
  echo  Creazione ambiente virtuale ^(solo la prima volta^)...
  %PY% -m venv .venv
)
set "VPY=.venv\Scripts\python.exe"

REM --- Installa le dipendenze ---
echo  Installazione dipendenze ^(la prima volta puo' richiedere qualche minuto^)...
"%VPY%" -m pip install --upgrade pip >nul 2>&1
"%VPY%" -m pip install -r requirements.txt
if errorlevel 1 (
  echo.
  echo  [!] Errore nell'installazione delle dipendenze. Controlla la connessione internet.
  pause
  exit /b 1
)

REM --- Configurazione locale (SQLite + admin di prova) ---
set "DATABASE_URL=sqlite+aiosqlite:///./dev.db"
set "ADMIN_EMAIL=admin@scuola.it"
set "ADMIN_PASSWORD=admin12345"
set "FRONTEND_BASE_URL=http://localhost:8000"
set "SECRET_KEY=chiave-di-prova-solo-locale"

REM --- Inizializza il database (tabelle + contenuti + admin) ---
echo  Preparazione database...
"%VPY%" -m scripts.init_db

echo.
echo  ============================================
echo    App pronta:  http://localhost:8000
echo.
echo    Accesso amministratore:
echo      email:    admin@scuola.it
echo      password: admin12345
echo  ============================================
echo    Premi CTRL+C per fermare il server.
echo  ============================================
echo.

start "" http://localhost:8000
"%VPY%" -m uvicorn app.main:app --host 127.0.0.1 --port 8000

echo.
echo  Server fermato.
pause
