<#
.SYNOPSIS
  Instala o Vorticis SO a partir do Windows, sem pen-drive.

.DESCRIPTION
  Abra o Instalar-Vorticis.exe (ou este script) e clique em "Instalar". O instalador:

  1. Verifica o computador (UEFI, administrador, espaço livre, BitLocker).
  2. Baixa a versão mais recente do Vorticis e confere o SHA-256.
  3. Cria uma partição de 6 GB "VORTICIS" com o instalador, tirando o espaço do C:.
  4. Desliga a Inicialização Rápida do Windows (permite redimensionar o C: com segurança).
  5. Agenda UMA inicialização no Vorticis e reinicia.

  Ao reiniciar, o instalador do Vorticis abre sozinho, já na opção "Instalar ao lado do
  Windows": é só escolher quanto espaço dar ao Vorticis, criar seu usuário e confirmar.
  Nenhum arquivo do Windows é apagado. Faça backup mesmo assim.

.PARAMETER Console
  Usa o modo texto (sem janela).

.PARAMETER EspacoGB
  Só com BitLocker ativo: espaço (GB) a liberar no C: para o Vorticis. Padrão: 60.

.PARAMETER Iso
  Usa uma ISO já baixada.

.PARAMETER Simular
  Apenas mostra o que seria feito (modo texto).

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\Instalar-Vorticis.ps1
#>
[CmdletBinding()]
param(
  [int]$EspacoGB = 60,
  [string]$Iso,
  [string]$Url = "",
  [switch]$Simular,
  [switch]$Console
)

$ErrorActionPreference = "Stop"
$TamanhoInstaladorGB = 6
$MinimoVorticisGB = 25          # o instalador pede 20 GB; uma folga para o Windows continuar bem
$Repositorio = "hellisonvidal/Vorticis-SO"
$Pasta = Split-Path -Parent $MyInvocation.MyCommand.Path

# ====================================================================================
# Etapas (as mesmas no modo janela e no modo texto)
# ====================================================================================

function Test-Admin {
  ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Verifica o computador. Devolve @{ Erros; Avisos; BitLocker; NovoTamanhoC }
function Get-Verificacao {
  $r = @{ Erros = @(); Avisos = @(); BitLocker = $false; NovoTamanhoC = 0 }
  if (-not (Test-Admin)) { $r.Erros += "Abra o instalador como administrador." }

  $uefi = $true
  try { $null = Get-SecureBootUEFI -Name SetupMode -ErrorAction Stop }
  catch [System.PlatformNotSupportedException] { $uefi = $false }
  catch { }  # UEFI presente, sem permissão de leitura
  if ($env:firmware_type -eq "Legacy") { $uefi = $false }
  if (-not $uefi) { $r.Erros += "Este computador usa BIOS antiga (Legacy). Instale com um pen-drive." }

  try {
    $bl = Get-BitLockerVolume -MountPoint "C:" -ErrorAction Stop
    if ($bl.ProtectionStatus -eq "On" -or $bl.VolumeStatus -ne "FullyDecrypted") { $r.BitLocker = $true }
  } catch { }
  if ($r.BitLocker) {
    $r.Avisos += "BitLocker ativo no C:: anote a chave de recuperação (aka.ms/myrecoverykey). O espaço do Vorticis ($EspacoGB GB) será separado agora."
  }

  # Modo RAID/Intel RST: o Linux pode não enxergar alguns discos (o certo é AHCI)
  try {
    $raid = Get-CimInstance Win32_SCSIController -ErrorAction Stop |
      Where-Object { $_.Name -match "RAID|RST|Rapid Storage|Optane" -and $_.Name -notmatch "VMD" }
    if ($raid) {
      $r.Avisos += "O disco está no modo RAID/Intel RST ($(@($raid)[0].Name)). O instalador do Vorticis pode não mostrar todos os discos. Se precisar, mude para AHCI (Manual: 'Só aparece um disco')."
    }
  } catch { }

  try {
    $c = Get-Partition -DriveLetter C
    $suporte = Get-PartitionSupportedSize -DriveLetter C
    $livreGB = [math]::Floor((Get-Volume -DriveLetter C).SizeRemaining / 1GB)
    $reduzirGB = $TamanhoInstaladorGB + $(if ($r.BitLocker) { $EspacoGB } else { 0 })
    $r.NovoTamanhoC = $c.Size - [int64]$reduzirGB * 1GB
    $precisaGB = $TamanhoInstaladorGB + $(if ($r.BitLocker) { $EspacoGB } else { $MinimoVorticisGB }) + 10
    if ($r.NovoTamanhoC -lt $suporte.SizeMin) {
      $r.Erros += "O Windows não consegue liberar $reduzirGB GB no C: agora. Rode a Limpeza de Disco, reinicie e tente de novo."
    } elseif ($livreGB -lt $precisaGB) {
      $r.Erros += "Pouco espaço livre no C: ($livreGB GB). Libere pelo menos $precisaGB GB."
    }
  } catch { $r.Erros += "Não foi possível ler o disco C: ($($_.Exception.Message))." }
  return $r
}

function Get-UrlIso {
  if ($Url) { return $Url }
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  $rel = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repositorio/releases/latest" -Headers @{ "User-Agent" = "Instalador-Vorticis" }
  $a = $rel.assets | Where-Object { $_.name -like "*.iso" } | Select-Object -First 1
  if (-not $a) { throw "A versão mais recente ($($rel.tag_name)) não tem a ISO." }
  return $a.browser_download_url
}

function Test-Iso([string]$arquivo, [string]$arquivoSha) {
  $esperado = ((Get-Content $arquivoSha -Raw).Trim() -split "\s+")[0].ToLower()
  $obtido = (Get-FileHash $arquivo -Algorithm SHA256).Hash.ToLower()
  if ($esperado -ne $obtido) { throw "O arquivo baixado está corrompido (SHA-256 não confere). Tente de novo." }
}

function New-ParticaoVorticis($v) {
  Resize-Partition -DriveLetter C -Size $v.NovoTamanhoC
  $disco = (Get-Partition -DriveLetter C).DiskNumber
  $nova = New-Partition -DiskNumber $disco -Size ([int64]$TamanhoInstaladorGB * 1GB) -AssignDriveLetter
  Format-Volume -Partition $nova -FileSystem FAT32 -NewFileSystemLabel "VORTICIS" -Confirm:$false | Out-Null
  return (Get-Partition -DiskNumber $nova.DiskNumber -PartitionNumber $nova.PartitionNumber).DriveLetter
}

# Copia a ISO (robocopy em segundo plano: devolve o processo)
function Start-Copia([string]$arquivoIso, [string]$letra) {
  $img = Mount-DiskImage -ImagePath $arquivoIso -PassThru
  $origem = ($img | Get-Volume).DriveLetter
  $p = Start-Process robocopy -ArgumentList "`"${origem}:\`" `"${letra}:\`" /E /NFL /NDL /NJH /NJS /R:2 /W:2" -WindowStyle Hidden -PassThru
  $null = $p.Handle   # sem isso o ExitCode pode vir vazio depois
  return $p
}

function Complete-Copia([string]$arquivoIso, [string]$letra, $processo) {
  Dismount-DiskImage -ImagePath $arquivoIso | Out-Null
  if ($processo.ExitCode -ge 8) { throw "Falha ao copiar os arquivos (robocopy $($processo.ExitCode))." }
  if (-not (Test-Path "${letra}:\EFI\boot\bootx64.efi")) { throw "Arquivos de inicialização não encontrados na ISO." }
  # O menu de boot da partição abre o instalador sozinho (vorticis.instalar) e não espera
  $cfg = "${letra}:\boot\grub\grub.cfg"
  $texto = [IO.File]::ReadAllText($cfg)
  $texto = $texto.Replace("source /boot/grub/config.cfg", "source /boot/grub/config.cfg`nset timeout=1")
  $i = $texto.IndexOf("boot=live components")
  if ($i -ge 0) { $texto = $texto.Insert($i + "boot=live components".Length, " vorticis.instalar") }
  [IO.File]::WriteAllText($cfg, $texto, (New-Object Text.UTF8Encoding $false))
}

function Set-Inicializacao([string]$letra) {
  # Sem Inicialização Rápida, o C: fica "limpo" e o instalador do Vorticis pode redimensioná-lo
  Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Power" -Name HiberbootEnabled -Value 0 -Type DWord
  $bcd = "$env:SystemRoot\System32\bcdedit.exe"
  $saida = & $bcd /copy "{bootmgr}" /d "Vorticis SO"
  $guid = [regex]::Match(($saida -join " "), "\{[0-9a-fA-F-]{36}\}").Value
  if (-not $guid) { throw "Não foi possível criar a entrada de inicialização: $saida" }
  & $bcd /set $guid device "partition=${letra}:" | Out-Null
  & $bcd /set $guid path "\EFI\boot\bootx64.efi" | Out-Null
  & $bcd /set "{fwbootmgr}" displayorder $guid /addlast | Out-Null
  & $bcd /set "{fwbootmgr}" bootsequence $guid | Out-Null
  Set-Content -Path "${letra}:\vorticis-entrada-boot.txt" -Value @(
    "Entrada de boot do instalador do Vorticis: $guid",
    "Para desfazer (antes de instalar): bcdedit /delete $guid, apague a partição VORTICIS e estenda o C:.")
}

$ProximosPassos = "Ao reiniciar, o instalador do Vorticis abre sozinho, já em `"Instalar ao lado do Windows`": " +
  "escolha quanto espaço dar ao Vorticis, crie seu usuário e confirme. " +
  "Se o Windows abrir de novo, ligue o computador apertando F12, F11 ou Esc e escolha `"Vorticis SO`"."
$ProximosPassosBitLocker = "Ao reiniciar, o instalador do Vorticis abre sozinho. Na etapa de partições, escolha " +
  "`"Substituir uma partição`" e clique no espaço livre (cinza) de $EspacoGB GB."

# ====================================================================================
# Modo texto
# ====================================================================================
function Start-ModoTexto {
  function Info($t) { Write-Host "» $t" -ForegroundColor Cyan }
  function Passo([string]$descricao, [scriptblock]$acao) {
    if ($Simular) { Write-Host "[simulação] $descricao" -ForegroundColor Yellow } else { Info $descricao; & $acao }
  }
  Write-Host ""
  Write-Host "   Vorticis SO — instalador para Windows" -ForegroundColor Cyan
  Write-Host ""
  $v = Get-Verificacao
  $v.Avisos | ForEach-Object { Write-Warning $_ }
  if ($v.Erros.Count -and -not $Simular) { $v.Erros | ForEach-Object { Write-Host "✘ $_" -ForegroundColor Red }; exit 1 }
  $v.Erros | ForEach-Object { Write-Host "[simulação] (seria bloqueado) $_" -ForegroundColor Yellow }

  $script:arqIso = $Iso
  if (-not $arqIso) {
    $endereco = if ($Simular) { "<ISO mais recente>" } else { Get-UrlIso }
    $script:arqIso = Join-Path $env:TEMP "vorticis.iso"
    Passo "Baixar $endereco" {
      Start-BitsTransfer -Source $endereco -Destination $arqIso -DisplayName "Vorticis SO"
      Invoke-WebRequest -UseBasicParsing -Uri "$endereco.sha256" -OutFile "$arqIso.sha256"
      Test-Iso $arqIso "$arqIso.sha256"
    }
  } elseif (-not (Test-Path $arqIso)) { throw "ISO não encontrada: $arqIso" }

  if (-not $Simular) {
    Write-Host "O C: vai ceder $TamanhoInstaladorGB GB para o instalador. Nenhum arquivo do Windows é apagado."
    if ((Read-Host "Digite CONTINUAR para prosseguir") -ne "CONTINUAR") { Write-Host "Cancelado."; exit 1 }
  }
  $script:letra = "V"
  Passo "Criar a partição VORTICIS ($TamanhoInstaladorGB GB)" { $script:letra = New-ParticaoVorticis $v }
  Passo "Copiar o instalador para ${letra}:" {
    $p = Start-Copia $arqIso $letra; $p.WaitForExit(); Complete-Copia $arqIso $letra $p
  }
  Passo "Agendar a inicialização no Vorticis" { Set-Inicializacao $letra }
  Info "Pronto! Reinicie o computador."
  Info $(if ($v.BitLocker) { $ProximosPassosBitLocker } else { $ProximosPassos })
}

# ====================================================================================
# Modo janela
# ====================================================================================
function Start-ModoJanela {
  Add-Type -AssemblyName System.Windows.Forms, System.Drawing
  [Windows.Forms.Application]::EnableVisualStyles()
  $azul = [Drawing.Color]::FromArgb(11, 111, 184)
  $fundo = [Drawing.Color]::FromArgb(3, 33, 74)

  $f = New-Object Windows.Forms.Form
  $f.Text = "Instalar o Vorticis SO"; $f.ClientSize = New-Object Drawing.Size(560, 400)
  $f.StartPosition = "CenterScreen"; $f.FormBorderStyle = "FixedDialog"; $f.MaximizeBox = $false
  $f.BackColor = [Drawing.Color]::White; $f.Font = New-Object Drawing.Font("Segoe UI", 10)
  $ico = Join-Path $Pasta "vorticis.ico"
  if (Test-Path $ico) { $f.Icon = New-Object Drawing.Icon($ico) }

  $topo = New-Object Windows.Forms.Panel
  $topo.Dock = "Top"; $topo.Height = 96; $topo.BackColor = $fundo
  $f.Controls.Add($topo)
  if (Test-Path $ico) {
    $img = New-Object Windows.Forms.PictureBox
    $img.Image = (New-Object Drawing.Icon($ico, 64, 64)).ToBitmap(); $img.SizeMode = "Zoom"
    $img.SetBounds(20, 16, 64, 64); $topo.Controls.Add($img)
  }
  $titulo = New-Object Windows.Forms.Label
  $titulo.Text = "Vorticis SO"; $titulo.ForeColor = [Drawing.Color]::White
  $titulo.Font = New-Object Drawing.Font("Segoe UI Semibold", 20); $titulo.SetBounds(100, 18, 440, 40)
  $topo.Controls.Add($titulo)
  $sub = New-Object Windows.Forms.Label
  $sub.Text = "Instalar ao lado do Windows, sem pen-drive"; $sub.ForeColor = [Drawing.Color]::FromArgb(160, 210, 255)
  $sub.SetBounds(102, 58, 440, 24); $topo.Controls.Add($sub)

  $texto = New-Object Windows.Forms.Label
  $texto.SetBounds(24, 112, 512, 150)
  $f.Controls.Add($texto)

  $barra = New-Object Windows.Forms.ProgressBar
  $barra.SetBounds(24, 270, 512, 18); $barra.Visible = $false
  $f.Controls.Add($barra)
  $estado = New-Object Windows.Forms.Label
  $estado.SetBounds(24, 294, 512, 40); $estado.ForeColor = [Drawing.Color]::DimGray
  $f.Controls.Add($estado)

  $botao = New-Object Windows.Forms.Button
  $botao.Text = "Instalar"; $botao.SetBounds(404, 344, 132, 38)
  $botao.BackColor = $azul; $botao.ForeColor = [Drawing.Color]::White; $botao.FlatStyle = "Flat"
  $f.Controls.Add($botao); $f.AcceptButton = $botao
  $cancelar = New-Object Windows.Forms.Button
  $cancelar.Text = "Cancelar"; $cancelar.SetBounds(290, 344, 104, 38)
  $cancelar.Add_Click({ $f.Close() })
  $f.Controls.Add($cancelar)

  $v = Get-Verificacao
  if ($v.Erros.Count) {
    $texto.Text = "Não é possível instalar por este caminho:`n`n• " + ($v.Erros -join "`n• ")
    $texto.ForeColor = [Drawing.Color]::Firebrick
    $botao.Enabled = $false; $cancelar.Text = "Fechar"
  } else {
    $texto.Text = "O instalador vai baixar o Vorticis (cerca de 1,4 GB), separar $TamanhoInstaladorGB GB do disco C: " +
      "para ele e reiniciar o computador. Nenhum arquivo do Windows é apagado.`n`n" +
      $(if ($v.BitLocker) { $ProximosPassosBitLocker } else { $ProximosPassos }) +
      $(if ($v.Avisos.Count) { "`n`n⚠ " + ($v.Avisos -join "`n⚠ ") } else { "" }) +
      "`n`nRecomendado: faça backup dos seus arquivos antes."
  }

  # Máquina de etapas guiada por um timer, para a janela continuar respondendo
  $s = @{ etapa = "inicio"; job = $null; proc = $null; letra = $null; arq = $Iso; url = $null }
  $timer = New-Object Windows.Forms.Timer
  $timer.Interval = 400

  $falhar = {
    param($msg)
    $timer.Stop(); $barra.Visible = $false
    $estado.ForeColor = [Drawing.Color]::Firebrick; $estado.Text = "Erro: $msg"
    $cancelar.Text = "Fechar"; $cancelar.Enabled = $true
  }

  $timer.Add_Tick({
    try {
      switch ($s.etapa) {
        "inicio" {
          if ($s.arq) { $s.etapa = "particao"; return }
          $estado.Text = "Procurando a versão mais recente…"
          $s.url = Get-UrlIso
          $s.arq = Join-Path $env:TEMP "vorticis.iso"
          Invoke-WebRequest -UseBasicParsing -Uri "$($s.url).sha256" -OutFile "$($s.arq).sha256"
          if ((Test-Path $s.arq) -and $(try { Test-Iso $s.arq "$($s.arq).sha256"; $true } catch { $false })) {
            $s.etapa = "particao"; return   # já baixada antes
          }
          Get-BitsTransfer -Name "Vorticis SO" -ErrorAction SilentlyContinue | Remove-BitsTransfer
          $s.job = Start-BitsTransfer -Source $s.url -Destination $s.arq -DisplayName "Vorticis SO" -Asynchronous -Priority Foreground
          $barra.Style = "Continuous"; $barra.Value = 0
          $s.etapa = "baixando"
        }
        "baixando" {
          $j = $s.job
          if ($j.BytesTotal -gt 0 -and $j.BytesTotal -ne [uint64]::MaxValue) {
            $p = [int](100 * $j.BytesTransferred / $j.BytesTotal); $barra.Value = [math]::Min(100, $p)
            $estado.Text = "Baixando o Vorticis… {0:N0} de {1:N0} MB ({2}%)" -f ($j.BytesTransferred / 1MB), ($j.BytesTotal / 1MB), $p
          }
          if ($j.JobState -eq "Transferred") {
            Complete-BitsTransfer -BitsJob $j
            $estado.Text = "Conferindo o arquivo baixado…"; $barra.Style = "Marquee"; $f.Refresh()
            Test-Iso $s.arq "$($s.arq).sha256"
            $s.etapa = "particao"
          } elseif ($j.JobState -eq "Error") {
            $erro = $j.ErrorDescription; Remove-BitsTransfer -BitsJob $j
            throw "Falha no download: $erro"
          }
        }
        "particao" {
          $barra.Style = "Marquee"
          $estado.Text = "Separando $TamanhoInstaladorGB GB do disco C: (pode levar alguns minutos)…"; $f.Refresh()
          $s.letra = New-ParticaoVorticis $v
          $estado.Text = "Copiando o instalador…"
          $s.proc = Start-Copia $s.arq $s.letra
          $s.etapa = "copiando"
        }
        "copiando" {
          if (-not $s.proc.HasExited) { return }
          Complete-Copia $s.arq $s.letra $s.proc
          $estado.Text = "Preparando a inicialização…"; $f.Refresh()
          Set-Inicializacao $s.letra
          $timer.Stop()
          $barra.Style = "Continuous"; $barra.Value = 100
          $estado.ForeColor = [Drawing.Color]::SeaGreen
          $estado.Text = "Tudo pronto! Salve o que estiver aberto e clique em Reiniciar agora."
          $cancelar.Text = "Depois"; $cancelar.Enabled = $true
          $botao.Text = "Reiniciar agora"; $botao.Enabled = $true
          $s.etapa = "pronto"
        }
      }
    } catch { & $falhar $_.Exception.Message }
  })

  $botao.Add_Click({
    if ($s.etapa -eq "pronto") { Restart-Computer -Force; return }
    $resp = [Windows.Forms.MessageBox]::Show(
      "O disco C: vai ceder $TamanhoInstaladorGB GB$(if ($v.BitLocker) { " + $EspacoGB GB" }) e, ao final, o computador será reiniciado.`n`nNenhum arquivo do Windows é apagado. Continuar?",
      "Instalar o Vorticis SO", "YesNo", "Question")
    if ($resp -ne "Yes") { return }
    $botao.Enabled = $false; $cancelar.Enabled = $false
    $barra.Visible = $true; $barra.Style = "Marquee"
    $timer.Start()
  })
  $f.Add_FormClosing({
    param($o, $e)
    if ($s.etapa -in @("particao", "copiando")) { $e.Cancel = $true; return }  # não interromper o particionamento
    if ($s.job) { try { Remove-BitsTransfer -BitsJob $s.job } catch { } }
  })
  [void]$f.ShowDialog()
}

# ====================================================================================
try { $Host.UI.RawUI.WindowTitle = "Instalador do Vorticis SO" } catch { }
if ($Console -or $Simular) {
  try { Start-ModoTexto } catch { Write-Host "✘ $($_.Exception.Message)" -ForegroundColor Red; exit 1 }
} else {
  Start-ModoJanela
}
