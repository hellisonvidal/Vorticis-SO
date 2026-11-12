# Arquitetura do Vorticis SO

```
┌───────────────────────────────────────────────────────────────────────┐
│  Vorticis Shell (área de trabalho, barra, 12 temas, personalização)   │
│  Apps Vorticis: Music · Video · Central de Apps · Configurações ·     │
│                 Monitor · Notas · Calculadora   (vorticis-app)        │
├─────────────────┬─────────────────┬─────────────────┬─────────────────┤
│ Apps Linux      │ Apps Windows    │ Apps Android    │ Web apps        │
│ deb/Flatpak/    │ Wine + receitas │ Waydroid        │ navegadores,    │
│ AppImage/rpm    │ Proton · VM     │ (contêiner)     │ Microsoft 365   │
├─────────────────┴─────────────────┴─────────────────┴─────────────────┤
│  vorticis-compat / vorticis-apps → camada certa para cada programa    │
├───────────────────────────────────────────────────────────────────────┤
│  Ferramentas: drivers · tela · recursos · usuários · rede · backup ·  │
│               jogos · navegadores · sistema · mídia                   │
├───────────────────────────────────────────────────────────────────────┤
│  Segurança: nftables · AppArmor · DNS-over-TLS · polkit · sudo        │
├───────────────────────────────────────────────────────────────────────┤
│  systemd · PipeWire · NetworkManager · Mesa/Vulkan · fwupd            │
├───────────────────────────────────────────────────────────────────────┤
│  Kernel Linux (Debian 13) + firmware                                   │
└───────────────────────────────────────────────────────────────────────┘
```

## Decisões principais

1. **Kernel Linux / base Debian 13.** Suporte a hardware, segurança e atualizações maduras. Debian
   é estável e tem `live-build` para gerar ISOs reprodutíveis.
2. **Sessão Wayland com `labwc`** (compositor leve, ~20 MB de RAM) e fallback X11. O shell do Vorticis
   roda por cima: papel de parede vivo, barra de tarefas e lançador.
3. **Shell e apps Vorticis em tecnologia web renderizada por WebKitGTK** (não Electron — reaproveita a engine do sistema
   e economiza memória). O fundo de água usa WebGL com **três níveis de qualidade**:
   - `alto`: simulação de ondas em GPU (WebGL, shader de refração);
   - `leve`: simulação em Canvas 2D com resolução reduzida (CPU);
   - `estatico`: imagem/gradiente, zero custo — escolhido automaticamente sem GPU ou na bateria fraca.

   Além da água, há os efeitos "bolhas" e "aurora", com os mesmos níveis de qualidade. Os apps
   Vorticis só executam ferramentas `vorticis-*` (lista fixa no `vorticis-app`), nunca comandos livres.
4. **Compatibilidade por camadas, não por emulação total.** Wine/Proton traduzem chamadas do Windows
   em tempo real (desempenho quase nativo, inclusive jogos via DXVK/VKD3D). Waydroid executa Android
   em contêiner com o mesmo kernel — nativo, sem emulador. O que o Wine não roda (Office 365,
   AutoCAD...) vai para uma VM Windows com janelas integradas. Ver [COMPATIBILIDADE.md](COMPATIBILIDADE.md).
5. **Ferramentas próprias em Python 3** (sem dependências fora da biblioteca padrão), fáceis de auditar,
   com modo `--simular` para mostrar o que seria feito antes de mudar o sistema.

## Fluxo de inicialização

```
UEFI/BIOS → GRUB (tema Vorticis) → kernel + initramfs (Plymouth "gota d'água")
  → systemd → greetd + tela de login Vorticis → labwc → vorticis-shell
  → serviços de primeiro boot: vorticis-drivers --auto, vorticis-recursos aplicar
```

## Níveis de acesso

| Nível | Grupos | Pode |
|---|---|---|
| Administrador | `sudo`, `vorticis-admin`, `netdev`, `lpadmin` | tudo, com senha |
| Padrão | `vorticis-padrao`, `audio`, `video`, `netdev` | instalar apps Flatpak/Wine/Android só para si, trocar Wi-Fi |
| Convidado | `vorticis-convidado` | usar apps; home apagada no logout; sem rede local |
| Infantil | `vorticis-infantil` | só apps da lista permitida, horário limitado, DNS com filtro familiar |

As regras ficam em `/etc/polkit-1/rules.d/50-vorticis.rules` (instalado por `vorticis-usuarios`).

## Estrutura do repositório

```
build/       live-build: pacotes, hooks, arquivos copiados para a ISO
shell/       área de trabalho (HTML/JS/CSS), temas, apps Vorticis (shell/apps), lançadores
tools/       vorticis-apps, -compat, -drivers, -tela, -recursos, -usuarios, -rede, -backup,
             -jogos, -navegadores, -sistema, -midia
installer/   Calamares (pen-drive) + instaladores a partir de Linux/Windows ativos
security/    nftables, resolved, NetworkManager, AppArmor
docs/        esta documentação
```
