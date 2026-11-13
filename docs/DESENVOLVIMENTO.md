# Guia de desenvolvimento

Como o código do Vorticis SO está organizado, como testar e como publicar uma versão.
Para a visão geral, veja [Arquitetura](ARQUITETURA.md); para os comandos, a [Referência](REFERENCIA.md).

## Estrutura do repositório

```
tools/                 ferramentas do sistema (vorticis-*), Python 3 só com a biblioteca padrão
  compat/receitas.json receitas de compatibilidade Windows (winetricks)
shell/                 área de trabalho e apps (HTML/CSS/JS renderizados pelo WebKitGTK)
  index.html, js/, css/  shell: barra, menu, personalização, papel de parede animado
  js/logo.js             gerador do ícone do sistema (fonte única da marca)
  themes/                temas (JSON) e perfis da barra
  apps/<app>/            apps Vorticis (music, video, central, configuracoes, dispositivos,
                         diagnostico, monitor, notas, calculadora, ajuda); apps/comum = base
  vorticis-shell         camadas layer-shell (papel, barra, painéis) + ponte JS ↔ sistema
  vorticis-app           janela de um app Vorticis + ponte com lista de comandos permitidos
  vorticis-sessao        início da sessão gráfica (GPU ou software, recuperação de falhas)
  desktop/               atalhos .desktop
pacote/                pacote Debian vorticis-sistema (gerar-deb.sh, raiz/ com arquivos fixos, DEBIAN/)
branding/              gerar-logo.js → PNG/ICO/SVG, splash do boot, Plymouth, Calamares
security/              firewall (nftables), DNS, privacidade de rede, sysctl
build/                 build da ISO (live-build): build.sh, listas de pacotes, hooks, bootloaders
installer/             Calamares (instalador gráfico), instaladores para Windows e Linux
docs/                  documentação (também exibida pelo app Ajuda)
.github/workflows/     CI: verificações, ISO e publicação de releases
```

## Princípios

- **Ferramentas primeiro, interface depois**: toda função existe como comando `vorticis-*`
  (testável, documentado em `--help`); os apps gráficos chamam esses comandos.
- **`--simular`** em todo comando que altera o sistema; **`--json`** em todo comando que um app lê.
- **Sem dependências extras** nas ferramentas (biblioteca padrão do Python).
- **Segurança da ponte**: um app só executa as ferramentas da lista `PERMITIDOS` do
  `vorticis-app` (e `@terminal`/`@abrir`), nunca comandos livres. O shell só abre comandos do
  próprio catálogo (`APPS` em `shell/js/shell.js`), sem passar por um shell.
- **Português do Brasil** em código, mensagens e documentação.

## Rodando a interface no navegador

```
python3 -m http.server 8080        # na raiz do repositório
# http://localhost:8080/shell/            área de trabalho (apps abrem em janelas de demonstração)
# http://localhost:8080/shell/apps/dispositivos/   um app isolado
```

Fora do Vorticis, `Vorticis.executar()` (shell/apps/comum/app.js) devolve dados de
demonstração definidos em cada app; dentro do SO, a ponte executa o comando real.

Modos do shell pela URL: `?modo=papel`, `?modo=barra`, `?modo=painel&painel=menu|config|ctx-app`
(como as camadas do SO) e `?live=1` (simula o pen-drive, com o atalho do instalador).

## As ferramentas

Cada `tools/vorticis-*` é um programa independente. Convenções:

```python
"""vorticis-exemplo — resumo de uma linha (aparece na Referência).

Uso:
  vorticis-exemplo acao [--json] [--simular]
"""
```

Depois de mudar a docstring, regenere a referência: `python3 docs/gerar-referencia.py`
(o CI falha se ela estiver desatualizada).

Para disponibilizar um comando novo a um app, adicione-o a `PERMITIDOS` em `shell/vorticis-app`.

## O pacote vorticis-sistema

`pacote/gerar-deb.sh VERSÃO SAÍDA` monta `vorticis-sistema_VERSÃO_all.deb` com ferramentas,
shell, apps, docs, ícones, Plymouth, serviços systemd e configurações (`/etc` vira conffile:
alterações do usuário são preservadas nas atualizações). O `postinst` liga o firewall, o
primeiro boot e a verificação automática de atualizações.

É esse pacote que a ISO instala e que o `vorticis-atualizar` baixa das releases (conferindo o
`.sha256`) para atualizar sistemas já instalados.

Arquivos que pertencem a outros pacotes Debian (`/etc/greetd/config.toml`, `/etc/issue`,
`/etc/os-release`) e coisas só do modo live ficam em `build/config/includes.chroot`.

## Marca e ícones

O ícone vem de `shell/js/logo.js`. Depois de alterá-lo:

```
node branding/gerar-logo.js     # requer rsvg-convert e ImageMagick
```

Isso atualiza PNG/ICO/SVG, ícones do pacote, Plymouth, Calamares, splash do boot e o
`autorun.inf`/ícone da raiz da ISO.

## Gerando a ISO

Em Debian 13 (ou contêiner `debian:trixie --privileged`), como root:

```
apt install live-build
cd build && ./build.sh                 # VORTICIS_VERSAO=0.3.0 ./build.sh para outra versão
```

Saídas em `build/`: a ISO, o pacote `vorticis-sistema_*.deb` e os `.sha256`.
`./build.sh --limpar` apaga a área de trabalho do live-build.

Observações aprendidas no caminho:

- Hooks ficam em `build/config/hooks/live/`; o live-build só os executa se
  `config/hooks/normal/` também tiver hooks (o `build.sh` cuida disso).
- `--apt-recommends false` deixa a ISO leve, mas exige listar pacotes como `user-setup`
  (cria o usuário do modo live) e `qt6-wayland` (instalador no Wayland).
- O GRUB "de plataforma" (UEFI/BIOS) vai como `.deb` dentro da imagem e é instalado pelo
  Calamares conforme o firmware (`shellprocess-vorticis.conf`).
- Cuidado com montagens dentro de `chroot/` ao testar: `lb clean` apaga o que estiver montado nele.

## Testes

| O quê | Como |
|---|---|
| Ferramentas | `python3 -m pyflakes tools/vorticis-*`; `--help` e `--simular` de cada comando |
| Scripts shell | `shellcheck -S warning` (o CI roda) |
| JavaScript | `node --check`; telas com Playwright (Chromium vem no ambiente de CI/dev) |
| Firewall | `nft -c -f security/nftables.conf` |
| Referência | `python3 docs/gerar-referencia.py --verificar` |
| Sessão real sem tela | compositor `labwc` com `WLR_BACKENDS=headless WLR_RENDERER=pixman` no chroot do build |
| Sistema completo | boot da ISO no QEMU (UEFI: OVMF); o monitor do QEMU permite `screendump` e `sendkey` |

## Publicando uma versão

1. Atualize `docs/NOTAS-DA-VERSAO.md` (vira o texto da release).
2. Rode o workflow **CI** manualmente com `publicar_versao` = `X.Y.Z` (ou crie a tag `vX.Y.Z`).
3. O CI gera a ISO e o pacote, confere o tamanho (limite de 2 GiB por arquivo) e publica a release
   com a ISO, o `vorticis-sistema_X.Y.Z_all.deb`, os `.sha256` e os instaladores.

Sistemas instalados recebem a versão nova pelo `vorticis-atualizar` (aviso na área de trabalho).
