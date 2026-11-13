# Manual do Vorticis SO

Bem-vindo! Este manual explica como instalar e usar o Vorticis SO no dia a dia. Ele também está
dentro do sistema, no app **Ajuda** (menu → Ajuda), com busca.

Sumário: [Instalação](#instalação) · [Área de trabalho](#área-de-trabalho) ·
[Personalização](#personalização) · [Aplicativos](#aplicativos) ·
[Programas de Windows e Android](#programas-de-windows-e-android) · [Jogos](#jogos) ·
[Dispositivos e drivers](#dispositivos-e-drivers) · [Telas e monitores](#telas-e-monitores) ·
[Atualizações](#atualizações) · [Diagnóstico](#diagnóstico) · [Backup e restauração](#backup-e-restauração) ·
[Usuários](#usuários) · [Rede e segurança](#rede-e-segurança) · [Atalhos de teclado](#atalhos-de-teclado) ·
[Solução de problemas](#solução-de-problemas)

---

## Instalação

### Requisitos

- Processador de 64 bits (x86-64) com 2 núcleos e 2 GB de memória (4 GB recomendados)
- 20 GB livres no disco
- Pen-drive de 4 GB ou mais, ou um Windows/Linux em funcionamento (ver abaixo)

### 1. Pelo pen-drive

1. Baixe a ISO mais recente em [Releases](https://github.com/hellisonvidal/Vorticis-SO/releases) e confira o arquivo `.sha256`.
2. Grave no pen-drive com **balenaEtcher**, **Ventoy** ou **Rufus** (modo DD). No Linux: `sudo dd if=vorticis-*.iso of=/dev/sdX bs=4M status=progress`.
3. Reinicie o computador e escolha o pen-drive no menu de boot (geralmente **F12**, **F11** ou **Esc**).
4. O Vorticis abre direto na área de trabalho (modo live), sem pedir senha. Nada é alterado no seu disco.
5. Clique em **Instalar Vorticis SO** (primeiro ícone da barra) e siga o instalador.

### 2. A partir do Windows (sem pen-drive)

Baixe `Instalar-Vorticis.ps1` nas Releases, abra o **PowerShell como administrador** e rode:

```
powershell -ExecutionPolicy Bypass -File .\Instalar-Vorticis.ps1 -EspacoGB 80
```

O script reduz o disco C:, cria uma pequena partição com o instalador e agenda um boot no Vorticis.
Depois de reiniciar, escolha **Instalar ao lado do Windows** no instalador. Requer UEFI. Se o
BitLocker estiver ativo, tenha a chave de recuperação em mãos. Use `-Simular` para ver os passos antes.

### 3. A partir de um Linux

```
sudo sh vorticis-instalar-daqui                  # cria uma entrada no menu de boot (não particiona nada)
sudo sh vorticis-instalar-daqui --pendrive /dev/sdX   # ou grava um pen-drive
```

### O instalador

- **Instalar ao lado** mantém o sistema atual (Windows/Linux) e mostra um menu na inicialização.
- **Apagar disco** usa o disco inteiro para o Vorticis.
- O sistema de arquivos padrão é o **Btrfs**, que permite pontos de restauração.
- Você pode marcar **Criptografar o sistema**: será pedida uma senha a cada inicialização.
- O primeiro usuário criado é o **Administrador**.

No primeiro boot depois de instalar, o Vorticis ajusta a memória e instala sozinho os drivers e
firmwares recomendados para o seu hardware (precisa de internet).

## Área de trabalho

- **Botão do menu** (o vórtice, no canto da barra) ou a tecla **Super** (Windows): abre o menu com
  todos os apps, separados por categoria, e uma busca. Digite e tecle **Enter** para abrir o primeiro resultado.
- **Barra de tarefas**: apps fixados, apps abertos (um traço embaixo do ícone), bandeja com perfil,
  rede, volume, bateria e relógio.
- **Botão direito** num app (menu ou barra): abrir, fixar/desafixar, mover para a esquerda/direita.
- **Botão direito na área de trabalho**: trocar tema, fundo e resolução.
- O **fundo de água** reage ao mouse. Em computadores sem placa de vídeo dedicada ele usa um
  modo leve automaticamente; na bateria fraca, a animação pausa.

### Perfis da barra

Em Personalização → Perfil: **Básico**, **Trabalho**, **Gamer** (liga o modo desempenho),
**Desenvolvedor** e **Infantil**. Cada perfil tem seus apps fixados e o tamanho da barra.

## Personalização

Abra pelo menu (ícone 🎨) ou com **Super+P**.

| Aba | O que muda |
|---|---|
| Tema | 12 temas (água, bolhas, aurora e estáticos) e a cor de destaque |
| Fundo | Qualidade da animação (automática, GPU, leve, estática), imagem própria, relógio grande |
| Ícones | Estilo (arredondado, círculo, quadrado, sem fundo, monocromático), tamanho, animação e o **ícone do sistema** (5 formatos, 10 cores) — por padrão ele segue o tema |
| Barra | Posição (embaixo/em cima), alinhamento, tamanho, nomes dos apps, transparência, ocultar automaticamente, relógio 12/24 h |
| Perfil | Perfil da barra e restaurar os apps fixados |

## Aplicativos

| App | Para quê |
|---|---|
| **Central de Apps** | Instalar, remover e atualizar apps (Linux, Windows e Android) |
| **Vorticis Music** | Músicas, com capas, favoritos, equalizador e visualizador |
| **Vorticis Video Player** | Vídeos e filmes, com legendas .srt, velocidade e janela flutuante |
| **Configurações** | Tela, atualizações, dispositivos, rede, usuários, desempenho, backup, Windows/Android, jogos |
| **Dispositivos** | Todo o hardware, drivers e firmware |
| **Diagnóstico** | Verifica o sistema e corrige problemas |
| **Monitor** | Uso de processador, memória, disco e rede; encerrar programas travados |
| **Notas** e **Calculadora** | Anotações rápidas e contas |
| **Ajuda** | Este manual, com busca |

### Instalar um aplicativo

1. Abra a **Central de Apps**, procure pelo nome ou navegue pelas categorias.
2. Clique em **Instalar**. Pode ser pedida a senha de administrador.

Arquivos baixados também funcionam com **dois cliques**: `.deb`, `.rpm`, `.AppImage`, `.flatpakref`,
`.exe`/`.msi` (Windows) e `.apk` (Android).

## Programas de Windows e Android

Veja os detalhes em [Programas de Windows e Android](COMPATIBILIDADE.md).

- **Programas de Windows** rodam pelo Wine, cada um isolado. Na primeira vez que você abrir um
  `.exe`, o Vorticis oferece instalar o Wine (uma vez só). Office 2013/2016, Photoshop CS6 e apps
  .NET recebem ajustes automáticos.
- **O que não roda no Wine** (Office 365, AutoCAD, Adobe CC) pode usar a **VM Windows integrada**:
  Configurações → Windows e Android → Windows integrado.
- **Office**: ONLYOFFICE e LibreOffice (abrem .docx/.xlsx/.pptx), Microsoft 365 web como app,
  Office 2013/2016 pelo Wine ou Office completo na VM.
- **Apps Android** rodam no Waydroid. Configurações → Windows e Android → Apps Android; depois,
  dois cliques em qualquer `.apk`.

## Jogos

1. Configurações → Jogos e anti-cheat → **Steam + Proton + anti-cheat**.
2. Na Steam: Configurações → Compatibilidade → ative o Steam Play para todos os títulos.
3. Antes de comprar um jogo online, verifique o anti-cheat: Configurações → Jogos → **Verificar jogo**.

Jogos com Easy Anti-Cheat ou BattlEye funcionam quando o estúdio ativa o suporte. Valorant,
Call of Duty, FACEIT e outros com anti-cheat de kernel **não** funcionam fora do Windows; para eles,
use jogo em nuvem (GeForce NOW, Xbox Cloud) ou mantenha o Windows num boot separado.

O perfil **Gamer** da barra liga o modo desempenho automaticamente.

## Dispositivos e drivers

Abra o app **Dispositivos** (menu → Sistema → Dispositivos).

- O hardware aparece por categoria: processador, vídeo, monitores, som, rede, Bluetooth,
  armazenamento, USB, teclado/mouse, câmeras, impressoras e bateria.
- Bolinha **verde**: funcionando · **amarela**: sem driver ou atenção · **cinza**: desativado.
- Clique num dispositivo para ver as propriedades (fabricante, modelo, driver, endereço).
- **Procurar driver**: mostra os drivers e firmwares recomendados *para aquele dispositivo*, com
  o botão **Instalar**.
- **Procurar drivers** (no topo): verifica o computador inteiro, instala todos os recomendados,
  atualiza **BIOS e firmware** (LVFS) e oferece um **kernel mais recente** para hardware muito novo.
- Outras ações: **desativar/ativar** (Wi-Fi, Bluetooth, USB, rede), **reiniciar driver** e
  **remover com segurança** (pen-drives e HDs externos).

Placas NVIDIA: para GTX 16xx/RTX 20xx ou mais novas, o Vorticis recomenda o módulo aberto da NVIDIA.
Depois de instalar um driver de vídeo, reinicie o computador.

## Telas e monitores

Configurações → **Tela e resolução**:

- **Melhor resolução automática**: resolução nativa, maior taxa de atualização (ex.: 144 Hz) e
  escala certa para telas de alta densidade.
- **Espelhar** ou **estender** vários monitores. A configuração é lembrada e reaplicada quando o
  monitor é conectado de novo.
- **Definir manualmente** qualquer resolução, taxa e escala, ou **criar um modo personalizado**.
- **Menu de boot**: resolução da tela de inicialização.

## Atualizações

O Vorticis se atualiza por dentro do sistema, em três níveis:

1. **Segurança do Debian**: instaladas automaticamente, sem você precisar fazer nada.
2. **Aviso de novidades**: a cada 12 horas o Vorticis verifica se há uma nova versão do Vorticis,
   atualizações do sistema, apps ou firmware, e mostra um aviso na área de trabalho com o botão
   **Atualizar agora**.
3. **Manual**: Central de Apps → **Atualizações**, ou Configurações → **Atualizações**.

Uma nova versão do Vorticis é baixada das releases oficiais e **conferida (SHA-256)** antes de
instalar. Depois de atualizar, saia e entre de novo para ver as novidades da área de trabalho.
Para desligar o aviso: Configurações → Atualizações → Verificação automática → Desligar.

## Diagnóstico

O app **Diagnóstico** verifica o sistema inteiro e dá uma nota de 0 a 100:

| Área | O que verifica |
|---|---|
| Sistema | serviços com falha, pacotes quebrados, relógio, atualizações |
| Armazenamento | espaço livre em cada disco, saúde dos discos (SMART) |
| Desempenho | memória disponível, memória comprimida (zram) |
| Hardware | temperatura, erros do kernel, saúde da bateria |
| Dispositivos | dispositivos sem driver, firmware faltando |
| Rede e segurança | internet, DNS, firewall, isolamento de apps, Secure Boot |
| Proteção | pontos de restauração |

Problemas com correção conhecida têm o botão **Corrigir**. **Salvar relatório** gera um arquivo
na sua pasta pessoal para pedir ajuda (não inclui senhas nem arquivos pessoais).

## Backup e restauração

Configurações → **Backup e restauração**:

- **Criar ponto de restauração** antes de mudanças grandes; **pontos automáticos** a cada hora.
- **Restaurar sistema**: volta o sistema a um ponto anterior (seus arquivos pessoais não são afetados).
- **Copiar pasta pessoal** para um HD externo (cópia incremental).

## Usuários

Configurações → **Usuários**. Níveis de acesso:

| Nível | Pode |
|---|---|
| Administrador | tudo, com a própria senha |
| Padrão | usar e instalar apps só para si, trocar de Wi-Fi |
| Convidado | usar o computador sem senha; tudo é apagado ao sair |
| Infantil | apps permitidos, horário limitado e sites com filtro familiar |

## Rede e segurança

Desde o primeiro minuto: **firewall** bloqueando conexões de entrada, **DNS criptografado**,
endereço de rede aleatório em cada Wi-Fi (privacidade), **AppArmor** isolando apps e atualizações
de segurança automáticas. Para abrir uma porta (ex.: um servidor), use Configurações → Rede e segurança.

## Atalhos de teclado

| Atalho | Ação |
|---|---|
| Super | abrir o menu |
| Super+P | personalização |
| Super+Enter | terminal |
| Super+E | arquivos |
| Super+Espaço | lançador rápido |
| Super+L | bloquear a tela |
| Super+← / → / ↑ | encaixar à esquerda / à direita / maximizar |
| Alt+Tab | alternar janelas |
| Alt+F4 | fechar janela |
| Print | captura de tela (salva em Imagens) |

## Solução de problemas

**A tela ficou preta ao iniciar.** O Vorticis tenta de novo em modo de vídeo por software. Se não
abrir, escolha *fail-safe mode* no menu de boot do pen-drive. No sistema instalado, entre num
terminal (Ctrl+Alt+F2) e veja `~/.cache/vorticis-sessao.log`.

**O Wi-Fi não aparece.** Abra **Dispositivos**: se a placa estiver amarela (sem driver), clique em
**Procurar driver**. Sem internet, use um cabo de rede ou o celular por USB (ancoragem).

**Sem som / sem Bluetooth.** Dispositivos → selecione o dispositivo → **Reiniciar driver**.

**Um programa travou.** Abra o **Monitor**, selecione o programa e clique em **Encerrar**.

**O sistema está lento ou sem espaço.** Abra o **Diagnóstico** e use **Corrigir** nos avisos, ou
Configurações → Desempenho → Liberar espaço.

**Algo parou de funcionar depois de uma atualização.** Configurações → Backup e restauração →
Restaurar sistema (escolha um ponto anterior à atualização).

**Esqueci a senha.** Peça a outro administrador para redefinir em Configurações → Usuários. Se
você for o único administrador, inicie pelo pen-drive e use `passwd` no sistema instalado.

**Pedir ajuda:** Diagnóstico → **Salvar relatório** e abra uma issue em
[github.com/hellisonvidal/Vorticis-SO/issues](https://github.com/hellisonvidal/Vorticis-SO/issues)
anexando o relatório.
