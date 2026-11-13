# Referência de comandos

> Gerado automaticamente por `docs/gerar-referencia.py` a partir da ajuda de cada ferramenta.
> Não edite à mão: altere a docstring/cabeçalho da ferramenta e rode o gerador.

Todas as ferramentas aceitam `--help`. As que alteram o sistema aceitam `--simular`, que mostra
o que seria feito sem mudar nada. Quando precisam de administrador, pedem a senha (pkexec/sudo).

## Aplicativos e atualizações

### vorticis-apps

Gerenciador de aplicativos unificado (apt, Flatpak, Android, Windows).

```
Uso:
  vorticis-apps catalogo [--json]            catálogo da Central de Apps com status de instalação
  vorticis-apps buscar TERMO [--json]        busca no catálogo, no Flathub e nos repositórios Debian
  vorticis-apps instalar ALVO [--simular]    ALVO = id do catálogo, flatpak:ID, apt:PACOTE ou arquivo
  vorticis-apps remover ALVO [--simular]
  vorticis-apps instalados [--json]          apps instalados de todas as fontes
  vorticis-apps atualizacoes [--json]        atualizações pendentes
  vorticis-apps atualizar [--simular]        atualiza sistema, Flatpaks, Android e firmware

A interface gráfica (Central de Apps) usa este mesmo comando por baixo.
```

### vorticis-atualizar

Atualizações do Vorticis SO por dentro do sistema.

```
Uso:
  vorticis-atualizar verificar [--json] [--rapido] [--notificar]
        novidades do Vorticis (releases do GitHub) + sistema (apt), apps (Flatpak) e firmware
  vorticis-atualizar instalar [--so-vorticis] [--simular]
        instala a versão nova do Vorticis (pacote vorticis-sistema, com SHA-256 conferido)
        e depois tudo o que estiver pendente
  vorticis-atualizar automatico {ligar,desligar,status}
        verificação automática (a cada 12 h) com aviso na área de trabalho

As atualizações de segurança do Debian já são instaladas sozinhas (unattended-upgrades).
```

### vorticis-compat

Instala programas de Windows, Android e Linux pela camada certa.

```
Uso:
  vorticis-compat instalar ARQUIVO [--nome NOME] [--receita ID] [--simular]
  vorticis-compat detectar ARQUIVO
  vorticis-compat receitas                       lista ajustes automáticos para programas Windows
  vorticis-compat preparar {windows,android,jogos,rpm,fontes,vm,todos} [--simular]
  vorticis-compat office {libreoffice,onlyoffice,web,wine,vm} [--simular]
  vorticis-compat windows-vm {criar,iniciar,app,parar} [PROGRAMA] [--simular]
  vorticis-compat status

Camadas:
  Linux    nativo (apt, Flatpak, AppImage) e RPM via Distrobox
  Windows  Wine com prefixo isolado por programa + receitas (winetricks, DXVK/VKD3D);
           para o que o Wine não roda: VM Windows (KVM) com janelas integradas (RemoteApp)
  Android  Waydroid (contêiner, mesmo kernel — sem emulação)
```

### vorticis-instalar-arquivo

Abre o instalador universal (vorticis-compat) num terminal para o arquivo escolhido

```
(dois cliques num .exe, .msi, .apk, .deb, .rpm, .AppImage ou .flatpakref).
```

### vorticis-jogos

Jogos de Windows no Vorticis, incluindo os com anti-cheat.

```
Uso:
  vorticis-jogos verificar "NOME DO JOGO"   consulta se o anti-cheat do jogo funciona no Linux
  vorticis-jogos preparar [--simular]       Steam + Proton, runtimes EAC/BattlEye, Proton-GE, gamemode
  vorticis-jogos alternativas "NOME"        caminhos para jogos cujo anti-cheat não aceita Linux
  vorticis-jogos otimizar [--simular]       ajustes de sistema para jogos

Como funciona o anti-cheat no Proton:
  * Easy Anti-Cheat (EAC) e BattlEye têm suporte oficial ao Proton. Funciona quando o
    estúdio do jogo ativa esse suporte (ex.: Elden Ring, DayZ, ARK, The Finals).
  * Anti-cheats de kernel (Riot Vanguard, FACEIT, Ricochet, Javelin...) recusam qualquer
    sistema que não seja Windows. Nenhuma camada de compatibilidade contorna isso — e
    tentar burlar leva a banimento. Para esses, o Vorticis oferece jogo em nuvem ou
    inicialização dupla com Windows.

Fonte dos dados: banco público "Are We Anti-Cheat Yet?" (areweanticheatyet.com).
```

### vorticis-navegadores

Instala e integra os principais navegadores ao Vorticis.

```
Uso:
  vorticis-navegadores listar
  vorticis-navegadores instalar NAVEGADOR [--simular]
  vorticis-navegadores padrao NAVEGADOR
  vorticis-navegadores otimizar [--simular]   Wayland nativo + aceleração de vídeo por GPU
  vorticis-navegadores abrir [URL]

Navegadores: firefox, chromium, chrome, brave, edge, opera, vivaldi
```

## Hardware

### vorticis-dispositivos

Gerenciador de dispositivos do Vorticis SO.

```
Uso:
  vorticis-dispositivos listar [--json] [--categoria NOME]   todo o hardware, agrupado por categoria
  vorticis-dispositivos info ID [--json]                     propriedades de um dispositivo
  vorticis-dispositivos drivers ID [--json]                  drivers sugeridos para o dispositivo
  vorticis-dispositivos desativar ID [--simular]             desliga (Wi-Fi/Bluetooth, USB, rede)
  vorticis-dispositivos ativar ID [--simular]
  vorticis-dispositivos reiniciar-driver ID [--simular]      recarrega o módulo do driver
  vorticis-dispositivos ejetar ID [--simular]                remove com segurança (pen-drive, HD externo)

IDs: pci:0000:00:02.0 · usb:1-2 · disco:sda · rede:wlan0 · entrada:event3 · camera:video0 ·
     bateria:BAT0 · monitor:card0-HDMI-A-1 · som:card0 · cpu:0 · memoria:0 · impressora:NOME
Estados: ok · sem-driver · desativado · desconectado · aviso
```

### vorticis-drivers

Caça e instala os drivers e firmwares mais atuais para o hardware.

```
Uso:
  vorticis-drivers listar              mostra o hardware detectado
  vorticis-drivers sugerir [--json] [--dispositivo ID]    drivers/firmwares recomendados
  vorticis-drivers instalar [PACOTE...] [--dispositivo ID] [--auto] [--simular]
  vorticis-drivers firmware [--simular]  atualiza BIOS/UEFI e firmware de dispositivos (fwupd/LVFS)
  vorticis-drivers kernel-recente [--simular]  kernel/firmware do backports para hardware muito novo

Cobre: GPUs NVIDIA (open/proprietário)/AMD/Intel e híbridas, Wi-Fi/Bluetooth (Intel, Realtek,
MediaTek, Atheros, Broadcom), áudio SOF, Thunderbolt, impressão digital, controles de jogo,
mesas Wacom, Logitech, impressoras e scanners sem driver, sensores de tablets 2-em-1.

Fontes de informação, em ordem:
  1. Regras próprias do Vorticis (GPU, Wi-Fi, Bluetooth, microcódigo, impressoras)
  2. isenkram-lookup (mapeia modalias → pacote Debian)
  3. Firmware que o kernel tentou carregar e não achou (log do kernel)
  4. nvidia-detect, para escolher a geração certa do driver NVIDIA
```

### vorticis-tela

Resoluções, taxa de atualização, escala e múltiplos monitores.

```
Uso:
  vorticis-tela listar                         monitores e todos os modos que o hardware oferece
  vorticis-tela auto [--salvar]                melhor resolução nativa + maior taxa + escala pela densidade (DPI)
  vorticis-tela definir SAIDA [--resolucao 2560x1440] [--taxa 144] [--escala 1.25]
                              [--rotacao 0|90|180|270] [--posicao X,Y] [--desligar] [--salvar]
  vorticis-tela personalizada SAIDA LARGURAxALTURA [--taxa 60] [--salvar]
                              cria um modo que o monitor não anuncia (EDID incompleto, ultrawide, adaptadores)
  vorticis-tela espelhar | estender [--salvar]
  vorticis-tela boot LARGURAxALTURA            resolução do menu de boot e do console (GRUB/kernel)

Usa o protocolo wlr-output-management (wlr-randr) e salva perfis no kanshi, que reaplica a
configuração automaticamente quando um monitor é conectado.
```

## Sistema e manutenção

### vorticis-diagnostico

Verifica o sistema inteiro em busca de erros e problemas.

```
Uso:
  vorticis-diagnostico verificar [--json]       roda todas as verificações
  vorticis-diagnostico corrigir ID [--simular]  aplica a correção sugerida de uma verificação
  vorticis-diagnostico relatorio [ARQUIVO]      salva um relatório completo (para pedir ajuda)

Áreas: serviços, pacotes, discos e espaço, saúde dos discos (SMART), memória, temperatura,
erros do kernel, dispositivos sem driver, firmware faltando, rede, DNS, firewall, relógio,
atualizações, bateria, inicialização segura e pontos de restauração.
Estados: ok · aviso · erro · info
```

### vorticis-sistema

Informações e estado ao vivo do sistema (usado pelo Vorticis Monitor).

```
Uso:
  vorticis-sistema info [--json]       versão, kernel, CPU, GPU, memória, discos, tempo ligado
  vorticis-sistema agora [--json]      uso de CPU/memória/disco/rede/temperatura + processos
  vorticis-sistema encerrar PID [--forcar]
```

### vorticis-recursos

Administra memória, armazenamento e energia de forma inteligente.

```
Uso:
  vorticis-recursos status                 resumo de memória, swap, discos e processos
  vorticis-recursos aplicar [--simular]    ajusta zram, OOM, sysctl e TRIM conforme o hardware
  vorticis-recursos limpar [--simular]     remove caches, logs antigos e lixeira > 30 dias
  vorticis-recursos energia {economia,equilibrado,desempenho}
  vorticis-recursos painel                 monitor ao vivo no terminal
```

### vorticis-backup

Pontos de restauração do sistema e cópia de segurança dos arquivos pessoais.

```
Uso:
  vorticis-backup sistema criar [DESCRICAO] [--simular]   snapshot Btrfs (snapper) da raiz
  vorticis-backup sistema listar
  vorticis-backup sistema restaurar NUMERO [--simular]    volta o sistema ao ponto escolhido (requer reinício)
  vorticis-backup pessoal DESTINO [--simular]             copia a pasta pessoal (incremental, rsync)
  vorticis-backup automatico {ligar,desligar}            ponto de restauração diário + antes de cada atualização

O instalador do Vorticis usa Btrfs por padrão, o que torna os pontos de restauração instantâneos.
```

### vorticis-midia

Lista músicas e vídeos do usuário para o Vorticis Music / Video.

```
Uso:
  vorticis-midia listar {audio,video} [PASTA...]   imprime JSON com nome, url (file://) e tamanho
```

## Usuários, rede e segurança

### vorticis-usuarios

Contas com níveis de acesso.

```
Níveis:
  admin      Administrador: controle total (com senha)
  padrao     Padrão: usa e instala apps só para si, troca Wi-Fi, sem mexer no sistema
  convidado  Convidado: sem senha, pasta pessoal apagada ao sair, sem acesso à rede local
  infantil   Infantil: só apps permitidos, horário limitado, DNS com filtro familiar

Uso:
  vorticis-usuarios configurar [--simular]          instala grupos, regras polkit e PAM (uma vez)
  vorticis-usuarios criar LOGIN --nivel NIVEL [--nome "Nome Completo"] [--horario "Wk0800-2000"] [--simular]
  vorticis-usuarios nivel LOGIN NIVEL [--simular]
  vorticis-usuarios remover LOGIN [--manter-arquivos] [--simular]
  vorticis-usuarios listar
```

### vorticis-rede

Firewall e segurança de rede do Vorticis SO.

```
Uso:
  vorticis-rede status                   estado do firewall, DNS criptografado e portas abertas
  vorticis-rede abrir PORTA/PROTO        ex.: vorticis-rede abrir 22/tcp
  vorticis-rede fechar PORTA/PROTO
  vorticis-rede carregar                 (usado pelo serviço) aplica regras e listas
```

## Área de trabalho

### vorticis-shell

Inicia a área de trabalho do Vorticis SO no compositor Wayland.

```
Superfícies (protocolo wlr-layer-shell):
  * papel de parede  — camada BACKGROUND, tela inteira, água interativa;
  * barra de tarefas — camada TOP, ancorada embaixo (ou em cima), reserva espaço;
  * painel           — camada OVERLAY, criada só enquanto o menu, a personalização ou um
                       menu de contexto estão abertos, com o TAMANHO DO PAINEL (não ocupa a
                       tela inteira; não depende de transparência, que falha sem GPU).
Sem aceleração 3D (VMs, GPUs sem driver), o WebKit desenha por software (VORTICIS_SEM_GPU=1).

Dependências (Debian 13): python3-gi gir1.2-gtk-4.0 gir1.2-webkit-6.0 gir1.2-gtk4layershell-1.0
```

### vorticis-app

Abre um app Vorticis (Music, Video, Central de Apps, Configurações...) em janela própria.

```
Uso:
  vorticis-app musica [ARQUIVOS...]
  vorticis-app video [ARQUIVOS...]
  vorticis-app central | configuracoes | dispositivos | diagnostico | ajuda [--secao ID]
  vorticis-app monitor | notas | calculadora

Os apps são páginas HTML em /usr/share/vorticis/shell/apps renderizadas pelo WebKitGTK. A ponte
"vorticis" permite que a página execute APENAS as ferramentas vorticis-* (lista fixa abaixo),
nunca comandos arbitrários.
Dependências: python3-gi gir1.2-gtk-4.0 gir1.2-webkit-6.0
```

### vorticis-sessao

Inicia a sessão gráfica do Vorticis SO (chamado pelo greetd).

```
* Espera o dispositivo de vídeo aparecer (no boot do pen-drive o login automático
  pode começar antes de o driver de vídeo terminar de carregar).
* Usa a GPU quando há aceleração real. Em placas sem 3D (VMs, vídeo genérico do
  firmware) ou se o compositor cair, usa renderização por software estável (pixman):
  o OpenGL por software (llvmpipe) pode derrubar o compositor.
* Se o compositor cair, recomeça em modo software em vez de voltar à tela de login.
```

## Instalação

### vorticis-instalar-sistema

Abre o instalador gráfico (Calamares) no modo live.

```
O atalho original do Debian usa pkexec+xhost, que perdem a sessão Wayland do Vorticis;
aqui o instalador recebe o endereço da sessão do usuário e roda como administrador.
```
