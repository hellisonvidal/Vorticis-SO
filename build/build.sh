#!/bin/sh
# Gera a ISO live/instalável do Vorticis SO (Debian 13 "trixie", amd64).
# Requisitos: Debian/Ubuntu com live-build, executado como root.
#   sudo apt install live-build
#   sudo ./build.sh            # ISO completa
#   sudo ./build.sh --limpar   # apaga artefatos de builds anteriores
set -eu

VERSAO="${VORTICIS_VERSAO:-0.2}"
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
    --firmware-binary false \
    --firmware-chroot false \
    --iso-application "Vorticis SO" \
    --iso-publisher "Projeto Vorticis" \
    --iso-volume "VORTICIS_${VERSAO}" \
    --image-name "vorticis-${VERSAO}" \
    --bootappend-live "boot=live components quiet splash locales=pt_BR.UTF-8 keyboard-layouts=br timezone=America/Sao_Paulo username=vorticis hostname=vorticis" \
    --apt-recommends false \
    --memtest none

# Configuração versionada (listas de pacotes, hooks, arquivos extras)
rm -rf config/package-lists config/hooks/live config/includes.chroot config/includes.binary config/archives config/bootloaders
cp -a "$AQUI/config/." config/
# O live-build só executa config/hooks/live/* se config/hooks/normal/ também tiver hooks:
# usa os hooks de limpeza padrão do próprio live-build.
mkdir -p config/hooks/normal
if [ -z "$(ls config/hooks/normal 2>/dev/null)" ]; then
    for h in /usr/share/live/build/hooks/normal/*.chroot; do ln -s "$h" config/hooks/normal/; done
fi

# Componentes próprios do Vorticis: pacote vorticis-sistema (o mesmo que o
# vorticis-atualizar instala nas atualizações), instalado pela lista de pacotes locais.
INC=config/includes.chroot
rm -rf config/packages.chroot && mkdir -p config/packages.chroot
DEB=$(sh "$RAIZ/pacote/gerar-deb.sh" "$VERSAO" config/packages.chroot)
echo "vorticis-sistema" > config/package-lists/vorticis.list.chroot
install -d "$INC/etc" "$INC/usr/bin"
cat > "$INC/etc/os-release" <<OSR
PRETTY_NAME="Vorticis SO $VERSAO"
NAME="Vorticis SO"
VERSION_ID="$VERSAO"
VERSION="$VERSAO"
ID=vorticis
ID_LIKE=debian
LOGO=vorticis
HOME_URL="https://github.com/hellisonvidal/Vorticis-SO"
BUG_REPORT_URL="https://github.com/hellisonvidal/Vorticis-SO/issues"
OSR
rm -rf "$INC/etc/calamares"
cp -a "$RAIZ/installer/calamares" "$INC/etc/calamares"
# Versão do instalador = versão desta build
sed -i -e "s/^\(  *version: *\).*/\1$VERSAO/" -e "s/^\(  *shortVersion: *\).*/\1$VERSAO/" \
    -e "s/^\(  *versionedName: *\).*/\1Vorticis SO $VERSAO/" -e "s/^\(  *shortVersionedName: *\).*/\1Vorticis $VERSAO/" \
    "$INC/etc/calamares/branding/vorticis/branding.desc"
install -m 0755 "$RAIZ/installer/linux/vorticis-instalar-daqui" "$INC/usr/bin/"

lb build 2>&1 | tee build.log
# Pacote do Vorticis também sai como artefato (é publicado nas releases para as atualizações)
cp "$DEB" "$AQUI/" && (cd "$AQUI" && sha256sum "$(basename "$DEB")" > "$(basename "$DEB").sha256")

ISO="$(ls -1 "$TRABALHO"/*.iso 2>/dev/null | head -n1)"
[ -n "$ISO" ] || { echo "Falha: nenhuma ISO gerada (veja $TRABALHO/build.log)" >&2; exit 1; }
mv "$ISO" "$AQUI/vorticis-${VERSAO}-amd64.iso"
cd "$AQUI" && sha256sum "vorticis-${VERSAO}-amd64.iso" > "vorticis-${VERSAO}-amd64.iso.sha256"
echo "ISO pronta: $AQUI/vorticis-${VERSAO}-amd64.iso"
