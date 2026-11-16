; Instalar-Vorticis.exe — abre o instalador do Vorticis SO para Windows com dois cliques.
; Pede permissão de administrador, extrai o Instalar-Vorticis.ps1 numa pasta temporária e
; o executa no PowerShell 64 bits, sem a janela preta do console.
; Gerar: makensis -DVERSAO=0.3.1 installer/windows/instalador.nsi

Unicode true
!include "x64.nsh"
!ifndef VERSAO
  !define VERSAO "0.0.0"
!endif

Name "Vorticis SO"
Caption "Instalar o Vorticis SO"
OutFile "Instalar-Vorticis.exe"
Icon "vorticis.ico"
RequestExecutionLevel admin
SilentInstall silent
ManifestDPIAware true

VIProductVersion "${VERSAO}.0"
VIAddVersionKey "ProductName" "Vorticis SO"
VIAddVersionKey "FileDescription" "Instalador do Vorticis SO"
VIAddVersionKey "FileVersion" "${VERSAO}"
VIAddVersionKey "ProductVersion" "${VERSAO}"
VIAddVersionKey "LegalCopyright" "Projeto Vorticis SO"

Section
  ${IfNot} ${RunningX64}
    MessageBox MB_ICONSTOP "O Vorticis SO precisa de um Windows de 64 bits."
    Abort
  ${EndIf}
  ${DisableX64FSRedirection}   ; bcdedit e os comandos de disco ficam no System32 de 64 bits
  InitPluginsDir
  SetOutPath "$PLUGINSDIR"
  File "Instalar-Vorticis.ps1"
  File "vorticis.ico"
  ExecWait '"$WINDIR\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -STA -ExecutionPolicy Bypass -WindowStyle Hidden -File "$PLUGINSDIR\Instalar-Vorticis.ps1"' $0
  SetOutPath "$TEMP"   ; libera a pasta temporária para ser apagada
  SetErrorLevel $0
SectionEnd
