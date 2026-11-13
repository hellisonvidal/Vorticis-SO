<#
.SYNOPSIS
  Instala o Vorticis SO a partir do Windows, sem pen-drive.

.DESCRIPTION
  1. Verifica UEFI, privilégios e espaço livre.
  2. Baixa a ISO do Vorticis e confere o SHA-256.
  3. Reduz a partição C: e cria uma pequena partição FAT32 "VORTICIS" (6 GB) com
     o conteúdo da ISO (é o "pen-drive interno").
  4. Cria uma entrada de boot UEFI e agenda UM boot no Vorticis.
  5. Ao reiniciar, o Vorticis abre em modo live; o instalador gráfico usa o
     espaço livre reservado para a instalação definitiva, ao lado do Windows.

  Nenhum arquivo do Windows é apagado. Faça backup mesmo assim.

.PARAMETER EspacoGB
  Espaço (GB) a liberar do C: para o Vorticis, além dos 6 GB do instalador. Padrão: 60.

.PARAMETER Iso
  Usa uma ISO já baixada.

.PARAMETER Simular
  Apenas mostra o que seria feito.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\Instalar-Vorticis.ps1 -EspacoGB 80
#>
[CmdletBinding()]
param(
  [int]$EspacoGB = 60,
  [string]$Iso,
  [string]$Url = "https://github.com/hellisonvidal/Vorticis-SO/releases/download/v0.2/vorticis-0.2-amd64.iso",
  [switch]$Simular
)

$ErrorActionPreference = "Stop"
try { $Host.UI.RawUI.WindowTitle = "Instalador do Vorticis SO" } catch { }
Write-Host ""
Write-Host "   ((@))   Vorticis SO — instalador para Windows" -ForegroundColor Cyan
Write-Host "    ~~~    leve, bonito e seu" -ForegroundColor DarkCyan
Write-Host ""
$TamanhoInstaladorGB = 6

function Info($t)  { Write-Host "» $t" -ForegroundColor Cyan }
function Falha($t) { Write-Host "✘ $t" -ForegroundColor Red; exit 1 }
function Executar([string]$descricao, [scriptblock]$acao) {
  if ($Simular) { Write-Host "[simulação] $descricao" -ForegroundColor Yellow }
  else { Info $descricao; & $acao }
}

# ---------- 1. Verificações ----------
$admin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
  [Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $admin -and -not $Simular) { Falha "Execute o PowerShell como Administrador." }

try { $null = Get-SecureBootUEFI -Name SetupMode -ErrorAction Stop; $uefi = $true }
catch [System.PlatformNotSupportedException] { $uefi = $false }
catch { $uefi = $true }  # UEFI presente, mas sem permissão de leitura
if (-not $uefi) { Falha "Este instalador exige UEFI. Em computadores BIOS/Legacy, use um pen-drive." }

$bitlocker = Get-BitLockerVolume -MountPoint "C:" -ErrorAction SilentlyContinue
if ($bitlocker -and $bitlocker.ProtectionStatus -eq "On") {
  Write-Warning "BitLocker está ativo em C:. Tenha a CHAVE DE RECUPERAÇÃO em mãos antes de continuar."
  Write-Warning "Ela pode ser pedida no próximo boot do Windows (aka.ms/myrecoverykey)."
}

$particaoC = Get-Partition -DriveLetter C
$suporte = Get-PartitionSupportedSize -DriveLetter C
$reduzirBytes = [int64]($EspacoGB + $TamanhoInstaladorGB) * 1GB
$novoTamanho = $particaoC.Size - $reduzirBytes
if ($novoTamanho -lt $suporte.SizeMin) {
  $maxGB = [math]::Floor(($particaoC.Size - $suporte.SizeMin) / 1GB) - $TamanhoInstaladorGB
  Falha "Não há espaço suficiente para reduzir C:. Máximo possível agora: $maxGB GB (rode a Limpeza de Disco e desfragmente)."
}

# ---------- 2. ISO ----------
if (-not $Iso) {
  $Iso = Join-Path $env:TEMP "vorticis.iso"
  Executar "Baixar $Url" {
    Start-BitsTransfer -Source $Url -Destination $Iso -DisplayName "Vorticis SO"
    Start-BitsTransfer -Source "$Url.sha256" -Destination "$Iso.sha256"
  }
  if (-not $Simular) {
    $esperado = (Get-Content "$Iso.sha256").Split(" ")[0].Trim().ToLower()
    $obtido = (Get-FileHash $Iso -Algorithm SHA256).Hash.ToLower()
    if ($esperado -ne $obtido) { Falha "Checksum não confere: o download está corrompido." }
    Info "ISO verificada (SHA-256 confere)."
  }
} elseif (-not (Test-Path $Iso)) { Falha "ISO não encontrada: $Iso" }

# ---------- 3. Partições ----------
Write-Host ""
Write-Host "Resumo:" -ForegroundColor White
Write-Host ("  C: será reduzida de {0:N0} GB para {1:N0} GB" -f ($particaoC.Size / 1GB), ($novoTamanho / 1GB))
Write-Host "  Nova partição VORTICIS (FAT32, $TamanhoInstaladorGB GB) com o instalador"
Write-Host "  $EspacoGB GB ficarão livres para o Vorticis"
if (-not $Simular) {
  $ok = Read-Host "Digite CONTINUAR para prosseguir"
  if ($ok -ne "CONTINUAR") { Falha "Cancelado pelo usuário." }
}

Executar "Reduzir C: em $($EspacoGB + $TamanhoInstaladorGB) GB" {
  Resize-Partition -DriveLetter C -Size $novoTamanho
}

$letra = $null
Executar "Criar partição VORTICIS de $TamanhoInstaladorGB GB" {
  $nova = New-Partition -DiskNumber $particaoC.DiskNumber -Size ($TamanhoInstaladorGB * 1GB) -AssignDriveLetter
  Format-Volume -Partition $nova -FileSystem FAT32 -NewFileSystemLabel "VORTICIS" -Confirm:$false | Out-Null
  $script:letra = (Get-Partition -DiskNumber $nova.DiskNumber -PartitionNumber $nova.PartitionNumber).DriveLetter
}
if ($Simular) { $letra = "V" }

Executar "Copiar o conteúdo da ISO para ${letra}:" {
  $img = Mount-DiskImage -ImagePath $Iso -PassThru
  try {
    $origem = ($img | Get-Volume).DriveLetter
    robocopy "${origem}:\" "${letra}:\" /E /NFL /NDL /NJH /NJS /R:2 /W:2 | Out-Null
    if ($LASTEXITCODE -ge 8) { throw "Falha ao copiar arquivos (robocopy $LASTEXITCODE)." }
  } finally { Dismount-DiskImage -ImagePath $Iso | Out-Null }
  if (-not (Test-Path "${letra}:\EFI\boot\bootx64.efi")) { throw "bootx64.efi não encontrado na ISO." }
}

# ---------- 4. Entrada de boot UEFI ----------
Executar "Criar entrada de boot 'Vorticis SO' e agendar um único boot" {
  $saida = bcdedit /copy "{bootmgr}" /d "Vorticis SO"
  $guid = [regex]::Match($saida, "\{[0-9a-fA-F-]{36}\}").Value
  if (-not $guid) { throw "bcdedit não retornou o identificador: $saida" }
  bcdedit /set $guid device "partition=${letra}:" | Out-Null
  bcdedit /set $guid path "\EFI\boot\bootx64.efi" | Out-Null
  bcdedit /set "{fwbootmgr}" displayorder $guid /addlast | Out-Null
  bcdedit /set "{fwbootmgr}" bootsequence $guid | Out-Null
  Set-Content -Path "${letra}:\vorticis-entrada-boot.txt" -Value $guid
}

Write-Host ""
Info "Tudo pronto! Reinicie o computador."
Info "O Vorticis abrirá em modo live. Clique em 'Instalar Vorticis' e escolha 'Instalar ao lado do Windows'."
Info "Se o Windows iniciar de novo, entre no menu de boot (F12/F11/Esc) e escolha 'Vorticis SO'."
Write-Host "Desfazer: bcdedit /delete <GUID em ${letra}:\vorticis-entrada-boot.txt>, apague a partição VORTICIS e estenda C:."
