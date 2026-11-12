# Vorticis SO 0.2 "Correnteza"

Primeira versão com instalador gerado. **Versão de testes (alfa)**: experimente primeiro numa
máquina virtual ou num computador sem dados importantes.

## Como instalar

- **Pen-drive:** grave `vorticis-0.2-amd64.iso` com balenaEtcher, Ventoy, Rufus (modo DD) ou
  `dd`, e inicie o computador por ele. No modo live, abra "Instalar Vorticis".
- **A partir do Windows (UEFI):** baixe `Instalar-Vorticis.ps1` e rode no PowerShell como
  administrador: `powershell -ExecutionPolicy Bypass -File .\Instalar-Vorticis.ps1`.
- **A partir de um Linux:** `sudo sh vorticis-instalar-daqui`.
- Se a ISO vier dividida em partes (`.parte00`, `.parte01`…), junte antes:
  Linux `cat vorticis-*.parte* > vorticis.iso` · Windows `copy /b vorticis-*.parte00+vorticis-*.parte01 vorticis.iso`.

Confira o arquivo `.sha256` antes de gravar.

## Novidades

- **12 temas**: Maré, Abismo, Recife, Crepúsculo (água interativa), Bolhas, Lagoa Noturna
  (bolhas que fogem do mouse), Aurora, Neon (aurora boreal), Geleira, Grafite, Areia e Alto
  Contraste (estáticos, custo zero).
- **Personalização**: cor de destaque, imagem própria de fundo, 5 estilos de ícones
  (arredondado, círculo, quadrado, sem fundo, monocromático), 3 tamanhos, animação de dock;
  barra em cima ou embaixo, centralizada ou à esquerda, transparência, ocultar automaticamente,
  relógio 12/24 h com segundos e data; fixar/desafixar/reordenar apps com o botão direito.
- **Vorticis Music** e **Vorticis Video Player**, já instalados e definidos como padrão.
- **Central de Apps**: 60+ apps selecionados, busca no Flathub e no Debian, instalados e
  atualizações (sistema, Flatpak, Android e firmware) num só lugar.
- **Ferramentas de sistema**: Configurações, Monitor, Notas, Calculadora, backup com pontos de
  restauração (Btrfs), informações do sistema.
- **Windows**: receitas automáticas (Office 2013/2016, Photoshop CS6, .NET, DirectX), VM Windows
  integrada para Office 365/AutoCAD/Adobe CC, cinco caminhos para usar Office.
- **Jogos**: verificação de anti-cheat por jogo, preparo de Steam/Proton com runtimes EAC e
  BattlEye, Proton-GE, otimizações.
- **Drivers**: NVIDIA (módulo aberto para Turing+), GPUs híbridas, Thunderbolt, leitores de
  digital, controles de jogo, mesas Wacom, scanners, sensores de 2-em-1, kernel do backports
  para hardware muito novo.
- **Telas**: todas as resoluções e taxas do monitor, escala automática pela densidade, modos
  personalizados, espelhar/estender e perfis que se reaplicam ao conectar monitores.
- **macOS retirado**: foco em Linux, Windows e Android.

## Limitações conhecidas

- Jogos com anti-cheat de kernel (Valorant, Call of Duty, FACEIT…) não rodam — limitação dos
  próprios jogos.
- Wine, Steam e Waydroid baixam na primeira utilização (requer internet).
- A barra que se oculta automaticamente não reserva espaço; em telas touch, use a borda.
