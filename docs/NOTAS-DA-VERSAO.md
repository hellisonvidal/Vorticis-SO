# Vorticis SO 0.3.0 — dispositivos, diagnóstico e atualizações

Versão de testes (alfa): experimente primeiro numa máquina virtual ou num computador sem dados
importantes.

## Novidades da 0.3.0

- **Dispositivos** (novo app): todo o hardware por categoria — processador, vídeo, monitores, som,
  rede, Bluetooth, armazenamento, USB, teclado/mouse, câmeras, impressoras e bateria — com estado,
  propriedades e ações: ativar/desativar, reiniciar driver, remover com segurança.
- **Procurar drivers por dentro do gerenciador**: para cada dispositivo, os drivers e firmwares
  recomendados com botão Instalar; busca no computador inteiro, atualização de BIOS/firmware (LVFS)
  e kernel mais recente para hardware novo.
- **Diagnóstico** (novo app): 16 verificações — serviços, pacotes, espaço e saúde dos discos,
  memória, temperatura, erros do kernel, drivers, firmware, internet, DNS, firewall, relógio,
  atualizações, bateria, segurança e pontos de restauração — com nota de saúde, botão Corrigir e
  relatório para pedir ajuda.
- **Atualizações por dentro do sistema**: o Vorticis agora é o pacote `vorticis-sistema`; novas
  versões chegam pelas releases (com SHA-256 conferido), com aviso na área de trabalho a cada
  12 horas, pela Central de Apps → Atualizações ou por Configurações → Atualizações.
- **Documentação completa**: Manual do usuário, Referência de comandos (gerada automaticamente),
  Como o Vorticis funciona e Guia de desenvolvimento — também no novo app **Ajuda**, com busca.
- **Correção importante no instalador**: a imagem não trazia o GRUB para o disco; o sistema instalado
  podia não iniciar. Agora o instalador grava o GRUB certo para UEFI ou BIOS (com Secure Boot via shim)
  e configura criptografia, tela de boot e initramfs.

---

# Vorticis SO 0.2.1 — identidade visual

Atualização da 0.2 "Correnteza". Versão de testes (alfa): experimente primeiro numa máquina
virtual ou num computador sem dados importantes.

## Novidades da 0.2.1

- **Ícone do Vorticis** — um vórtice, da mesma família do Vorticis Monitor — no lugar da gota:
  botão e cabeçalho do menu, barra, menu de boot, tela de inicialização (o vórtice gira enquanto
  o sistema carrega), instalador gráfico (barra lateral, janela e apresentação), ícone da unidade
  do pen-drive no Windows e ícones do sistema.
- **O ícone acompanha o tema**, e pode ser trocado à parte em Personalização → Ícones:
  5 formatos (Vórtice, Ciclone, Redemoinho, Onda, Gota) e 10 combinações de cores.
- **Modo live**: entra direto na área de trabalho também em computadores e VMs sem aceleração
  3D; "Instalar Vorticis SO" fica fixado no início da barra e abre o instalador corretamente.
- Os instaladores para Windows e Linux baixam sempre a versão mais recente.
- Correção: com muitos apps fixados, o primeiro ficava escondido sob o botão do menu.

---

# Vorticis SO 0.2 "Correnteza"

Primeira versão com instalador gerado. **Versão de testes (alfa)**: experimente primeiro numa
máquina virtual ou num computador sem dados importantes.

## Como instalar

- **Pen-drive:** grave a ISO (`vorticis-<versão>-amd64.iso`) com balenaEtcher, Ventoy, Rufus (modo DD) ou
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

## Atalhos

- **Super (tecla Windows)**: abre o menu · **Super+P**: personalização · **Super+Enter**: terminal
- **Super+E**: arquivos · **Super+L**: bloquear · **Alt+Tab**: alternar janelas · **Print**: captura de tela

## Limitações conhecidas

- Jogos com anti-cheat de kernel (Valorant, Call of Duty, FACEIT…) não rodam — limitação dos
  próprios jogos.
- Wine, Steam e Waydroid baixam na primeira utilização (requer internet).
- A barra que se oculta automaticamente não reserva espaço; em telas touch, use a borda.
- Testado em máquina virtual sem aceleração 3D (boot, login automático do modo live, área de
  trabalho, menu). Sem GPU o Vorticis desenha tudo por software: funciona, mas a água animada
  fica mais lenta. Em hardware real com driver de vídeo, a aceleração é usada automaticamente.
