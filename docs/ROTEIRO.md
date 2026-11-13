# Roteiro

## v0.1 "Nascente" — fundação ✔
- [x] Estrutura, documentação, shell com água interativa, ferramentas básicas, segurança, instaladores

## v0.2 "Correnteza" — primeiro instalador ✔
- [x] ISO gerada (Debian 13 + live-build) e publicada nas releases pelo CI
- [x] 12 temas (água, bolhas, aurora, estáticos) e personalização de ícones e barra
- [x] Vorticis Music e Vorticis Video Player
- [x] Central de Apps (gerenciador de aplicativos) e ferramentas de sistema
- [x] Receitas Windows, VM Windows integrada, opções de Office, anti-cheat
- [x] Mais drivers e suporte a todas as resoluções (vorticis-tela)
- [x] macOS retirado: foco em Linux, Windows e Android

## v0.2.1 — identidade visual ✔
- [x] Ícone do sistema (vórtice) no menu, por tema ou à escolha (5 formatos, 10 paletas)
- [x] Ícone no menu de boot, na tela de inicialização (Plymouth), no instalador e no pen-drive
- [x] Login automático do pen-drive estável sem GPU; instalador abrindo pela sessão Wayland

## v0.3.0 — dispositivos, diagnóstico e atualizações ✔
- [x] Gerenciador de dispositivos com busca de drivers por dispositivo
- [x] Diagnóstico do sistema com correções e relatório
- [x] Pacote vorticis-sistema e atualizações por dentro do sistema
- [x] Documentação completa e app Ajuda
- [x] GRUB do sistema instalado (UEFI/BIOS) corrigido no instalador

## v0.4 "Maré alta" — experiência
- [ ] Teste automático de boot da ISO em QEMU (UEFI e BIOS) no CI
- [ ] Tela de login gráfica com o tema do usuário
- [ ] Lista de janelas abertas na barra no SO real (wlr-foreign-toplevel)
- [ ] Notificações e central de controle rápido (Wi-Fi, volume, brilho)
- [ ] Editor de temas e loja de temas da comunidade

## v1.0 "Oceano"
- [ ] Atualizações atômicas com rollback automático (Btrfs + snapper)
- [ ] Repositório e chave de assinatura próprios; Secure Boot com chave Vorticis
- [ ] Tradução para inglês e espanhol
