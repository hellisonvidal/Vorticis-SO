/*
 * Vorticis Shell — barra de tarefas, menu, temas e perfis.
 *
 * Dentro do Vorticis SO esta página roda numa janela WebKitGTK em camada de
 * fundo (layer-shell). A comunicação com o sistema usa a ponte
 * window.webkit.messageHandlers.vorticis; fora do SO (navegador comum) as
 * ações são apenas simuladas.
 */
(function () {
  "use strict";

  const APPS = {
    navegador:         { nome: "Navegador",      icone: "🌐", cor: "#1f8fff", cmd: "xdg-open https://", tipo: "Linux" },
    arquivos:          { nome: "Arquivos",       icone: "📁", cor: "#2a9d8f", cmd: "nautilus", tipo: "Linux" },
    musica:            { nome: "Música",         icone: "🎵", cor: "#e76f51", cmd: "rhythmbox", tipo: "Linux" },
    fotos:             { nome: "Fotos",          icone: "🖼️", cor: "#8e5cf7", cmd: "loupe", tipo: "Linux" },
    loja:              { nome: "Loja Vorticis",  icone: "🛍️", cor: "#0a84ff", cmd: "gnome-software", tipo: "Linux" },
    escritorio:        { nome: "Escritório",     icone: "📝", cor: "#3a86ff", cmd: "libreoffice", tipo: "Linux" },
    email:             { nome: "E-mail",         icone: "✉️", cor: "#4895ef", cmd: "thunderbird", tipo: "Linux" },
    agenda:            { nome: "Agenda",         icone: "📅", cor: "#ef476f", cmd: "gnome-calendar", tipo: "Linux" },
    terminal:          { nome: "Terminal",       icone: "⌨️", cor: "#264653", cmd: "foot", tipo: "Linux" },
    codigo:            { nome: "Código",         icone: "🧩", cor: "#0077b6", cmd: "codium", tipo: "Linux" },
    "contêineres":     { nome: "Contêineres",    icone: "📦", cor: "#5e60ce", cmd: "distrobox-assemble", tipo: "Linux" },
    monitor:           { nome: "Monitor",        icone: "📈", cor: "#06d6a0", cmd: "vorticis-recursos painel", tipo: "Vorticis" },
    steam:             { nome: "Steam",          icone: "🎮", cor: "#1b2838", cmd: "steam", tipo: "Windows/Linux" },
    heroic:            { nome: "Heroic",         icone: "🛡️", cor: "#6a4c93", cmd: "heroic", tipo: "Windows" },
    lutris:            { nome: "Lutris",         icone: "🦦", cor: "#f4a261", cmd: "lutris", tipo: "Windows/Linux" },
    android:           { nome: "Android",        icone: "🤖", cor: "#3ddc84", cmd: "waydroid show-full-ui", tipo: "Android" },
    discord:           { nome: "Discord",        icone: "💬", cor: "#5865f2", cmd: "flatpak run com.discordapp.Discord", tipo: "Linux" },
    "jogos-educativos":{ nome: "Jogos",          icone: "🧠", cor: "#ffb703", cmd: "gcompris-qt", tipo: "Linux" },
    desenho:           { nome: "Desenho",        icone: "🎨", cor: "#fb8500", cmd: "tuxpaint", tipo: "Linux" },
    "navegador-seguro":{ nome: "Internet Kids",  icone: "🐳", cor: "#219ebc", cmd: "vorticis-navegadores abrir --infantil", tipo: "Linux" },
    windows:           { nome: "Apps Windows",   icone: "🪟", cor: "#0078d4", cmd: "bottles", tipo: "Windows" },
    drivers:           { nome: "Drivers",        icone: "🔧", cor: "#457b9d", cmd: "vorticis-drivers", tipo: "Vorticis" },
    usuarios:          { nome: "Usuários",       icone: "👥", cor: "#1d3557", cmd: "vorticis-usuarios", tipo: "Vorticis" },
    seguranca:         { nome: "Segurança",      icone: "🔐", cor: "#2b9348", cmd: "vorticis-rede status", tipo: "Vorticis" },
  };

  const PERFIS_PADRAO = {
    basico: { nome: "Básico", icone: "🏠", fixados: ["navegador", "arquivos", "musica", "fotos", "loja"], barra: { rotulos: true, tamanho: "grande" } },
  };

  const TEMA_PADRAO = {
    id: "mare", nome: "Maré", animado: true,
    fundoEstatico: "radial-gradient(ellipse at 30% 0%, #4fb3ff 0%, #0b6fb8 35%, #03214a 100%)",
    cores: {
      destaque: "#38b6ff", destaqueForte: "#0a84ff", texto: "#eaf6ff", textoSuave: "#a9cbe6",
      painel: "rgba(6, 30, 64, 0.62)", painelBorda: "rgba(140, 210, 255, 0.22)",
      item: "rgba(255, 255, 255, 0.07)", itemHover: "rgba(120, 200, 255, 0.20)",
    },
    agua: { corFundo: "#021a3d", corMeio: "#0d78c4", corBrilho: "#c6ecff", causticas: 0.35, amortecimento: 0.985, gotasAmbiente: true },
  };

  /* ---------- Preferências (localStorage pode falhar: modo privado etc.) ---------- */
  const prefs = {
    ler(chave, padrao) {
      try { const v = localStorage.getItem("vorticis." + chave); return v === null ? padrao : JSON.parse(v); }
      catch (_) { return padrao; }
    },
    gravar(chave, valor) {
      try { localStorage.setItem("vorticis." + chave, JSON.stringify(valor)); } catch (_) { /* ignora */ }
      if (!prefs.sincronizando) ponte("preferencia", { chave, valor });
    },
    sincronizando: false,
  };

  function ponte(acao, dados) {
    try {
      const h = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.vorticis;
      if (h) { h.postMessage(JSON.stringify({ acao, ...dados })); return true; }
    } catch (_) { /* fora do SO */ }
    return false;
  }

  async function carregarJSON(url, padrao) {
    try {
      const r = await fetch(url, { cache: "no-cache" });
      if (!r.ok) throw new Error(r.status);
      return await r.json();
    } catch (_) { return padrao; }
  }

  const $ = (s) => document.querySelector(s);
  const el = (tag, attrs = {}, filhos = []) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "texto") e.textContent = v;
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
      else if (k === "style") e.style.cssText = v;
      else e.setAttribute(k, v);
    }
    for (const f of [].concat(filhos)) if (f) e.append(f);
    return e;
  };

  /* ---------- Estado ---------- */
  // Modo de exibição: "completo" (navegador/demonstração), "papel" (camada de fundo do SO)
  // ou "barra" (camada superior do SO, com fundo transparente).
  const MODO = new URLSearchParams(location.search).get("modo") || "completo";
  document.body.classList.add("modo-" + MODO);

  const estado = { temas: {}, perfis: PERFIS_PADRAO, tema: null, perfil: "basico", qualidade: "auto", abertos: new Set() };
  const agua = MODO === "barra"
    ? { definirTema() {}, definirQualidade: (q) => (q === "auto" ? AguaVorticis.detectarQualidade() : q) }
    : new AguaVorticis($("#papel"));

  function aviso(msg) {
    const a = $("#aviso");
    a.textContent = msg;
    a.hidden = false;
    clearTimeout(aviso.t);
    aviso.t = setTimeout(() => (a.hidden = true), 2600);
  }

  function iconeApp(id) {
    const a = APPS[id] || { nome: id, icone: "❔", cor: "#555" };
    return el("span", { class: "icone", style: `--cor-app:${a.cor}`, "aria-hidden": "true", texto: a.icone });
  }

  function abrirApp(id) {
    const a = APPS[id];
    if (!a) return;
    estado.abertos.add(id);
    renderFixados();
    fecharPaineis();
    if (!ponte("abrir", { app: id, cmd: a.cmd })) aviso(`Abrindo ${a.nome}… (simulação: ${a.cmd})`);
  }

  /* ---------- Temas ---------- */
  function aplicarTema(id) {
    const t = estado.temas[id] || TEMA_PADRAO;
    estado.tema = t.id;
    const c = t.cores, raiz = document.documentElement.style;
    raiz.setProperty("--destaque", c.destaque);
    raiz.setProperty("--destaque-forte", c.destaqueForte);
    raiz.setProperty("--texto", c.texto);
    raiz.setProperty("--texto-suave", c.textoSuave);
    raiz.setProperty("--painel", c.painel);
    raiz.setProperty("--painel-borda", c.painelBorda);
    raiz.setProperty("--item", c.item);
    raiz.setProperty("--item-hover", c.itemHover);
    if (MODO !== "barra") document.body.style.background = t.fundoEstatico;
    agua.definirTema(t);
    aplicarQualidade(estado.qualidade, false);
    prefs.gravar("tema", t.id);
    renderConfig();
  }

  function aplicarQualidade(q, gravar = true) {
    estado.qualidade = q;
    const efetiva = agua.definirQualidade(q);
    document.body.classList.toggle("modo-leve", efetiva !== "alto");
    const nomes = { alto: "alta (GPU/WebGL)", leve: "leve (CPU, resolução reduzida)", estatico: "estática (sem animação)" };
    const temaEstatico = (estado.temas[estado.tema] || {}).animado === false;
    $("#qualidade-info").textContent = temaEstatico
      ? "Este tema é estático: custo zero de processamento."
      : `Em uso: ${nomes[efetiva]}${q === "auto" ? " — escolhida pelo hardware detectado" : ""}.`;
    if (gravar) prefs.gravar("qualidade", q);
    renderConfig();
  }

  /* ---------- Perfis ---------- */
  function aplicarPerfil(id) {
    const p = estado.perfis[id] || estado.perfis.basico || PERFIS_PADRAO.basico;
    estado.perfil = id in estado.perfis ? id : "basico";
    const b = document.body.classList;
    b.toggle("barra-rotulos", !!p.barra.rotulos);
    b.remove("barra-grande", "barra-medio", "barra-pequeno");
    b.add("barra-" + (p.barra.tamanho || "medio"));
    $("#indicador-perfil").textContent = `${p.icone} ${p.nome}`;
    if (!prefs.sincronizando) ponte("energia", { perfil: p.barra.desempenho ? "desempenho" : "equilibrado" });
    prefs.gravar("perfil", estado.perfil);
    renderFixados();
    renderConfig();
  }

  /* ---------- Renderização ---------- */
  function renderFixados() {
    const p = estado.perfis[estado.perfil] || PERFIS_PADRAO.basico;
    const cont = $("#fixados");
    cont.replaceChildren(...p.fixados.map((id) =>
      el("button", {
        class: "fixado" + (estado.abertos.has(id) ? " aberto" : ""),
        title: (APPS[id] || {}).nome || id,
        onclick: () => abrirApp(id),
      }, [iconeApp(id), el("span", { class: "rotulo", texto: (APPS[id] || {}).nome || id })])
    ));
  }

  function renderApps(filtro = "") {
    const f = filtro.trim().toLowerCase();
    const ids = Object.keys(APPS).filter((id) => {
      const a = APPS[id];
      return !f || a.nome.toLowerCase().includes(f) || a.tipo.toLowerCase().includes(f) || id.includes(f);
    });
    $("#grade-apps").replaceChildren(...ids.map((id) =>
      el("button", { class: "app", onclick: () => abrirApp(id) },
        [iconeApp(id), el("span", { texto: APPS[id].nome }), el("small", { texto: APPS[id].tipo })])
    ));
  }

  function renderConfig() {
    $("#lista-temas").replaceChildren(...Object.values(estado.temas).map((t) =>
      el("button", { class: "tema", "aria-pressed": String(t.id === estado.tema), title: t.descricao || "", onclick: () => aplicarTema(t.id) },
        [el("div", { class: "amostra", style: `background:${t.fundoEstatico}` }),
         el("span", { texto: `${t.nome}${t.animado === false ? " · estático" : " · animado"}` })])
    ));
    document.querySelectorAll("#qualidade button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.q === estado.qualidade)));
    $("#lista-perfis").replaceChildren(...Object.entries(estado.perfis).map(([id, p]) =>
      el("button", { class: "perfil", "aria-pressed": String(id === estado.perfil), onclick: () => aplicarPerfil(id) },
        [el("b", { texto: p.icone }), p.nome])
    ));
  }

  /* ---------- Painéis ---------- */
  function fecharPaineis() {
    if (!$("#menu").hidden || !$("#config").hidden) ponte("painel", { aberto: false });
    $("#menu").hidden = true;
    $("#config").hidden = true;
    $("#botao-iniciar").setAttribute("aria-expanded", "false");
  }

  function alternarMenu() {
    const m = $("#menu");
    const abrir = m.hidden;
    fecharPaineis();
    if (abrir) {
      ponte("painel", { aberto: true });
      m.hidden = false;
      $("#botao-iniciar").setAttribute("aria-expanded", "true");
      $("#busca").value = "";
      renderApps();
      setTimeout(() => $("#busca").focus(), 0);
    }
  }

  /* ---------- Relógio e bateria ---------- */
  function relogio() {
    const d = new Date();
    const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    $("#relogio").innerHTML = `${hora}<br><small>${d.toLocaleDateString("pt-BR")}</small>`;
    $("#hora-grande").textContent = hora;
    $("#data-grande").textContent = d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  }

  async function bateria() {
    if (!navigator.getBattery) return;
    try {
      const b = await navigator.getBattery();
      const atualizar = () => {
        $("#bateria").textContent = b.charging ? "🔌" : (b.level < 0.2 ? "🪫" : "🔋");
        $("#bateria").title = `Bateria: ${Math.round(b.level * 100)}%`;
        // Economia automática: bateria fraca e desconectado → fundo estático.
        if (!b.charging && b.level < 0.15 && estado.qualidade === "auto") {
          agua.definirQualidade("estatico");
          aviso("Bateria fraca: fundo animado pausado para economizar energia.");
        }
      };
      b.addEventListener("levelchange", atualizar);
      b.addEventListener("chargingchange", atualizar);
      atualizar();
    } catch (_) { /* sem API de bateria */ }
  }

  /* ---------- Inicialização ---------- */
  async function iniciar() {
    const ids = await carregarJSON("themes/index.json", ["mare"]);
    const temas = await Promise.all(ids.map((id) => carregarJSON(`themes/${id}.json`, id === "mare" ? TEMA_PADRAO : null)));
    for (const t of temas) if (t) estado.temas[t.id] = t;
    if (!estado.temas.mare) estado.temas.mare = TEMA_PADRAO;
    estado.perfis = await carregarJSON("themes/perfis.json", PERFIS_PADRAO);

    const usuario = (window.VORTICIS_USUARIO || { nome: "Usuário", nivel: "Administrador" });
    $("#nome-usuario").textContent = usuario.nome;
    $("#nivel-usuario").textContent = usuario.nivel;
    document.querySelector(".avatar").textContent = usuario.nome.charAt(0).toUpperCase();

    estado.qualidade = prefs.ler("qualidade", "auto");
    aplicarTema(prefs.ler("tema", "mare"));
    aplicarPerfil(prefs.ler("perfil", usuario.perfil || "basico"));

    $("#botao-iniciar").addEventListener("click", (e) => { e.stopPropagation(); alternarMenu(); });
    $("#abrir-config").addEventListener("click", (e) => { e.stopPropagation(); fecharPaineis(); ponte("painel", { aberto: true }); $("#config").hidden = false; });
    $("#busca").addEventListener("input", (e) => renderApps(e.target.value));
    $("#busca").addEventListener("keydown", (e) => {
      if (e.key === "Enter") { const p = $("#grade-apps .app"); if (p) p.click(); }
    });
    document.querySelectorAll("#qualidade button").forEach((b) => b.addEventListener("click", () => aplicarQualidade(b.dataset.q)));
    document.addEventListener("click", (e) => { if (e.target.isConnected && !e.target.closest(".painel, #barra")) fecharPaineis(); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") fecharPaineis();
      if (e.key === "Meta" || (e.key === " " && e.altKey)) alternarMenu();
    });

    relogio();
    setInterval(relogio, 10000);
    bateria();
  }

  // Chamado pelo vorticis-shell quando a outra camada (papel/barra) muda uma preferência.
  window.vorticisPreferencia = (chave, valor) => {
    prefs.sincronizando = true;
    try {
      if (chave === "tema") aplicarTema(valor);
      else if (chave === "qualidade") aplicarQualidade(valor);
      else if (chave === "perfil") aplicarPerfil(valor);
    } finally { prefs.sincronizando = false; }
  };

  iniciar();
})();
