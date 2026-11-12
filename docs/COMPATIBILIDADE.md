# Compatibilidade híbrida — o que é possível de verdade

| Plataforma | Tecnologia | Nível | Observações |
|---|---|---|---|
| **Linux** | nativo: `.deb`, Flatpak (Flathub), AppImage, `.rpm` (via `alien`/Distrobox) | ★★★★★ | Distrobox permite rodar apps de Fedora/Arch/Ubuntu em contêiner |
| **Windows — apps** | Wine 10 + Bottles | ★★★★☆ | Maioria de apps de escritório/utilitários funcionam; checar appdb.winehq.org |
| **Windows — jogos** | Steam + Proton, Heroic (Epic/GOG), Lutris, DXVK/VKD3D | ★★★★☆ | Ver protondb.com. Jogos com anti-cheat de kernel (Valorant, alguns Call of Duty) **não** rodam |
| **Android** | Waydroid (LineageOS em contêiner LXC, mesmo kernel) | ★★★★☆ | Nativo, sem emulação em x86. Google Play exige certificação manual; apps ARM usam tradução (libndk/libhoudini) |
| **macOS** | Darling (camada tipo Wine) | ★☆☆☆☆ | Apenas ferramentas de linha de comando. Apps gráficos não funcionam |
| **macOS (VM)** | QEMU/KVM — opcional | — | A licença da Apple só permite macOS em hardware Apple. O Vorticis **não** distribui imagens macOS |
| **Web** | Firefox, Chromium, Chrome, Brave, Edge, Opera, Vivaldi | ★★★★★ | PWAs viram apps no lançador |

## Como o usuário instala

Dois cliques em qualquer arquivo — ou `vorticis-compat instalar <arquivo>`:

| Arquivo | Destino |
|---|---|
| `.exe`, `.msi` | prefixo Wine dedicado por app (`~/.local/share/vorticis/wine/<app>`), atalho no lançador |
| `.apk`, `.xapk` | `waydroid app install` (inicia o contêiner se preciso) |
| `.deb` | `apt install ./arquivo` (exige Administrador) |
| `.rpm` | Distrobox Fedora, exporta o app para o lançador |
| `.AppImage` | move para `~/Aplicativos`, torna executável, cria atalho |
| `.flatpakref`, `.flatpak` | `flatpak install --user` |
| `.dmg`, `.pkg` | Darling (aviso de compatibilidade limitada) |

## Jogos

O perfil **Gamer** da barra de tarefas fixa Steam, Heroic e Lutris, ativa `gamemode` e o
overlay `mangohud`, e muda o perfil de energia para desempenho enquanto um jogo roda.
