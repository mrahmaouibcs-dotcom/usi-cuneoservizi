@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
cd /d "%~dp0"

REM ============================================================
REM  Italiano Facile - avvio server locale (Windows)
REM  Doppio clic per avviare. CTRL+C per fermare.
REM ============================================================

REM --- Trova Python (python oppure py) ---
set "PY="
where python >nul 2>&1 && set "PY=python"
if not defined PY (
  where py >nul 2>&1 && set "PY=py"
)
if not defined PY (
  echo.
  echo  [!] Python non trovato.
  echo      Installalo da https://www.python.org/downloads/
  echo      e durante l'installazione spunta "Add Python to PATH".
  echo.
  pause
  exit /b 1
)

REM --- Trova l'indirizzo IP locale (per il telefono) ---
set "IP="
for /f "delims=" %%I in ('powershell -NoProfile -Command "Get-NetIPAddress -AddressFamily IPv4 ^| Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } ^| Select-Object -First 1 -ExpandProperty IPAddress" 2^>nul') do set "IP=%%I"

echo.
echo  ============================================
echo    Italiano Facile - server avviato
echo  ============================================
echo.
echo    Su questo PC:    http://localhost:8000
if defined IP (
  echo    Dal telefono:    http://!IP!:8000
) else (
  echo    Dal telefono:    http://INDIRIZZO-IP-DEL-PC:8000
)
echo.
echo    ^(il telefono deve essere sulla stessa Wi-Fi^)
echo    Premi CTRL+C per fermare il server.
echo  ============================================
echo.

REM --- Apre automaticamente il browser sul PC ---
start "" http://localhost:8000

REM --- Avvia il server ---
%PY% -m http.server 8000 --bind 0.0.0.0

echo.
echo  Server fermato.
pause
