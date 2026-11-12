# Roteiro

## v0.1 "Nascente" — fundação (este commit)
- [x] Estrutura do projeto e documentação
- [x] Protótipo do shell: água interativa, 3 níveis de qualidade, barra adaptável, temas
- [x] Configuração live-build da ISO
- [x] Ferramentas: compat, drivers, recursos, usuários, navegadores
- [x] Segurança de rede padrão
- [x] Instalador Calamares + instalação a partir de Linux/Windows ativo

## v0.2 "Correnteza" — primeira ISO inicializável
- [ ] Gerar ISO em CI (GitHub Actions, container Debian privilegiado)
- [ ] Testar boot em QEMU (UEFI e BIOS) automaticamente
- [ ] Empacotar o shell como `.deb` (`vorticis-shell`) com janela WebKitGTK + layer-shell
- [ ] Tema GRUB e Plymouth "gota d'água"
- [ ] Tela de login greetd com o mesmo tema

## v0.3 "Maré alta" — experiência
- [ ] Central de Configurações gráfica (temas, usuários, drivers, rede)
- [ ] Editor de temas e loja de temas animados
- [ ] Gerenciador de janelas na barra (integração wlr-foreign-toplevel)
- [ ] Notificações e central de controle rápido

## v1.0 "Oceano"
- [ ] Atualizações atômicas com rollback (snapshots Btrfs + snapper)
- [ ] Assinatura de pacotes e Secure Boot com chave própria
- [ ] Tradução para inglês e espanhol
