# Requires: PowerShell 5+ e Python 3.10+
$ErrorActionPreference = "Stop"

# === Config ===
$BACKEND_PORT  = 8000
$FRONTEND_PORT = 8080

# Ir para a pasta do script
Set-Location -Path $PSScriptRoot

# Checa Python
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
  Write-Error "[ERRO] Python nao encontrado no PATH. Instale Python 3.10+."
}

# venv backend
if (-not (Test-Path "backend\.venv")) {
  Write-Host "[SETUP] Criando venv do backend..."
  python -m venv "backend\.venv"
}

Write-Host "[SETUP] Instalando dependencias do backend (se necessario)..."
& "backend\.venv\Scripts\python.exe" -m pip install --upgrade pip | Out-Null
& "backend\.venv\Scripts\python.exe" -m pip install -r "backend\requirements.txt"

# Inicia processos
$backend = Start-Process -FilePath "backend\.venv\Scripts\python.exe" `
  -ArgumentList @("-m","uvicorn","app:app","--host","0.0.0.0","--port",$BACKEND_PORT) `
  -WorkingDirectory "backend" -PassThru

Start-Sleep -Seconds 2

$frontend = Start-Process -FilePath "python" `
  -ArgumentList @("-m","http.server",$FRONTEND_PORT) `
  -WorkingDirectory "frontend" -PassThru

Start-Process "http://127.0.0.1:$FRONTEND_PORT"

Write-Host ""
Write-Host "AutoMarkt rodando:"
Write-Host "  Backend : http://127.0.0.1:$BACKEND_PORT"
Write-Host "  Frontend: http://127.0.0.1:$FRONTEND_PORT"
Write-Host ""
Write-Host "Pressione ENTER para encerrar..."
[void][Console]::ReadLine()

# Encerrar limpo
if ($backend -and !$backend.HasExited) { Stop-Process -Id $backend.Id -Force }
if ($frontend -and !$frontend.HasExited) { Stop-Process -Id $frontend.Id -Force }
Write-Host "Encerrado."
