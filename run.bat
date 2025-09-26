@echo off
setlocal
REM ===== Config =====
set "BACKEND_PORT=8000"
set "FRONTEND_PORT=8080"

REM Ir para a pasta do script
cd /d "%~dp0"

REM Escolhe Python da venv se existir; se não, usa o python do sistema
set "PY=python"
if exist "backend\.venv\Scripts\python.exe" set "PY=backend\.venv\Scripts\python.exe"

REM === Backend (uvicorn) em nova janela ===
start "AutoMarkt Backend" cmd /k ^
 "cd /d backend && %PY% -m uvicorn app:app --host 0.0.0.0 --port %BACKEND_PORT% --reload"

REM Pequeno atraso (2s) só para logs ficarem limpos
ping 127.0.0.1 -n 2 >nul

REM === Frontend (http.server) em nova janela ===
start "AutoMarkt Frontend" cmd /k ^
 "cd /d frontend && python -m http.server %FRONTEND_PORT%"

REM Abre o navegador no front
start "" "http://127.0.0.1:%FRONTEND_PORT%"

echo.
echo Backend : http://127.0.0.1:%BACKEND_PORT%
echo Frontend: http://127.0.0.1:%FRONTEND_PORT%
echo (Feche as janelas para encerrar.)
endlocal
