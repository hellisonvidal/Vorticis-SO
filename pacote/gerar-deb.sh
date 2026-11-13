#!/bin/sh
# Gera o pacote vorticis-sistema_<versão>_all.deb com os componentes do Vorticis SO:
# ferramentas (vorticis-*), área de trabalho e apps, ícones, temas, tela de boot,
# configurações de segurança e serviços. É o pacote atualizado pelo vorticis-atualizar.
# Uso: sh pacote/gerar-deb.sh VERSÃO PASTA_DE_SAÍDA
set -eu
VERSAO="${1:?informe a versão}"
SAIDA="${2:?informe a pasta de saída}"
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
P="$TMP/vorticis-sistema"
trap 'rm -rf "$TMP"' EXIT

mkdir -p "$P"
cp -a "$RAIZ/pacote/raiz/." "$P/"
install -d "$P/usr/bin" "$P/usr/lib/vorticis" "$P/usr/share/vorticis/compat" "$P/usr/share/applications" \
           "$P/etc/vorticis" "$P/usr/share/doc/vorticis-sistema"
for f in "$RAIZ"/tools/vorticis-*; do install -m 0755 "$f" "$P/usr/bin/"; done
install -m 0755 "$RAIZ/tools/vorticis-rede" "$P/usr/lib/vorticis/vorticis-rede"
install -m 0644 "$RAIZ/tools/compat/receitas.json" "$P/usr/share/vorticis/compat/"
cp -a "$RAIZ/shell" "$P/usr/share/vorticis/shell"
rm -rf "$P/usr/share/vorticis/shell/desktop"
for f in vorticis-shell vorticis-app vorticis-sessao; do install -m 0755 "$RAIZ/shell/$f" "$P/usr/bin/$f"; done
install -m 0644 "$RAIZ"/shell/desktop/*.desktop "$P/usr/share/applications/"
echo "$VERSAO" > "$P/usr/share/vorticis/versao"
# Documentação (também exibida pelo app Ajuda)
cp -a "$RAIZ/docs" "$P/usr/share/vorticis/docs"
cp "$RAIZ/README.md" "$P/usr/share/vorticis/docs/"
printf 'Vorticis SO — código próprio sob GPL-3.0-or-later.\nhttps://github.com/hellisonvidal/Vorticis-SO\n' > "$P/usr/share/doc/vorticis-sistema/copyright"
# Configurações de rede e segurança
install -m 0644 "$RAIZ/security/nftables.conf" "$P/etc/vorticis/nftables.conf"
install -D -m 0644 "$RAIZ/security/resolved.conf" "$P/etc/systemd/resolved.conf.d/90-vorticis.conf"
install -D -m 0644 "$RAIZ/security/networkmanager-privacidade.conf" "$P/etc/NetworkManager/conf.d/90-vorticis-privacidade.conf"
install -D -m 0644 "$RAIZ/security/sysctl-rede.conf" "$P/etc/sysctl.d/80-vorticis-rede.conf"
find "$P" -name __pycache__ -prune -exec rm -rf {} +

install -d "$P/DEBIAN"
install -m 0755 "$RAIZ/pacote/DEBIAN/postinst" "$RAIZ/pacote/DEBIAN/prerm" "$P/DEBIAN/"
(cd "$P" && find etc -type f | sed 's|^|/|' | sort) > "$P/DEBIAN/conffiles"
TAMANHO=$(du -sk --exclude=DEBIAN "$P" | cut -f1)
cat > "$P/DEBIAN/control" <<CTRL
Package: vorticis-sistema
Version: $VERSAO
Architecture: all
Maintainer: Projeto Vorticis <https://github.com/hellisonvidal/Vorticis-SO>
Installed-Size: $TAMANHO
Depends: python3, python3-gi, gir1.2-gtk-4.0, gir1.2-webkit-6.0, gir1.2-gtk4layershell-1.0, nftables, labwc
Recommends: flatpak, fwupd, power-profiles-daemon, libnotify-bin, pciutils, usbutils, smartmontools
Section: misc
Priority: optional
Homepage: https://github.com/hellisonvidal/Vorticis-SO
Description: Vorticis SO — área de trabalho, apps e ferramentas do sistema
 Componentes próprios do Vorticis SO: área de trabalho (vorticis-shell), apps
 Vorticis (Music, Video, Central de Apps, Configurações, Dispositivos,
 Diagnóstico, Monitor, Notas, Calculadora, Ajuda), ferramentas de sistema
 (vorticis-*), ícones, tela de inicialização e configurações de segurança.
CTRL

mkdir -p "$SAIDA"
ARQ="$SAIDA/vorticis-sistema_${VERSAO}_all.deb"
dpkg-deb --root-owner-group -Zxz --build "$P" "$ARQ" >/dev/null
echo "$ARQ"
