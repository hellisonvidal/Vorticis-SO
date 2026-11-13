#!/usr/bin/env node
/*
 * Gera os arquivos de marca do Vorticis SO a partir de shell/js/logo.js (fonte única):
 *   branding/vorticis.svg, branding/png/vorticis-<N>.png, branding/vorticis.ico
 * e os copia para o build (ícones do sistema, Calamares, boot, Plymouth, raiz da ISO).
 * Uso: node branding/gerar-logo.js     (requer rsvg-convert e ImageMagick `convert`)
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const RAIZ = path.resolve(__dirname, "..");
const L = require(path.join(RAIZ, "shell/js/logo.js"));
const PADRAO = { estilo: "vortice", paleta: "mare" };
const TAMANHOS = [16, 24, 32, 48, 64, 128, 256, 512];

const B = path.join(RAIZ, "branding");
const PKG = path.join(RAIZ, "pacote/raiz");  // arquivos do pacote vorticis-sistema
const BIN = path.join(RAIZ, "build/config/includes.binary");

function escrever(arq, conteudo) {
  fs.mkdirSync(path.dirname(arq), { recursive: true });
  fs.writeFileSync(arq, conteudo);
}
function copiar(de, para) {
  fs.mkdirSync(path.dirname(para), { recursive: true });
  fs.copyFileSync(de, para);
}

const svg = L.svg({ ...PADRAO, id: "marca" });
escrever(path.join(B, "vorticis.svg"), svg);
fs.mkdirSync(path.join(B, "png"), { recursive: true });
for (const t of TAMANHOS) {
  execFileSync("rsvg-convert", ["-w", String(t), "-h", String(t), path.join(B, "vorticis.svg"), "-o", path.join(B, "png", `vorticis-${t}.png`)]);
}
execFileSync("convert", [16, 24, 32, 48, 64, 128, 256].map((t) => path.join(B, "png", `vorticis-${t}.png`)).concat(path.join(B, "vorticis.ico")));

// Ícones do sistema (tema hicolor), usados pelo menu, instalador e janelas
for (const t of TAMANHOS) copiar(path.join(B, "png", `vorticis-${t}.png`), path.join(PKG, `usr/share/icons/hicolor/${t}x${t}/apps/vorticis.png`));
copiar(path.join(B, "vorticis.svg"), path.join(PKG, "usr/share/icons/hicolor/scalable/apps/vorticis.svg"));
copiar(path.join(B, "png/vorticis-256.png"), path.join(PKG, "usr/share/pixmaps/vorticis.png"));

// Calamares (instalador gráfico)
const CAL = path.join(RAIZ, "installer/calamares/branding/vorticis");
copiar(path.join(B, "vorticis.svg"), path.join(CAL, "logo.svg"));
copiar(path.join(B, "png/vorticis-256.png"), path.join(CAL, "logo.png"));
copiar(path.join(B, "png/vorticis-512.png"), path.join(CAL, "boasvindas.png"));

// Plymouth (tela de inicialização): fundo arredondado parado + vórtice girando por cima
const PLY = path.join(PKG, "usr/share/plymouth/themes/vorticis");
for (const parte of ["fundo", "bracos"]) {
  const arq = path.join(B, `vorticis-${parte}.svg`);
  escrever(arq, L.svg({ ...PADRAO, parte, id: parte }));
  fs.mkdirSync(PLY, { recursive: true });
  execFileSync("rsvg-convert", ["-w", "200", "-h", "200", arq, "-o", path.join(PLY, `${parte}.png`)]);
}
const antigo = path.join(PLY, "logo.png");
if (fs.existsSync(antigo)) fs.unlinkSync(antigo);

// Raiz da ISO / pen-drive: ícone da unidade no Windows (autorun.inf + .ico)
copiar(path.join(B, "vorticis.ico"), path.join(BIN, "vorticis.ico"));
escrever(path.join(BIN, "autorun.inf"), "[autorun]\r\nicon=vorticis.ico\r\nlabel=Vorticis SO\r\n");
copiar(path.join(B, "vorticis.ico"), path.join(RAIZ, "installer/windows/vorticis.ico"));

// Tela do menu de boot (GRUB/isolinux): o logo vai embutido no splash.svg
const corpo = svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
const splash = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs><radialGradient id="mar" cx="30%" cy="0%" r="110%">
    <stop offset="0" stop-color="#4fb3ff"/><stop offset=".35" stop-color="#0b6fb8"/><stop offset="1" stop-color="#021a3d"/>
  </radialGradient></defs>
  <rect width="800" height="600" fill="url(#mar)"/>
  <g fill="none" stroke="#c6ecff" stroke-opacity=".18" stroke-width="2">
    <ellipse cx="620" cy="140" rx="90" ry="26"/><ellipse cx="620" cy="140" rx="150" ry="44"/><ellipse cx="620" cy="140" rx="220" ry="66"/>
  </g>
  <svg x="70" y="62" width="136" height="136" viewBox="0 0 512 512">${corpo}</svg>
  <text x="230" y="140" font-family="DejaVu Sans" font-size="54" font-weight="bold" fill="#eaf6ff">Vorticis SO</text>
  <text x="232" y="180" font-family="DejaVu Sans" font-size="22" fill="#a9cbe6">versão @VERSION@ · leve, bonito e seu</text>
</svg>
`;
escrever(path.join(RAIZ, "build/config/bootloaders/splash.svg"), splash);
console.log("Marca gerada:", TAMANHOS.length, "PNGs, ICO, SVG, splash, Calamares, Plymouth, autorun");
