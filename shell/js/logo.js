/*
 * Vorticis SO — gerador do logotipo (SVG).
 *
 * Fonte única do ícone do sistema: usada pelo shell (botão do menu, menu, personalização)
 * e, via Node, por branding/gerar-logo.js para gerar os arquivos do instalador, do boot
 * e do Calamares. Inspirado no vórtice da família Vorticis (Vorticis Monitor).
 *
 *   VorticisLogo.svg({ estilo: "vortice", paleta: { fundo1, fundo2, braco1, braco2 }, tamanho: 64 })
 *
 * Estilos: vortice (padrão), ciclone, redemoinho, onda, gota.
 */
(function (raiz, fabrica) {
  const api = fabrica();
  if (typeof module === "object" && module.exports) module.exports = api;
  else raiz.VorticisLogo = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const PALETAS = {
    oceano:    { nome: "Oceano",     fundo1: "#082f49", fundo2: "#0d7490", braco1: "#ffffff", braco2: "#67e8f9" },
    mare:      { nome: "Maré",       fundo1: "#06264f", fundo2: "#0a84ff", braco1: "#ffffff", braco2: "#7dd3fc" },
    esmeralda: { nome: "Esmeralda",  fundo1: "#052e2b", fundo2: "#0f766e", braco1: "#ffffff", braco2: "#6ee7b7" },
    coral:     { nome: "Coral",      fundo1: "#083344", fundo2: "#0e7490", braco1: "#ffffff", braco2: "#fdba74" },
    crepusculo:{ nome: "Pôr do sol", fundo1: "#3b1d4a", fundo2: "#c2410c", braco1: "#ffffff", braco2: "#fdba74" },
    ametista:  { nome: "Ametista",   fundo1: "#2e1065", fundo2: "#7c3aed", braco1: "#ffffff", braco2: "#d8b4fe" },
    neon:      { nome: "Neon",       fundo1: "#1a0633", fundo2: "#6d28d9", braco1: "#22d3ee", braco2: "#f472b6" },
    grafite:   { nome: "Grafite",    fundo1: "#111827", fundo2: "#374151", braco1: "#f9fafb", braco2: "#7cc4ff" },
    areia:     { nome: "Areia",      fundo1: "#0b7fab", fundo2: "#38bdf8", braco1: "#ffffff", braco2: "#fde68a" },
    contraste: { nome: "Contraste",  fundo1: "#000000", fundo2: "#000000", braco1: "#ffd400", braco2: "#ffffff" },
  };

  const ESTILOS = {
    vortice:    "Vórtice",
    ciclone:    "Ciclone",
    redemoinho: "Redemoinho",
    onda:       "Onda",
    gota:       "Gota",
  };

  const f = (n) => (Math.round(n * 10) / 10).toString();
  let seq = 0;

  function bloco(id, p, forma) {
    const grad = `<linearGradient id="${id}f" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0" stop-color="${p.fundo1}"/><stop offset="1" stop-color="${p.fundo2}"/></linearGradient>`;
    const corpo = forma === "circulo"
      ? `<circle cx="256" cy="256" r="248" fill="url(#${id}f)"/>`
      : `<rect x="4" y="4" width="504" height="504" rx="112" fill="url(#${id}f)"/>`;
    return { defs: grad, corpo };
  }

  // Braços em faixa contínua que afinam para o centro (mesma geometria do Vorticis Monitor).
  function bracos(qtd, p, cx, cy, raio, voltas, largura) {
    const caminhos = [];
    const n = 90;
    for (let b = 0; b < qtd; b++) {
      const fase = (2 * Math.PI * b) / qtd;
      const esq = [], dir = [];
      for (let i = 0; i < n; i++) {
        const s = i / (n - 1);
        const r = raio * (0.1 + 0.9 * s);
        const ang = fase + voltas * Math.PI * s;
        const x = cx + r * Math.cos(ang), y = cy + r * Math.sin(ang);
        const dr = raio * 0.9, da = voltas * Math.PI;
        const tx = dr * Math.cos(ang) - r * da * Math.sin(ang);
        const ty = dr * Math.sin(ang) + r * da * Math.cos(ang);
        const nn = Math.hypot(tx, ty);
        const nx = -ty / nn, ny = tx / nn;
        const meia = largura * (0.12 + 0.88 * Math.pow(Math.sin(Math.PI * Math.min(1, s * 1.15)), 0.8));
        esq.push(`${f(x + nx * meia)},${f(y + ny * meia)}`);
        dir.push(`${f(x - nx * meia)},${f(y - ny * meia)}`);
      }
      const cor = b % 2 === 0 ? p.braco1 : p.braco2;
      caminhos.push(`<polygon points="${esq.concat(dir.reverse()).join(" ")}" fill="${cor}"/>`);
    }
    return caminhos.join("");
  }

  function sombra(id) {
    return `<filter id="${id}s" x="-10%" y="-10%" width="120%" height="120%">` +
      `<feDropShadow dx="4" dy="6" stdDeviation="6" flood-color="#000" flood-opacity="0.3"/></filter>`;
  }

  const DESENHOS = {
    vortice(id, p) {
      const b = bloco(id, p);
      return { defs: b.defs + sombra(id), corpo: b.corpo +
        `<g filter="url(#${id}s)">${bracos(6, p, 256, 256, 190, 1.55, 19)}` +
        `<circle cx="256" cy="256" r="26" fill="${p.braco1}"/></g>` };
    },
    ciclone(id, p) {
      // Sem bloco: três braços largos, para quem prefere um ícone "solto".
      const grad = `<linearGradient id="${id}c" x1="0" y1="0" x2="1" y2="1">` +
        `<stop offset="0" stop-color="${p.braco2}"/><stop offset="1" stop-color="${p.fundo2}"/></linearGradient>`;
      const pc = { braco1: `url(#${id}c)`, braco2: `url(#${id}c)` };
      return { defs: grad, corpo: bracos(3, pc, 256, 256, 236, 1.25, 46) +
        `<circle cx="256" cy="256" r="40" fill="${p.braco2}"/>` };
    },
    redemoinho(id, p) {
      const b = bloco(id, p, "circulo");
      const espiral = (fase, voltas, cor, larg) => {
        const pts = [];
        for (let i = 0; i <= 160; i++) {
          const s = i / 160, ang = fase + voltas * 2 * Math.PI * s, r = 24 + 180 * s;
          pts.push(`${f(256 + r * Math.cos(ang))},${f(256 + r * Math.sin(ang))}`);
        }
        return `<polyline points="${pts.join(" ")}" fill="none" stroke="${cor}" stroke-width="${larg}" stroke-linecap="round" stroke-linejoin="round"/>`;
      };
      return { defs: b.defs, corpo: b.corpo + espiral(0, 1.6, p.braco1, 34) + espiral(Math.PI, 1.6, p.braco2, 22) };
    },
    onda(id, p) {
      const b = bloco(id, p, "circulo");
      const onda = (y, amp, cor, larg) =>
        `<path d="M70 ${y} C 140 ${y - amp}, 190 ${y - amp}, 256 ${y} S 372 ${y + amp}, 442 ${y}" fill="none" stroke="${cor}" stroke-width="${larg}" stroke-linecap="round"/>`;
      return { defs: b.defs + `<clipPath id="${id}k"><circle cx="256" cy="256" r="248"/></clipPath>`,
        corpo: b.corpo + `<g clip-path="url(#${id}k)">` + onda(196, 70, p.braco2, 26) + onda(270, 70, p.braco1, 34) + onda(344, 70, p.braco2, 26) + "</g>" };
    },
    gota(id, p) {
      const grad = `<linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1">` +
        `<stop offset="0" stop-color="${p.braco2}"/><stop offset="1" stop-color="${p.fundo2}"/></linearGradient>`;
      return { defs: grad, corpo:
        `<path d="M256 24c80 96 144 168 144 240a144 144 0 0 1-288 0c0-72 64-144 144-240z" fill="url(#${id}g)"/>` +
        `<path d="M184 296a72 72 0 0 0 72 72" stroke="${p.braco1}" stroke-width="28" fill="none" stroke-linecap="round" opacity=".85"/>` };
    },
  };

  function svg(opcoes = {}) {
    const estilo = DESENHOS[opcoes.estilo] ? opcoes.estilo : "vortice";
    const p = { ...PALETAS.oceano, ...(typeof opcoes.paleta === "string" ? PALETAS[opcoes.paleta] : opcoes.paleta || {}) };
    const id = "vl" + (opcoes.id || ++seq);
    const d = DESENHOS[estilo](id, p);
    const t = opcoes.tamanho ? ` width="${opcoes.tamanho}" height="${opcoes.tamanho}"` : "";
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"${t} role="img" aria-label="Vorticis SO">` +
      `<defs>${d.defs}</defs>${d.corpo}</svg>`;
  }

  return { svg, PALETAS, ESTILOS };
});
