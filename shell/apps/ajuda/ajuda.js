/* Ajuda do Vorticis — mostra a documentação (Markdown) que acompanha o sistema. */
(function () {
  "use strict";
  const { el } = Vorticis;
  const $ = (s) => document.querySelector(s);
  // A documentação fica em /usr/share/vorticis/docs (no repositório: docs/)
  const BASE = new URL("../../../docs/", location.href);
  const DOCS = [
    ["MANUAL.md", "📘 Manual do usuário"],
    ["COMPATIBILIDADE.md", "🪟 Programas de Windows e Android"],
    ["REFERENCIA.md", "⌨️ Referência de comandos"],
    ["NOTAS-DA-VERSAO.md", "🆕 Novidades"],
    ["ARQUITETURA.md", "🏗️ Como o Vorticis funciona"],
    ["DESENVOLVIMENTO.md", "🧑‍💻 Guia de desenvolvimento"],
    ["ROTEIRO.md", "🗺️ Roteiro"],
  ];
  const cache = {};
  let atual = DOCS[0][0];

  /* ---------- Markdown → HTML (subconjunto usado nos documentos do Vorticis) ---------- */
  const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // Mesmo formato de âncora do GitHub (mantém acentos), para os links funcionarem nos dois lugares
  const ancora = (t) => t.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, "").trim().replace(/\s/g, "-");
  function inline(t) {
    return esc(t)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => `<img alt="${alt}" src="${new URL(src, BASE)}">`)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, txt, href) => `<a href="${href}" data-link="${href}">${txt}</a>`)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
  }
  function markdown(md) {
    const linhas = md.replace(/\r/g, "").split("\n");
    const out = [];
    let i = 0;
    while (i < linhas.length) {
      const l = linhas[i];
      if (/^```/.test(l)) {
        const bloco = [];
        for (i++; i < linhas.length && !/^```/.test(linhas[i]); i++) bloco.push(linhas[i]);
        out.push(`<pre><code>${esc(bloco.join("\n"))}</code></pre>`); i++; continue;
      }
      const h = /^(#{1,4})\s+(.*)$/.exec(l);
      if (h) { out.push(`<h${h[1].length} id="${ancora(h[2])}">${inline(h[2])}</h${h[1].length}>`); i++; continue; }
      if (/^\s*\|/.test(l) && i + 1 < linhas.length && /^\s*\|[\s:|-]+\|\s*$/.test(linhas[i + 1])) {
        const celulas = (s) => s.trim().replace(/^\||\|$/g, "").split("|").map((c) => inline(c.trim()));
        const cab = celulas(l); i += 2;
        const corpo = [];
        while (i < linhas.length && /^\s*\|/.test(linhas[i])) corpo.push(celulas(linhas[i++]));
        out.push(`<table><thead><tr>${cab.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${corpo.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
        continue;
      }
      if (/^\s*([-*]|\d+\.)\s+/.test(l)) {
        const ordenada = /^\s*\d+\./.test(l);
        const itens = [];
        while (i < linhas.length && /^\s*([-*]|\d+\.)\s+/.test(linhas[i])) {
          let item = linhas[i].replace(/^\s*([-*]|\d+\.)\s+/, ""); i++;
          while (i < linhas.length && /^\s{2,}\S/.test(linhas[i]) && !/^\s*([-*]|\d+\.)\s+/.test(linhas[i])) item += " " + linhas[i++].trim();
          itens.push(`<li>${inline(item.replace(/^\[x\]\s*/, "✅ ").replace(/^\[ \]\s*/, "⬜ "))}</li>`);
        }
        out.push(ordenada ? `<ol>${itens.join("")}</ol>` : `<ul>${itens.join("")}</ul>`); continue;
      }
      if (/^>\s?/.test(l)) {
        const q = [];
        while (i < linhas.length && /^>\s?/.test(linhas[i])) q.push(linhas[i++].replace(/^>\s?/, ""));
        out.push(`<blockquote>${inline(q.join(" "))}</blockquote>`); continue;
      }
      if (/^---+\s*$/.test(l)) { out.push("<hr>"); i++; continue; }
      if (!l.trim()) { i++; continue; }
      const p = [];
      while (i < linhas.length && linhas[i].trim() && !/^(#{1,4}\s|```|\s*\||\s*([-*]|\d+\.)\s+|>)/.test(linhas[i])) p.push(linhas[i++]);
      if (!p.length) p.push(linhas[i++]);
      out.push(`<p>${inline(p.join(" "))}</p>`);
    }
    return out.join("\n");
  }

  async function texto(arq) {
    if (!(arq in cache)) {
      try { const r = await fetch(new URL(arq, BASE)); cache[arq] = r.ok || (r.status === 0 && BASE.protocol === "file:") ? await r.text() : null; }
      catch (_) { cache[arq] = null; }
    }
    return cache[arq];
  }

  async function abrir(arq, alvo) {
    atual = arq;
    const md = await texto(arq);
    const doc = $("#doc");
    doc.innerHTML = md ? markdown(md) : `<p>Documento não encontrado: ${esc(arq)}</p>`;
    doc.querySelectorAll("a[data-link]").forEach((a) => a.addEventListener("click", (e) => {
      const href = a.dataset.link;
      if (/^https?:/.test(href)) return; // links externos: o vorticis-app abre no navegador
      e.preventDefault();
      const [arquivo, ancoraLink] = href.split("#");
      const nome = arquivo.split("/").pop();
      if (!arquivo) return document.getElementById(ancoraLink)?.scrollIntoView({ behavior: "smooth" });
      if (DOCS.some(([d]) => d === nome)) abrir(nome, ancoraLink);
    }));
    renderLateral();
    if (alvo) document.getElementById(alvo)?.scrollIntoView();
    else document.querySelector(".conteudo").scrollTop = 0;
  }

  function renderLateral() {
    const doc = $("#doc");
    const indice = [...doc.querySelectorAll("h2, h3")].map((h) =>
      el("a", { href: "#" + h.id, class: h.tagName.toLowerCase(), texto: h.textContent, onclick: (e) => { e.preventDefault(); h.scrollIntoView({ behavior: "smooth" }); } }));
    $("#lateral").replaceChildren(el("h3", { texto: "Documentos" }),
      ...DOCS.map(([arq, nome]) => el("button", { "aria-current": String(arq === atual), onclick: () => abrir(arq) }, nome)),
      el("h3", { texto: "Nesta página" }), el("div", { class: "indice" }, indice));
  }

  async function pesquisar(q) {
    if (q.length < 2) return abrir(atual);
    const termo = q.toLowerCase();
    const resultados = [];
    for (const [arq, nome] of DOCS) {
      const md = (await texto(arq)) || "";
      let secao = nome;
      for (const linha of md.split("\n")) {
        const h = /^#{1,4}\s+(.*)/.exec(linha);
        if (h) secao = h[1];
        else if (linha.toLowerCase().includes(termo)) {
          const limpa = linha.replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[#*`|>]/g, " ").replace(/\s+/g, " ").trim();
          resultados.push({ arq, nome, secao, linha: limpa });
        }
        if (resultados.length > 60) break;
      }
    }
    const marcar = (t) => esc(t).replace(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), (m) => `<mark>${m}</mark>`);
    const doc = $("#doc");
    doc.replaceChildren(el("h1", { texto: `Resultados para “${q}”` }));
    if (!resultados.length) doc.append(el("p", { class: "suave", texto: "Nada encontrado. Tente outra palavra." }));
    for (const r of resultados) {
      const div = el("div", { class: "resultado", onclick: () => { $("#busca").value = ""; abrir(r.arq, ancora(r.secao)); } });
      div.innerHTML = `<b>${esc(r.secao)}</b> <small>· ${esc(r.nome)}</small><br>${marcar(r.linha.slice(0, 220))}`;
      doc.append(div);
    }
  }

  let t;
  $("#busca").addEventListener("input", (e) => { clearTimeout(t); t = setTimeout(() => pesquisar(e.target.value.trim()), 250); });
  const inicial = new URLSearchParams(location.search).get("secao");
  abrir(DOCS.some(([d]) => d === inicial) ? inicial : DOCS[0][0]);
})();
