# Compatibilidade híbrida — Linux, Windows e Android

O Vorticis foca em três plataformas. O suporte a macOS foi retirado na versão 0.2: a única
camada existente (Darling) rodava apenas programas de linha de comando, e a licença da Apple
não permite o macOS fora de hardware Apple.

| Plataforma | Tecnologia | Nível | Observações |
|---|---|---|---|
| **Linux** | nativo: `.deb`, Flatpak (Flathub), AppImage; `.rpm` via Distrobox | ★★★★★ | Central de Apps com 60+ apps selecionados, busca no Flathub e no Debian |
| **Windows — programas** | Wine 10 + receitas automáticas (winetricks) | ★★★★☆ | Prefixo isolado por programa; ajustes automáticos para Office 2013/2016, Photoshop CS6, apps .NET, jogos DirectX |
| **Windows — o que o Wine não roda** | VM Windows (KVM/quickemu) com janelas integradas (RemoteApp/FreeRDP) | ★★★★☆ | Office 2019/2021/365, AutoCAD, Adobe CC: rodam no Windows real, mas cada programa aparece como janela normal do Vorticis |
| **Windows — jogos** | Steam + Proton, Heroic (Epic/GOG), Lutris, DXVK/VKD3D, Proton-GE | ★★★★☆ | Ver protondb.com |
| **Jogos com anti-cheat** | Runtimes oficiais EAC e BattlEye do Proton | ★★★☆☆ | Funciona quando o estúdio ativa (ex.: Elden Ring, DayZ, ARK). `vorticis-jogos verificar "jogo"` consulta o banco público |
| **Android** | Waydroid (LineageOS em contêiner, mesmo kernel) | ★★★★☆ | Nativo, sem emulador. Dois cliques em `.apk` instalam |
| **Web** | Firefox (na ISO); Chromium, Chrome, Brave, Edge, Opera, Vivaldi pela Central | ★★★★★ | Microsoft 365 web vira app em janela própria |

## Anti-cheat: o que é possível de verdade

| Anti-cheat | Situação no Vorticis |
|---|---|
| Easy Anti-Cheat, BattlEye | ✔ Funcionam pelo Proton **se o estúdio do jogo ativar** o suporte. A Steam baixa o runtime sozinha |
| Riot Vanguard (Valorant, LoL), FACEIT, Ricochet (CoD), Javelin (EA), Hyperion e outros de kernel | ✘ Exigem Windows de propósito. Nenhuma camada contorna isso, e tentar burlar leva a **banimento** |

Para os jogos bloqueados, `vorticis-jogos alternativas "jogo"` sugere jogo em nuvem
(GeForce NOW, Xbox Cloud, Boosteroid), dual boot com Windows ou versão Android.

## Office

| Opção | Comando | Quando usar |
|---|---|---|
| ONLYOFFICE | `vorticis-compat office onlyoffice` | Visual parecido com o MS Office, ótima fidelidade com .docx/.xlsx/.pptx |
| LibreOffice | `vorticis-compat office libreoffice` | Suíte completa e livre |
| Microsoft 365 web | `vorticis-compat office web` | Word/Excel/PowerPoint/Outlook como apps em janela (conta Microsoft) |
| Office 2013/2016 pelo Wine | `vorticis-compat instalar setup.exe --receita office-2016` | Você tem o instalador e a licença |
| Office completo na VM | `vorticis-compat office vm` | Office 2019/2021/365 de desktop, com macros e suplementos |

As fontes Carlito/Caladea (métricas idênticas a Calibri/Cambria) vêm na ISO; as fontes
Microsoft clássicas instalam com `vorticis-compat preparar fontes`.

## Como o usuário instala

Dois cliques em qualquer arquivo — ou `vorticis-compat instalar <arquivo>`:

| Arquivo | Destino |
|---|---|
| `.exe`, `.msi` | Wine com prefixo próprio + receita automática; atalho no menu |
| `.apk`, `.xapk` | `waydroid app install` |
| `.deb` | `apt install ./arquivo` (pede senha de administrador) |
| `.rpm` | Distrobox Fedora |
| `.AppImage` | `~/Aplicativos` + atalho |
| `.flatpakref`, `.flatpak` | `flatpak install` |

Para manter a ISO leve (< 2 GB), Wine, Steam e Waydroid são instalados **na primeira vez
que forem necessários**: abrir o primeiro `.exe` já oferece a instalação (uma única vez).
