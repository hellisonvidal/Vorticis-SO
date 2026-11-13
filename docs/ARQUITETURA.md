# Como o Vorticis SO funciona

```
┌───────────────────────────────────────────────────────────────────────┐
│  Área de trabalho (vorticis-shell): papel de parede, barra, painéis   │
│  Apps Vorticis (vorticis-app): Music · Video · Central de Apps ·      │
│   Configurações · Dispositivos · Diagnóstico · Monitor · Notas ·      │
│   Calculadora · Ajuda                                                 │
├─────────────────┬─────────────────┬─────────────────┬─────────────────┤
│ Apps Linux      │ Apps Windows    │ Apps Android    │ Web apps        │
│ deb/Flatpak/    │ Wine + receitas │ Waydroid        │ navegadores,    │
│ AppImage/rpm    │ Proton · VM     │ (contêiner)     │ Microsoft 365   │
├─────────────────┴─────────────────┴─────────────────┴─────────────────┤
│  Ferramentas vorticis-*: apps · atualizar · compat · dispositivos ·   │
│  drivers · diagnostico · tela · recursos · usuarios · rede · backup · │
│  jogos · navegadores · sistema · midia                                │
├───────────────────────────────────────────────────────────────────────┤
│  Segurança: nftables · AppArmor · DNS-over-TLS · polkit · sudo        │
├───────────────────────────────────────────────────────────────────────┤
│  systemd · PipeWire · NetworkManager · Mesa/Vulkan · fwupd · labwc    │
├───────────────────────────────────────────────────────────────────────┤
│  Kernel Linux (Debian 13 "trixie") + firmware                         │
└───────────────────────────────────────────────────────────────────────┘
```

## Decisões principais

1. **Kernel Linux / base Debian 13.** Suporte a hardware, segurança e atualizações maduras;
   `live-build` gera ISOs reprodutíveis.
2. **Sessão Wayland com `labwc`** (compositor leve). `vorticis-sessao` escolhe aceleração por GPU
   ou desenho por software (pixman) quando não há 3D real, e recomeça se o compositor cair.
3. **Área de trabalho e apps em tecnologia web renderizada pelo WebKitGTK** (sem Electron: reaproveita
   a engine do sistema). O fundo animado tem três níveis de qualidade (GPU, CPU leve, estático),
   escolhidos pelo hardware e pela bateria.
4. **Compatibilidade por camadas**, não por emulação: Wine/Proton para Windows, Waydroid para
   Android (mesmo kernel), VM Windows integrada para o que o Wine não roda. Ver [Compatibilidade](COMPATIBILIDADE.md).
5. **Ferramentas primeiro**: cada função é um comando `vorticis-*` em Python (só biblioteca padrão),
   com `--simular` e `--json`; os apps gráficos são interfaces sobre esses comandos.
6. **Um pacote Debian**, `vorticis-sistema`, contém tudo o que é do Vorticis — a ISO o instala e as
   atualizações o substituem.

## A área de trabalho em camadas

O `vorticis-shell` cria superfícies com o protocolo *wlr-layer-shell*, cada uma carregando a mesma
página (`shell/index.html`) num modo diferente:

| Camada | Modo | Conteúdo |
|---|---|---|
| BACKGROUND | `papel` | fundo animado e relógio grande |
| TOP | `barra` | barra de tarefas (reserva espaço na tela) |
| OVERLAY | `painel` | menu, personalização ou menu de contexto — criada ao abrir, do tamanho do painel, destruída ao fechar |

As camadas conversam pela ponte `window.webkit.messageHandlers.vorticis`: abrir apps, abrir
painéis, sincronizar preferências entre camadas, energia e posição da barra. A tecla Super chama a
ação `org.vorticis.Shell.menu` (`gapplication action`).

## Apps e a ponte segura

`vorticis-app NOME` abre um app (`shell/apps/NOME/index.html`) numa janela WebKitGTK. O app chama
`Vorticis.executar(comando, argumentos)`; o `vorticis-app` só aceita:

- ferramentas da lista `PERMITIDOS` (`vorticis-apps`, `vorticis-dispositivos`, `vorticis-diagnostico`,
  `vorticis-atualizar` etc.), executadas sem shell intermediário;
- `@terminal` — a mesma ferramenta, num terminal (ações demoradas ou que pedem senha);
- `@abrir` — outro app Vorticis.

Ações de administrador pedem a senha pelo polkit (`pkexec`, janela gráfica do `lxpolkit`).

## Atualizações

```
releases do GitHub ──► vorticis-atualizar ──► SHA-256 confere? ──► apt install vorticis-sistema_X.deb
   (ISO, .deb, .sha256)      ▲                                              │
                             │ timer de usuário a cada 12 h                 └► vorticis-apps atualizar
                             │ (aviso na área de trabalho)                      (apt, Flatpak, Waydroid, fwupd)
```

As atualizações de segurança do Debian seguem automáticas (`unattended-upgrades`).

## Dispositivos, drivers e diagnóstico

- `vorticis-dispositivos` lê o hardware do `/sys` (PCI, USB, discos, rede, Bluetooth, entrada,
  câmeras, som, monitores via EDID, bateria) e oferece ações (rfkill, autorização USB, recarregar
  módulo, ejetar via udisks).
- `vorticis-drivers` cruza o hardware com regras próprias, o `isenkram`, o firmware que o kernel
  pediu e não achou e o `nvidia-detect`; cada sugestão diz quais dispositivos a pedem, o que permite
  procurar drivers por dispositivo no app Dispositivos. Firmware/BIOS: `fwupd` (LVFS).
- `vorticis-diagnostico` reúne 16 verificações e correções conhecidas.

## Fluxo de inicialização

```
UEFI/BIOS → GRUB (splash Vorticis) → kernel + initramfs (Plymouth: o vórtice gira)
  → systemd → greetd → vorticis-sessao → labwc → vorticis-shell
  modo live: login automático (live-config) · instalado: tela de login
  primeiro boot instalado: vorticis-recursos aplicar + vorticis-drivers instalar --auto
```

## Instalação

O Calamares (com a identidade Vorticis) copia o sistema do pen-drive, cria usuários, instala o
GRUB de plataforma conforme o firmware (UEFI ou BIOS, a partir de pacotes guardados na imagem),
configura criptografia (opcional), Plymouth e initramfs, e remove os pacotes do modo live.

## Níveis de acesso

| Nível | Grupos | Pode |
|---|---|---|
| Administrador | `sudo`, `vorticis-admin`, `netdev`, `lpadmin` | tudo, com senha |
| Padrão | `vorticis-padrao`, `audio`, `video`, `netdev` | instalar apps Flatpak/Wine/Android só para si, trocar Wi-Fi |
| Convidado | `vorticis-convidado` | usar apps; pasta pessoal apagada ao sair; sem rede local |
| Infantil | `vorticis-infantil` | só apps permitidos, horário limitado, DNS com filtro familiar |

Regras em `/etc/polkit-1/rules.d/50-vorticis.rules`; horários e limpeza do convidado por um perfil
do `pam-auth-update` (instalados por `vorticis-usuarios configurar`).

## Onde está cada coisa

Veja a estrutura completa do repositório no [Guia de desenvolvimento](DESENVOLVIMENTO.md).
