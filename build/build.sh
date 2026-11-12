#!/bin/sh
# Gera a ISO live/instalável do Vorticis SO (Debian 13 "trixie", amd64).
# Requisitos: Debian/Ubuntu com live-build, executado como root.
#   sudo apt install live-build
#   sudo ./build.sh            # ISO completa
#   sudo ./build.sh --limpar   # apaga artefatos de builds anteriores
set -eu

VERSAO="${VORTICIS_VERSAO:-0.1}"
AQUI="$(cd "$(dirname "$0")" && pwd)"
RAIZ="$(cd "$AQUI/.." && pwd)"
TRABALHO="${VORTICIS_TRABALHO:-$AQUI/trabalho}"

[ "$(id -u)" -eq 0 ] || { echo "Execute como root (sudo)." >&2; exit 1; }
command -v lb >/dev/null || { echo "Instale o live-build: apt install live-build" >&2; exit 1; }

if [ "${1:-}" = "--limpar" ]; then
    [ -d "$TRABALHO" ] && (cd "$TRABALHO" && lb clean --purge)
    rm -rf "$TRABALHO"
    exit 0
fi

mkdir -p "$TRABALHO"
cd "$TRABALHO"

lb config \
    --distribution trixie \
    --architectures amd64 \
    --archive-areas "main contrib non-free non-free-firmware" \
    --binary-images iso-hybrid \
    --bootloaders "grub-efi,syslinux" \
    --debian-installer none \
    --firmware-binary true \
    --firmware-chroot true \
    --iso-application "Vorticis SO" \
    --iso-publisher "Projeto Vorticis" \
    --iso-volume "VORTICIS_${VERSAO}" \
    --image-name "vorticis-${VERSAO}" \
    --bootappend-live "boot=live components quiet splash locales=pt_BR.UTF-8 keyboard-layouts=br timezone=America/Sao_Paulo username=vorticis hostname=vorticis" \
    --apt-recommends false \
    --memtest none

# Configuração versionada (listas de pacotes, hooks, arquivos extras)
rm -rf config/package-lists config/hooks config/includes.chroot config/archives
cp -a "$AQUI/config/." config/

# Componentes próprios do Vorticis → dentro do sistema
INC=config/includes.chroot
install -d "$INC/usr/bin" "$INC/usr/lib/vorticis" "$INC/usr/share/vorticis" "$INC/etc/vorticis"
for f in "$RAIZ"/tools/vorticis-*; do install -m 0755 "$f" "$INC/usr/bin/"; done
install -m 0755 "$RAIZ/tools/vorticis-rede" "$INC/usr/lib/vorticis/vorticis-rede"
cp -a "$RAIZ/shell" "$INC/usr/share/vorticis/shell"
install -m 0755 "$RAIZ/shell/vorticis-shell" "$INC/usr/bin/vorticis-shell"
install -m 0644 "$RAIZ/security/nftables.conf" "$INC/etc/vorticis/nftables.conf"
install -D -m 0644 "$RAIZ/security/resolved.conf" "$INC/etc/systemd/resolved.conf.d/90-vorticis.conf"
install -D -m 0644 "$RAIZ/security/networkmanager-privacidade.conf" "$INC/etc/NetworkManager/conf.d/90-vorticis-privacidade.conf"
install -D -m 0644 "$RAIZ/security/sysctl-rede.conf" "$INC/etc/sysctl.d/80-vorticis-rede.conf"
install -D -m 0644 "$RAIZ/security/vorticis-rede.service" "$INC/etc/systemd/system/vorticis-rede.service"
cp -a "$RAIZ/installer/calamares" "$INC/etc/calamares"
install -m 0755 "$RAIZ/installer/linux/vorticis-instalar-daqui" "$INC/usr/bin/"

lb build 2>&1 | tee build.log

ISO="$(ls -1 "$TRABALHO"/*.iso 2>/dev/null | head -n1)"
[ -n "$ISO" ] || { echo "Falha: nenhuma ISO gerada (veja $TRABALHO/build.log)" >&2; exit 1; }
mv "$ISO" "$AQUI/vorticis-${VERSAO}-amd64.iso"
cd "$AQUI" && sha256sum "vorticis-${VERSAO}-amd64.iso" > "vorticis-${VERSAO}-amd64.iso.sha256"
echo "ISO pronta: $AQUI/vorticis-${VERSAO}-amd64.iso"
