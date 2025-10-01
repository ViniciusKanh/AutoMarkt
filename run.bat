@echo off
setlocal EnableExtensions EnableDelayedExpansion
title AutoMarkt — runner (1 janela)

rem === Pastas absolutas, com aspas para espaços ===
set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%backend"
set "FRONTEND_DIR=%ROOT%frontend"

set "BACKEND_PORT=8000"
set "FRONTEND_PORT=8080"

rem === Escolhe Python: venv se existir; senão py; senão python ===
set "PY_EXE="
if exist "%BACKEND_DIR%\.venv\Scripts\python.exe" set "PY_EXE=%BACKEND_DIR%\.venv\Scripts\python.exe"
if not defined PY_EXE (
  where py >nul 2>&1 && (set "PY_EXE=py -3") || (
    where python >nul 2>&1 && (set "PY_EXE=python") || (
      echo [ERRO] Python 3 nao encontrado. Instale Python 3.10+.
      exit /b 1
    )
  )
)

rem === Sobe BACKEND em background na MESMA janela (/b) ===
pushd "%BACKEND_DIR%"
echo [BACKEND] Iniciando em http://127.0.0.1:%BACKEND_PORT% ...
start "" /b %PY_EXE% -m uvicorn app:app --host 127.0.0.1 --port %BACKEND_PORT% --reload
popd

rem pequeno atraso so pra logs ficarem legiveis
ping 127.0.0.1 -n 2 >nul

rem === Sobe FRONTEND em foreground na MESMA janela ===
pushd "%FRONTEND_DIR%"
echo [FRONTEND] Servindo em http://127.0.0.1:%FRONTEND_PORT%  (Ctrl+C para parar)
%PY_EXE% -m http.server %FRONTEND_PORT%
popd

echo [INFO] Encerrando... (backend sera finalizado ao fechar esta janela)
endlocal
