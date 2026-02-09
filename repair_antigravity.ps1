# Script de Reparación de Antigravity
# 1. Cierra Antigravity completamente.
# 2. Ejecuta este script desde una terminal de PowerShell externa.

$AppData = "$env:APPDATA\Antigravity"
$BackupDir = "C:\Users\novat\inmueble-advisor\.gemini\backups"

if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force
}

Write-Host "Realizando limpieza de estado..." -ForegroundColor Cyan

# Respaldar por seguridad
Copy-Item "$AppData\User\globalStorage\state.vscdb" "$BackupDir\state_global.vscdb.bak" -ErrorAction SilentlyContinue
Copy-Item "$AppData\User\workspaceStorage\0991aa05bbbc4838ca7fa3c4e306fdb1\state.vscdb" "$BackupDir\state_workspace.vscdb.bak" -ErrorAction SilentlyContinue

# Limpieza
Remove-Item "$AppData\User\globalStorage\state.vscdb*" -Force -ErrorAction SilentlyContinue
Remove-Item "$AppData\User\workspaceStorage\0991aa05bbbc4838ca7fa3c4e306fdb1\state.vscdb*" -Force -ErrorAction SilentlyContinue

Write-Host "PROCESO FINALIZADO. Ya puedes abrir Antigravity." -ForegroundColor White -BackgroundColor Green
