/*
 * Vorticis Shell — barra de tarefas, menu, temas, personalização e janelas.
 *
 * Dentro do Vorticis SO esta página roda em duas camadas WebKitGTK (papel de parede
 * e barra) criadas pelo vorticis-shell; a ponte window.webkit.messageHandlers.vorticis
 * abre apps de verdade. No navegador comum (demonstração), os apps Vorticis abrem em
 * janelas internas e os demais são simulados.
 */
(function () {
  "use strict";

  /* ======================================================================= Catálogo */
  const APPS = {
    musica:        { nome: "Vorticis Music",  icone: "🎵", cor: "#e76f51", cmd: "vorticis-app musica", web: "apps/musica/index.html", cat: "Vorticis" },
    video:         { nome: "Vorticis Video",  icone: "🎬", cor: "#d62828", cmd: "vorticis-app video", web: "apps/video/index.html", cat: "Vorticis" },
    central:       { nome: "Central de Apps", icone: "🛍️", cor: "#0a84ff", cmd: "vorticis-app central", web: "apps/central/index.html", cat: "Vorticis" },
    configuracoes: { nome: "Configurações",   icone: "⚙️", cor: "#457b9d", cmd: "vorticis-app configuracoes", web: "apps/configuracoes/index.html", cat: "Vorticis" },
    monitor:       { nome: "Monitor",         icone: "📈", cor: "#06a77d", cmd: "vorticis-app monitor", web: "apps/monitor/index.html", cat: "Vorticis" },
    notas:         { nome: "Notas",           icone: "🗒️", cor: "#f4a261", cmd: "vorticis-app notas", web: "apps/notas/index.html", cat: "Vorticis" },
    calculadora:   { nome: "Calculadora",     icone: "🧮", cor: "#5e60ce", cmd: "vorticis-app calculadora", web: "apps/calculadora/index.html", cat: "Vorticis" },
    arquivos:      { nome: "Arquivos",        icone: "📁", cor: "#2a9d8f", cmd: "nautilus", cat: "Sistema" },
    terminal:      { nome: "Terminal",        icone: "⌨️", cor: "#264653", cmd: "foot", cat: "Sistema" },
    discos:        { nome: "Discos",          icone: "💽", cor: "#6c757d", cmd: "gnome-disks", cat: "Sistema" },
    captura:       { nome: "Captura de tela", icone: "📸", cor: "#118ab2", cmd: "sh -c 'grim -g \"$(slurp)\" ~/Imagens/captura-$(date +%s).png'", cat: "Sistema" },
    editor:        { nome: "Editor de texto", icone: "📝", cor: "#3a86ff", cmd: "gnome-text-editor", cat: "Sistema" },
    navegador:     { nome: "Navegador",       icone: "🌐", cor: "#1f8fff", cmd: "xdg-open https://", cat: "Internet" },
    email:         { nome: "E-mail",          icone: "✉️", cor: "#4895ef", cmd: "flatpak run org.mozilla.Thunderbird", cat: "Internet" },
    discord:       { nome: "Discord",         icone: "💬", cor: "#5865f2", cmd: "flatpak run com.discordapp.Discord", cat: "Internet" },
    escritorio:    { nome: "Escritório",      icone: "📄", cor: "#ff6f3d", cmd: "flatpak run org.onlyoffice.desktopeditors", cat: "Escritório" },
    agenda:        { nome: "Agenda",          icone: "📅", cor: "#ef476f", cmd: "gnome-calendar", cat: "Escritório" },
    steam:         { nome: "Steam",           icone: "🎮", cor: "#1b2838", cmd: "steam", cat: "Jogos" },
    heroic:        { nome: "Heroic",          icone: "🛡️", cor: "#6a4c93", cmd: "flatpak run com.heroicgameslauncher.hgl", cat: "Jogos" },
    lutris:        { nome: "Lutris",          icone: "🦦", cor: "#f4a261", cmd: "flatpak run net.lutris.Lutris", cat: "Jogos" },
    android:       { nome: "Android",         icone: "🤖", cor: "#3ddc84", cmd: "waydroid show-full-ui", cat: "Compatibilidade" },
    windows:       { nome: "Apps Windows",    icone: "🪟", cor: "#0078d4", cmd: "flatpak run com.usebottles.bottles", cat: "Compatibilidade" },
    codigo:        { nome: "Código",          icone: "🧩", cor: "#0077b6", cmd: "flatpak run com.vscodium.codium", cat: "Desenvolvimento" },
    conteineres:   { nome: "Contêineres",     icone: "📦", cor: "#5e60ce", cmd: "flatpak run io.podman_desktop.PodmanDesktop", cat: "Desenvolvimento" },
    "jogos-educativos": { nome: "GCompris",   icone: "🧠", cor: "#ffb703", cmd: "flatpak run org.kde.gcompris", cat: "Educação" },
    desenho:       { nome: "Desenho",         icone: "🎨", cor: "#fb8500", cmd: "tuxpaint", cat: "Educação" },
    "navegador-seguro": { nome: "Internet Kids", icone: "🐳", cor: "#219ebc", cmd: "vorticis-navegadores abrir", cat: "Educação" },
  };

  const PERFIS_PADRAO = {
    basico: { nome: "Básico", icone: "🏠", fixados: ["navegador", "arquivos", "musica", "video", "central", "configuracoes"], barra: { rotulos: true, tamanho: "grande" } },
  };

  const TEMA_PADRAO = {
    id: "mare", nome: "Maré", efeito: "agua", animado: true,
    fundoEstatico: "radial-gradient(ellipse at 30% 0%, #4fb3ff 0%, #0b6fb8 35%, #03214a 100%)",
    cores: { destaque: "#38b6ff", destaqueForte: "#0a84ff", texto: "#eaf6ff", textoSuave: "#a9cbe6",
      painel: "rgba(6, 30, 64, 0.62)", painelBorda: "rgba(140, 210, 255, 0.22)", item: "rgba(255, 255, 255, 0.07)", itemHover: "rgba(120, 200, 255, 0.20)" },
    agua: { corFundo: "#021a3d", corMeio: "#0d78c4", corBrilho: "#c6ecff", causticas: 0.35, amortecimento: 0.985, gotasAmbiente: true },
  };

  const CORES_DESTAQUE = ["#38b6ff", "#0a84ff", "#00c2a8", "#3ddc84", "#ffd400", "#ff8a3d", "#ff4f6d", "#c45bff", "#8b9bb4"];

  const PADROES = {
    tema: "mare", qualidade: "auto", perfil: null, corDestaque: null, papelImagem: null, relogioGrande: true,
    icones: { estilo: "arredondado", tamanho: "m", anim: "elevar" },
    barra: { posicao: "inferior", alinhamento: "centro", tamanho: "auto", rotulos: "auto", opacidade: 100, ocultar: false },
    relogio: { formato: "24", segundos: false, data: true },
  };

  /* ======================================================================= Utilidades */
  const prefs = {
    sincronizando: false,
    ler(chave, padrao) {
      try { const v = localStorage.getItem("vorticis." + chave); return v === null ? padrao : JSON.parse(v); }
      catch (_) { return padrao; }
    },
    gravar(chave, valor) {
      try { localStorage.setItem("vorticis." + chave, JSON.stringify(valor)); } catch (_) { /* cheio ou bloqueado */ }
      if (!prefs.sincronizando) ponte("preferencia", { chave, valor });
    },
    obj(chave) { return { ...PADROES[chave], ...(prefs.ler(chave, {}) || {}) }; },
    mudar(chave, campo, valor) { const o = prefs.obj(chave); o[campo] = valor; prefs.gravar(chave, o); },
  };

  function ponte(acao, dados) {
    try {
      const h = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.vorticis;
      if (h) { h.postMessage(JSON.stringify({ acao, ...dados })); return true; }
    } catch (_) { /* fora do SO */ }
    return false;
  }
  const NO_SISTEMA = (() => { try { return !!window.webkit.messageHandlers.vorticis; } catch (_) { return false; } })();

  async function carregarJSON(url, padrao) {
    try { const r = await fetch(url, { cache: "no-cache" }); if (!r.ok) throw new Error(r.status); return await r.json(); }
    catch (_) { return padrao; }
  }

  const $ = (s) => document.querySelector(s);
  const el = (tag, attrs = {}, filhos = []) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null) continue;
      if (k === "texto") e.textContent = v;
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
      else if (k === "style") e.style.cssText = v;
      else e.setAttribute(k, v);
    }
    for (const f of [].concat(filhos)) if (f) e.append(f);
    return e;
  };

  function aviso(msg) {
    const a = $("#aviso");
    a.textContent = msg; a.hidden = false;
    clearTimeout(aviso.t); aviso.t = setTimeout(() => (a.hidden = true), 2800);
  }

  /* ======================================================================= Estado */
  const MODO = new URLSearchParams(location.search).get("modo") || "completo";
  document.body.classList.add("modo-" + MODO);
  const estado = { temas: {}, perfis: PERFIS_PADRAO, abertos: new Map(), z: 10 };
  const fundo = MODO === "barra"
    ? { definirTema() {}, definirImagem() {}, definirQualidade: (q) => (q === "auto" ? AguaVorticis.detectarQualidade() : q) }
    : new FundoVorticis($("#papel"));

  const perfilAtual = () => prefs.ler("perfil", null) || (window.VORTICIS_USUARIO || {}).perfil || "basico";
  const perfil = () => estado.perfis[perfilAtual()] || estado.perfis.basico || PERFIS_PADRAO.basico;
  const fixados = () => (prefs.ler("fixados." + perfilAtual(), null) || perfil().fixados).filter((id) => APPS[id]);

  /* ======================================================================= Aparência */
  function comAlfa(cor, alfa) {
    const m = /rgba?\(([^)]+)\)/.exec(cor || "");
    if (!m) return cor;
    const [r, g, b] = m[1].split(",").map((x) => x.trim());
    return `rgba(${r}, ${g}, ${b}, ${alfa})`;
  }

  function aplicarTema() {
    const t = estado.temas[prefs.ler("tema", "mare")] || TEMA_PADRAO;
    const c = { ...t.cores };
    const destaque = prefs.ler("corDestaque", null);
    if (destaque) { c.destaque = destaque; c.destaqueForte = destaque; }
    const raiz = document.documentElement.style;
    const mapa = { "--destaque": c.destaque, "--destaque-forte": c.destaqueForte, "--texto": c.texto, "--texto-suave": c.textoSuave,
      "--painel": c.painel, "--painel-borda": c.painelBorda, "--item": c.item, "--item-hover": c.itemHover };
    for (const [k, v] of Object.entries(mapa)) raiz.setProperty(k, v);
    raiz.setProperty("--fundo-solido", t.fundoApp || "#061a33");
    const barra = prefs.obj("barra");
    raiz.setProperty("--painel-barra", comAlfa(c.painel, Math.min(0.98, (barra.opacidade / 100) * 0.9 + 0.05)));
    document.body.classList.toggle("tema-claro", !!t.claro);
    document.body.classList.toggle("sem-transparencia", t.id === "contraste");
    if (MODO !== "barra") document.body.style.background = t.fundoEstatico;
    fundo.definirTema(t);
    fundo.definirImagem(prefs.ler("papelImagem", null));
    aplicarQualidade();
  }

  function aplicarQualidade() {
    const q = prefs.ler("qualidade", "auto");
    const efetiva = fundo.definirQualidade(q);
    document.body.classList.toggle("modo-leve", efetiva !== "alto");
    const t = estado.temas[prefs.ler("tema", "mare")] || TEMA_PADRAO;
    const nomes = { alto: "alta (GPU)", leve: "leve (CPU, resolução reduzida)", estatico: "estática (sem animação)" };
    $("#qualidade-info").textContent = prefs.ler("papelImagem", null) ? "Usando sua imagem como fundo (custo zero)."
      : t.efeito === "estatico" ? "Este tema é estático: custo zero de processamento."
      : `Em uso: ${nomes[efetiva] || efetiva}${q === "auto" ? " — escolhida pelo hardware detectado" : ""}.`;
  }

  function aplicarIcones() {
    const ic = prefs.obj("icones");
    document.body.dataset.icones = ic.estilo;
    document.body.dataset.tamIcone = ic.tamanho;
    document.body.dataset.animIcone = ic.anim;
  }

  function aplicarBarra() {
    const b = prefs.obj("barra"), p = perfil(), cl = document.body.classList;
    const tamanho = b.tamanho === "auto" ? p.barra.tamanho || "medio" : b.tamanho;
    const rotulos = b.rotulos === "auto" ? !!p.barra.rotulos : b.rotulos === "sim";
    cl.remove("barra-grande", "barra-medio", "barra-pequeno");
    cl.add("barra-" + tamanho);
    cl.toggle("barra-rotulos", rotulos);
    cl.toggle("barra-superior", b.posicao === "superior");
    cl.toggle("barra-esquerda", b.alinhamento === "esquerda");
    cl.toggle("barra-ocultar", !!b.ocultar);
    $("#indicador-perfil").textContent = `${p.icone} ${p.nome}`;
    ponte("barra", { posicao: b.posicao, tamanho, ocultar: !!b.ocultar });
    $("#relogio-grande").hidden = !prefs.ler("relogioGrande", true);
  }

  function aplicarTudo() {
    aplicarTema();
    aplicarIcones();
    aplicarBarra();
    renderFixados();
    renderConfig();
    relogio();
  }

  /* ======================================================================= Apps e janelas */
  function iconeApp(id) {
    const a = APPS[id] || { icone: "❔", cor: "#555" };
    return el("span", { class: "icone", style: `--cor-app:${a.cor}`, "aria-hidden": "true", texto: a.icone });
  }

  function abrirApp(id) {
    const a = APPS[id];
    if (!a) return;
    fecharPaineis();
    if (NO_SISTEMA) { ponte("abrir", { app: id, cmd: a.cmd }); return; }
    if (a.web) return abrirJanela(id);
    aviso(`${a.nome}: no Vorticis SO executa “${a.cmd}”.`);
  }

  function abrirJanela(id) {
    const existente = estado.abertos.get(id);
    if (existente) { existente.hidden = false; focar(existente); renderFixados(); return; }
    const a = APPS[id];
    const area = $("#janelas").getBoundingClientRect();
    const n = estado.abertos.size;
    const w = Math.min(1040, area.width - 40), h = Math.min(680, area.height - 40);
    const j = el("section", { class: "janela", style: `left:${Math.max(10, (area.width - w) / 2 + n * 28)}px;top:${Math.max(10, (area.height - h) / 2 + n * 24)}px;width:${w}px;height:${h}px` });
    const titulo = el("header", { class: "janela-titulo", ondblclick: () => j.classList.toggle("max") }, [
      iconeApp(id), el("span", { class: "janela-nome", texto: a.nome }),
      el("button", { title: "Minimizar", texto: "–", onclick: (e) => { e.stopPropagation(); j.hidden = true; renderFixados(); } }),
      el("button", { title: "Maximizar", texto: "▢", onclick: (e) => { e.stopPropagation(); j.classList.toggle("max"); } }),
      el("button", { class: "fechar", title: "Fechar", texto: "✕", onclick: (e) => { e.stopPropagation(); j.remove(); estado.abertos.delete(id); renderFixados(); } }),
    ]);
    const frame = el("iframe", { src: a.web, title: a.nome });
    j.append(titulo, frame);
    j.addEventListener("pointerdown", () => focar(j));
    arrastavel(j, titulo);
    $("#janelas").append(j);
    estado.abertos.set(id, j);
    focar(j);
    renderFixados();
  }

  function focar(j) {
    j.style.zIndex = ++estado.z;
    document.querySelectorAll(".janela").forEach((x) => x.classList.toggle("ativa", x === j));
  }

  function arrastavel(j, alca) {
    alca.addEventListener("pointerdown", (e) => {
      if (e.target.closest("button") || j.classList.contains("max")) return;
      const ox = e.clientX - j.offsetLeft, oy = e.clientY - j.offsetTop;
      j.classList.add("movendo");
      alca.setPointerCapture(e.pointerId);
      const mover = (ev) => { j.style.left = ev.clientX - ox + "px"; j.style.top = Math.max(0, ev.clientY - oy) + "px"; };
      const soltar = () => { j.classList.remove("movendo"); alca.removeEventListener("pointermove", mover); alca.removeEventListener("pointerup", soltar); };
      alca.addEventListener("pointermove", mover);
      alca.addEventListener("pointerup", soltar);
    });
  }

  function cliqueNaBarra(id) {
    const j = estado.abertos.get(id);
    if (!j) return abrirApp(id);
    if (j.hidden) { j.hidden = false; focar(j); }
    else if (j.classList.contains("ativa")) j.hidden = true;
    else focar(j);
    renderFixados();
  }

  /* ======================================================================= Fixar / menu de contexto */
  function salvarFixados(lista) { prefs.gravar("fixados." + perfilAtual(), lista); renderFixados(); }
  function fixar(id) { const l = fixados(); if (!l.includes(id)) salvarFixados([...l, id]); aviso(`${APPS[id].nome} fixado na barra.`); }
  function desafixar(id) { salvarFixados(fixados().filter((x) => x !== id)); }
  function mover(id, d) {
    const l = fixados(), i = l.indexOf(id), k = i + d;
    if (i < 0 || k < 0 || k >= l.length) return;
    [l[i], l[k]] = [l[k], l[i]];
    salvarFixados(l);
  }

  function menuContexto(e, itens) {
    e.preventDefault();
    const ctx = $("#ctx");
    ctx.replaceChildren(...itens.filter(Boolean).map(([rot, f]) => el("button", { role: "menuitem", texto: rot, onclick: () => { ctx.hidden = true; f(); } })));
    ctx.hidden = false;
    const r = ctx.getBoundingClientRect();
    ctx.style.left = Math.min(e.clientX, innerWidth - r.width - 8) + "px";
    ctx.style.top = Math.min(e.clientY, innerHeight - r.height - 8) + "px";
  }

  function contextoApp(e, id, naBarra) {
    const l = fixados(), fixo = l.includes(id), aberto = estado.abertos.has(id);
    menuContexto(e, [
      ["▶ Abrir", () => abrirApp(id)],
      fixo ? ["📌 Desafixar da barra", () => desafixar(id)] : ["📌 Fixar na barra", () => fixar(id)],
      naBarra && fixo && l.indexOf(id) > 0 ? ["← Mover para a esquerda", () => mover(id, -1)] : null,
      naBarra && fixo && l.indexOf(id) < l.length - 1 ? ["→ Mover para a direita", () => mover(id, 1)] : null,
      aberto ? ["✕ Fechar janela", () => { estado.abertos.get(id).remove(); estado.abertos.delete(id); renderFixados(); }] : null,
    ]);
  }

  /* ======================================================================= Renderização */
  function botaoBarra(id) {
    const j = estado.abertos.get(id);
    return el("button", {
      class: "fixado" + (j ? " aberto" : "") + (j && !j.hidden && j.classList.contains("ativa") ? " em-foco" : ""),
      title: (APPS[id] || {}).nome || id, onclick: () => cliqueNaBarra(id), oncontextmenu: (e) => contextoApp(e, id, true),
    }, [iconeApp(id), el("span", { class: "rotulo", texto: (APPS[id] || {}).nome || id })]);
  }

  function renderFixados() {
    const l = fixados();
    const extras = [...estado.abertos.keys()].filter((id) => !l.includes(id));
    $("#fixados").replaceChildren(...l.map(botaoBarra), ...(extras.length ? [el("span", { class: "separador" }), ...extras.map(botaoBarra)] : []));
  }

  let catMenu = "Todos";
  function renderApps(filtro = "") {
    const f = filtro.trim().toLowerCase();
    const cats = ["Todos", ...new Set(Object.values(APPS).map((a) => a.cat))];
    $("#abas-menu").replaceChildren(...cats.map((c) => el("button", { "aria-selected": String(c === catMenu), texto: c, onclick: () => { catMenu = c; renderApps($("#busca").value); } })));
    $("#abas-menu").hidden = !!f;
    const ids = Object.keys(APPS).filter((id) => {
      const a = APPS[id];
      if (f) return a.nome.toLowerCase().includes(f) || a.cat.toLowerCase().includes(f) || id.includes(f);
      return catMenu === "Todos" || a.cat === catMenu;
    });
    $("#grade-apps").replaceChildren(...ids.map((id) =>
      el("button", { class: "app", onclick: () => abrirApp(id), oncontextmenu: (e) => contextoApp(e, id, false) },
        [iconeApp(id), el("span", { texto: APPS[id].nome }), fixados().includes(id) ? el("small", { texto: "📌" }) : el("small", { texto: APPS[id].cat })])));
  }

  function segmentado(sel, valor, onEscolha) {
    document.querySelectorAll(sel + " button").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.v === String(valor)));
      b.onclick = () => onEscolha(b.dataset.v);
    });
  }

  function renderConfig() {
    const temaAtual = prefs.ler("tema", "mare");
    $("#lista-temas").replaceChildren(...Object.values(estado.temas).map((t) =>
      el("button", { class: "tema", "aria-pressed": String(t.id === temaAtual), title: t.descricao || "", onclick: () => { prefs.gravar("tema", t.id); prefs.gravar("papelImagem", null); aplicarTudo(); } },
        [el("div", { class: "amostra", style: `background:${t.fundoEstatico}` }, el("i", { style: `background:${t.cores.destaque}` })),
         el("span", {}, [t.nome, el("small", { texto: { agua: "água", bolhas: "bolhas", aurora: "aurora", estatico: "estático" }[t.efeito] || "" })])])));
    const destaque = prefs.ler("corDestaque", null);
    $("#cores").replaceChildren(
      el("button", { class: "cor tema-cor", "aria-pressed": String(!destaque), title: "Cor do tema", texto: "T", onclick: () => { prefs.gravar("corDestaque", null); aplicarTudo(); } }),
      ...CORES_DESTAQUE.map((c) => el("button", { class: "cor", style: `background:${c}`, "aria-pressed": String(destaque === c), title: c, onclick: () => { prefs.gravar("corDestaque", c); aplicarTudo(); } })),
      el("label", { class: "cor personalizada", title: "Escolher outra cor" }, [el("input", { type: "color", value: destaque || "#38b6ff", onchange: (e) => { prefs.gravar("corDestaque", e.target.value); aplicarTudo(); } }), "+"]));

    document.querySelectorAll("#qualidade button").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.q === prefs.ler("qualidade", "auto")));
      b.onclick = () => { prefs.gravar("qualidade", b.dataset.q); aplicarQualidade(); renderConfig(); };
    });
    $("#op-relogio-grande").checked = prefs.ler("relogioGrande", true);

    const ic = prefs.obj("icones");
    segmentado("#op-icone-estilo", ic.estilo, (v) => { prefs.mudar("icones", "estilo", v); aplicarTudo(); });
    segmentado("#op-icone-tamanho", ic.tamanho, (v) => { prefs.mudar("icones", "tamanho", v); aplicarTudo(); });
    segmentado("#op-icone-anim", ic.anim, (v) => { prefs.mudar("icones", "anim", v); aplicarTudo(); });

    const b = prefs.obj("barra");
    segmentado("#op-barra-posicao", b.posicao, (v) => { prefs.mudar("barra", "posicao", v); aplicarTudo(); });
    segmentado("#op-barra-alinhamento", b.alinhamento, (v) => { prefs.mudar("barra", "alinhamento", v); aplicarTudo(); });
    segmentado("#op-barra-tamanho", b.tamanho, (v) => { prefs.mudar("barra", "tamanho", v); aplicarTudo(); });
    segmentado("#op-barra-rotulos", b.rotulos, (v) => { prefs.mudar("barra", "rotulos", v); aplicarTudo(); });
    $("#op-barra-opacidade").value = b.opacidade;
    $("#op-barra-ocultar").checked = !!b.ocultar;

    const r = prefs.obj("relogio");
    segmentado("#op-relogio-formato", r.formato, (v) => { prefs.mudar("relogio", "formato", v); aplicarTudo(); });
    $("#op-relogio-segundos").checked = !!r.segundos;
    $("#op-relogio-data").checked = !!r.data;

    $("#lista-perfis").replaceChildren(...Object.entries(estado.perfis).map(([id, p]) =>
      el("button", { class: "perfil", "aria-pressed": String(id === perfilAtual()), onclick: () => { prefs.gravar("perfil", id); aplicarPerfilEnergia(); aplicarTudo(); } },
        [el("b", { texto: p.icone }), p.nome])));
  }

  function aplicarPerfilEnergia() {
    if (!prefs.sincronizando) ponte("energia", { perfil: perfil().barra.desempenho ? "desempenho" : "equilibrado" });
  }

  /* ======================================================================= Painéis */
  function fecharPaineis() {
    if (!$("#menu").hidden || !$("#config").hidden) ponte("painel", { aberto: false });
    $("#menu").hidden = true;
    $("#config").hidden = true;
    $("#ctx").hidden = true;
    $("#botao-iniciar").setAttribute("aria-expanded", "false");
  }

  function alternarMenu() {
    const abrir = $("#menu").hidden;
    fecharPaineis();
    if (!abrir) return;
    ponte("painel", { aberto: true });
    $("#menu").hidden = false;
    $("#botao-iniciar").setAttribute("aria-expanded", "true");
    $("#busca").value = "";
    renderApps();
    setTimeout(() => $("#busca").focus(), 0);
  }

  function abrirPersonalizar(aba = "tema") {
    fecharPaineis();
    ponte("painel", { aberto: true });
    $("#config").hidden = false;
    trocarAba(aba);
  }

  function trocarAba(aba) {
    document.querySelectorAll("#abas-config button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.aba === aba)));
    document.querySelectorAll("#config .aba").forEach((d) => (d.hidden = d.dataset.aba !== aba));
  }

  /* ======================================================================= Relógio e bateria */
  function relogio() {
    const d = new Date(), r = prefs.obj("relogio");
    const opc = { hour: "2-digit", minute: "2-digit", hour12: r.formato === "12" };
    const hora = d.toLocaleTimeString("pt-BR", r.segundos ? { ...opc, second: "2-digit" } : opc);
    $("#relogio").replaceChildren(hora, ...(r.data ? [el("br"), el("small", { texto: d.toLocaleDateString("pt-BR") })] : []));
    $("#hora-grande").textContent = d.toLocaleTimeString("pt-BR", opc);
    $("#data-grande").textContent = d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  }

  async function bateria() {
    if (!navigator.getBattery) return;
    try {
      const b = await navigator.getBattery();
      const atualizar = () => {
        $("#bateria").textContent = b.charging ? "🔌" : b.level < 0.2 ? "🪫" : "🔋";
        $("#bateria").title = `Bateria: ${Math.round(b.level * 100)}%`;
        if (!b.charging && b.level < 0.15 && prefs.ler("qualidade", "auto") === "auto") {
          fundo.definirQualidade("estatico");
          aviso("Bateria fraca: fundo animado pausado para economizar energia.");
        }
      };
      b.addEventListener("levelchange", atualizar);
      b.addEventListener("chargingchange", atualizar);
      atualizar();
    } catch (_) { /* sem API de bateria */ }
  }

  /* ======================================================================= Imagem de fundo */
  function escolherImagem(arquivo) {
    const img = new Image();
    img.onload = () => {
      // Reduz para no máximo 2560 px e JPEG, para caber no armazenamento local.
      const escala = Math.min(1, 2560 / Math.max(img.width, img.height));
      const c = el("canvas", { width: Math.round(img.width * escala), height: Math.round(img.height * escala) });
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      prefs.gravar("papelImagem", c.toDataURL("image/jpeg", 0.85));
      URL.revokeObjectURL(img.src);
      aplicarTudo();
    };
    img.src = URL.createObjectURL(arquivo);
  }

  /* ======================================================================= Início */
  async function iniciar() {
    const ids = await carregarJSON("themes/index.json", ["mare"]);
    const temas = await Promise.all(ids.map((id) => carregarJSON(`themes/${id}.json`, null)));
    for (const t of temas) if (t) estado.temas[t.id] = t;
    if (!estado.temas.mare) estado.temas.mare = TEMA_PADRAO;
    estado.perfis = await carregarJSON("themes/perfis.json", PERFIS_PADRAO);

    const usuario = window.VORTICIS_USUARIO || { nome: "Usuário", nivel: "Administrador" };
    $("#nome-usuario").textContent = usuario.nome;
    $("#nivel-usuario").textContent = usuario.nivel;
    document.querySelector(".avatar").textContent = usuario.nome.charAt(0).toUpperCase();

    aplicarTudo();

    $("#botao-iniciar").addEventListener("click", (e) => { e.stopPropagation(); alternarMenu(); });
    $("#abrir-personalizar").addEventListener("click", (e) => { e.stopPropagation(); abrirPersonalizar(); });
    $("#abrir-configuracoes").addEventListener("click", (e) => { e.stopPropagation(); abrirApp("configuracoes"); });
    document.querySelectorAll("[data-energia]").forEach((b) => b.addEventListener("click", () => {
      if (!ponte("energia-sessao", { acao: b.dataset.energia })) aviso(`Simulação: ${b.title.toLowerCase()}.`);
    }));
    document.querySelectorAll("#abas-config button").forEach((b) => b.addEventListener("click", () => trocarAba(b.dataset.aba)));
    $("#busca").addEventListener("input", (e) => renderApps(e.target.value));
    $("#busca").addEventListener("keydown", (e) => { if (e.key === "Enter") { const p = $("#grade-apps .app"); if (p) p.click(); } });
    $("#escolher-imagem").onclick = () => $("#arquivo-imagem").click();
    $("#arquivo-imagem").onchange = (e) => e.target.files[0] && escolherImagem(e.target.files[0]);
    $("#remover-imagem").onclick = () => { prefs.gravar("papelImagem", null); aplicarTudo(); };
    $("#op-relogio-grande").onchange = (e) => { prefs.gravar("relogioGrande", e.target.checked); aplicarTudo(); };
    $("#op-barra-opacidade").oninput = (e) => { prefs.mudar("barra", "opacidade", +e.target.value); aplicarTema(); };
    $("#op-barra-ocultar").onchange = (e) => { prefs.mudar("barra", "ocultar", e.target.checked); aplicarTudo(); };
    $("#op-relogio-segundos").onchange = (e) => { prefs.mudar("relogio", "segundos", e.target.checked); relogio(); };
    $("#op-relogio-data").onchange = (e) => { prefs.mudar("relogio", "data", e.target.checked); relogio(); };
    $("#restaurar-fixados").onclick = () => { prefs.gravar("fixados." + perfilAtual(), null); renderFixados(); aviso("Apps fixados restaurados."); };

    document.addEventListener("click", (e) => {
      if (!e.target.closest("#ctx")) $("#ctx").hidden = true;
      if (e.target.isConnected && !e.target.closest(".painel, #barra, #ctx")) fecharPaineis();
    });
    $("#barra").addEventListener("contextmenu", (e) => {
      if (e.target.closest(".fixado")) return;
      menuContexto(e, [["🎨 Personalizar barra", () => abrirPersonalizar("barra")], ["🧩 Estilo dos ícones", () => abrirPersonalizar("icones")]]);
    });
    $("#papel").addEventListener("contextmenu", (e) => menuContexto(e, [
      ["🎨 Trocar tema", () => abrirPersonalizar("tema")], ["🖼️ Fundo da área de trabalho", () => abrirPersonalizar("fundo")],
      ["⚙️ Configurações", () => abrirApp("configuracoes")], ["🖥️ Resolução da tela", () => abrirApp("configuracoes")]]));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") fecharPaineis();
      if (e.key === "Meta" || (e.key === " " && e.altKey)) alternarMenu();
    });

    relogio();
    setInterval(relogio, 1000);
    bateria();
  }

  // Chamado pelo vorticis-shell quando a outra camada (papel/barra) muda uma preferência.
  window.vorticisPreferencia = (chave, valor) => {
    prefs.sincronizando = true;
    try {
      try { localStorage.setItem("vorticis." + chave, JSON.stringify(valor)); } catch (_) { /* ignora */ }
      aplicarTudo();
    } finally { prefs.sincronizando = false; }
  };

  iniciar();
})();
