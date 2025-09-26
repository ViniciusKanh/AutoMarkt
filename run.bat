@echo off
setlocal ENABLEDELAYEDEXPANSION

rem === Configurações ===
set "BACKEND_PORT=8000"
set "FRONTEND_PORT=8080"

rem === Ir para a pasta do script ===
cd /d "%~dp0"

rem === Verifica Python ===
python --version >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Python nao encontrado no PATH.
  echo Instale o Python 3.10+ e reabra o terminal.
  pause
  exit /b 1
)

rem === Prepara venv do backend, se faltar ===
if not exist "backend\.venv" (
  echo [SETUP] Criando venv do backend...
  python -m venv "backend\.venv"
)

echo [SETUP] Instalando dependencias do backend (se necessário)...
call "backend\.venv\Scripts\activate.bat"
python -m pip install --upgrade pip >nul
python -m pip install -r "backend\requirements.txt"
deactivate

rem === Aviso de portas ocupadas ===
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%BACKEND_PORT% " ^| findstr LISTENING') do set "PID_BACK=%%a"
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%FRONTEND_PORT% " ^| findstr LISTENING') do set "PID_FRONT=%%a"
if defined PID_BACK echo [AVISO] Porta %BACKEND_PORT% em uso por PID !PID_BACK!
if defined PID_FRONT echo [AVISO] Porta %FRONTEND_PORT% em uso por PID !PID_FRONT!

rem === Inicia Backend (nova janela) ===
start "AutoMarkt Backend" cmd /k ^
 "cd /d backend && call .venv\Scripts\activate.bat && uvicorn app:app --host 0.0.0.0 --port %BACKEND_PORT%"

rem === Pequeno atraso para o backend subir ===
timeout /t 2 >nul

rem === Inicia Frontend (nova janela) ===
start "AutoMarkt Frontend" cmd /k ^
 "cd /d frontend && python -m http.server %FRONTEND_PORT%"

rem === Abre o navegador no frontend ===
start "" "http://127.0.0.1:%FRONTEND_PORT%"

echo.
echo AutoMarkt em execucao.
echo Backend:  http://127.0.0.1:%BACKEND_PORT%
echo Frontend: http://127.0.0.1:%FRONTEND_PORT%
echo.
echo Pressione qualquer tecla para tentar encerrar servidores por porta...
pause >nul

rem === Encerrar por porta (best-effort) ===
call :killOnPort %BACKEND_PORT%
call :killOnPort %FRONTEND_PORT%

echo Encerrado (se processos persistirem, feche as janelas "AutoMarkt Backend" e "AutoMarkt Frontend").
endlocal
exit /b 0

:killOnPort
set "FOUND_PID="
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":%1 " ^| findstr LISTENING') do set "FOUND_PID=%%p"
if defined FOUND_PID (
  echo [STOP] Matando PID !FOUND_PID! (porta %1)...
  taskkill /PID !FOUND_PID! /F >nul 2>&1
) else (
  echo [STOP] Nada escutando na porta %1.
)
exit /b 0
