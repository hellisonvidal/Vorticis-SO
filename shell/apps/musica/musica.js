/* Vorticis Music — reprodutor de música leve (HTML5 Audio + Web Audio). */
(function () {
  "use strict";
  const { el, tempo, prefs } = Vorticis;
  const $ = (s) => document.querySelector(s);
  const audio = $("#audio");
  const EXT = /\.(mp3|flac|ogg|oga|opus|m4a|aac|wav|wma|webm)$/i;

  const estado = {
    faixas: [], fila: [], atual: -1, vista: "todas", filtro: "",
    aleatorio: prefs.ler("musica.aleatorio", false), repetir: prefs.ler("musica.repetir", "nao"),
    favoritas: new Set(prefs.ler("musica.favoritas", [])),
  };

  /* ---------- Metadados ID3v2 (título, artista, álbum, capa) ---------- */
  function sincsafe(b, o) { return (b[o] << 21) | (b[o + 1] << 14) | (b[o + 2] << 7) | b[o + 3]; }
  function textoID3(bytes) {
    const enc = bytes[0], dados = bytes.subarray(1);
    const dec = enc === 1 || enc === 2 ? new TextDecoder(enc === 2 ? "utf-16be" : "utf-16") : new TextDecoder(enc === 3 ? "utf-8" : "latin1");
    return dec.decode(dados).replace(/\0/g, "").trim();
  }
  async function lerID3(blob) {
    const cab = new Uint8Array(await blob.slice(0, 10).arrayBuffer());
    if (cab[0] !== 0x49 || cab[1] !== 0x44 || cab[2] !== 0x33) return {};
    const versao = cab[3], tamanho = sincsafe(cab, 6);
    const b = new Uint8Array(await blob.slice(10, 10 + Math.min(tamanho, 4 * 1024 * 1024)).arrayBuffer());
    const meta = {};
    let o = 0;
    while (o + 10 < b.length) {
      const id = String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]);
      if (!/^[A-Z0-9]{4}$/.test(id)) break;
      const t = versao === 4 ? sincsafe(b, o + 4) : (b[o + 4] << 24) | (b[o + 5] << 16) | (b[o + 6] << 8) | b[o + 7];
      const corpo = b.subarray(o + 10, o + 10 + t);
      if (id === "TIT2") meta.titulo = textoID3(corpo);
      else if (id === "TPE1") meta.artista = textoID3(corpo);
      else if (id === "TALB") meta.album = textoID3(corpo);
      else if (id === "APIC" && !meta.capa) {
        let p = 1;
        const fimMime = corpo.indexOf(0, p);
        const mime = new TextDecoder("latin1").decode(corpo.subarray(p, fimMime)) || "image/jpeg";
        p = fimMime + 2; // pula tipo da imagem
        const enc = corpo[0];
        if (enc === 1 || enc === 2) { while (p + 1 < corpo.length && !(corpo[p] === 0 && corpo[p + 1] === 0)) p += 2; p += 2; }
        else { while (p < corpo.length && corpo[p] !== 0) p++; p++; }
        meta.capa = URL.createObjectURL(new Blob([corpo.subarray(p)], { type: mime }));
      }
      o += 10 + t;
    }
    return meta;
  }

  function deNomeArquivo(nome) {
    const base = nome.replace(/\.[^.]+$/, "").replace(/^\d+[\s._-]+/, "");
    const partes = base.split(" - ");
    return partes.length > 1 ? { artista: partes[0].trim(), titulo: partes.slice(1).join(" - ").trim() } : { titulo: base };
  }

  /* ---------- Biblioteca ---------- */
  async function adicionar(itens) {
    const novos = [];
    for (const it of itens) {
      const nome = it.name || it.nome;
      if (!EXT.test(nome)) continue;
      const pasta = (it.webkitRelativePath || it.caminho || "").split("/").slice(-2, -1)[0] || "";
      const f = { id: nome + ":" + (it.size || it.tamanho || 0), nome, url: it.url || URL.createObjectURL(it), arquivo: it.url ? null : it,
                  album: pasta, artista: "Artista desconhecido", duracao: 0, ...deNomeArquivo(nome) };
      if (!estado.faixas.some((x) => x.id === f.id)) novos.push(f);
    }
    estado.faixas.push(...novos);
    estado.faixas.sort((a, b) => (a.artista + a.album + a.titulo).localeCompare(b.artista + b.album + b.titulo, "pt-BR"));
    render();
    for (const f of novos) {
      try {
        const blob = f.arquivo || (await (await fetch(f.url)).blob());
        Object.assign(f, Object.fromEntries(Object.entries(await lerID3(blob)).filter(([, v]) => v)));
      } catch (_) { /* sem metadados */ }
    }
    render();
    if (novos.length) Vorticis.toast(`${novos.length} música(s) adicionada(s)`);
  }

  async function carregarDoSistema() {
    if (!Vorticis.noSistema) return;
    const lista = await Vorticis.executarJSON("vorticis-midia", ["listar", "audio"]);
    if (lista && lista.length) adicionar(lista);
  }

  /* ---------- Vistas ---------- */
  function filtradas() {
    let base = estado.vista === "favoritas" ? estado.faixas.filter((f) => estado.favoritas.has(f.id))
      : estado.vista === "fila" ? estado.fila.map((i) => estado.faixas[i]).filter(Boolean) : estado.faixas;
    const q = estado.filtro.toLowerCase();
    if (q) base = base.filter((f) => (f.titulo + " " + f.artista + " " + f.album).toLowerCase().includes(q));
    return base;
  }

  function linhaFaixa(f, n) {
    const idx = estado.faixas.indexOf(f);
    const fav = estado.favoritas.has(f.id);
    return el("div", { class: "faixa" + (idx === estado.atual ? " tocando" : ""), ondblclick: () => tocarLista(filtradas(), f) }, [
      el("span", { class: "n", texto: idx === estado.atual && !audio.paused ? "♪" : String(n + 1) }),
      f.capa ? el("img", { class: "capa", src: f.capa, alt: "" }) : el("span", { class: "capa", texto: "🎵" }),
      el("div", { class: "titulo" }, [el("b", { texto: f.titulo }), el("small", { texto: f.artista })]),
      el("span", { class: "album", texto: f.album }),
      el("span", { class: "dur", texto: f.duracao ? tempo(f.duracao) : "" }),
      el("button", { class: "fav" + (fav ? " on" : ""), title: "Favoritar", texto: fav ? "❤️" : "🤍", onclick: (e) => { e.stopPropagation(); alternarFav(f); } }),
    ]);
  }

  function render() {
    const cont = $("#faixas");
    const titulos = { todas: "Todas as músicas", artistas: "Artistas", albuns: "Álbuns", favoritas: "Favoritas", fila: "Fila de reprodução" };
    $("#titulo-vista").textContent = titulos[estado.vista];
    const lista = filtradas();
    $("#contagem").textContent = `${lista.length} faixa(s)`;
    if (!estado.faixas.length) {
      cont.replaceChildren(el("div", { class: "vazio soltar" }, [el("b", { texto: "🎧" }),
        "Arraste músicas ou pastas para cá, ou use “Abrir pasta…”.", el("br"),
        el("small", { texto: "MP3, FLAC, OGG, Opus, M4A/AAC, WAV" })]));
      return;
    }
    if (estado.vista === "artistas" || estado.vista === "albuns") {
      const chave = estado.vista === "artistas" ? "artista" : "album";
      const grupos = new Map();
      for (const f of lista) { const k = f[chave] || "—"; if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(f); }
      cont.replaceChildren(el("div", { class: "grade", style: "padding:8px" }, [...grupos].map(([nome, fs]) =>
        el("button", { class: "cartao", style: "text-align:left", onclick: () => { estado.vista = "todas"; estado.filtro = nome; $("#busca").value = nome; marcarVista(); render(); } }, [
          fs.find((f) => f.capa) ? el("img", { src: fs.find((f) => f.capa).capa, style: "width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px", alt: "" })
            : el("div", { class: "capa", style: "width:100%;aspect-ratio:1;font-size:48px;border-radius:8px;display:grid;place-items:center;background:linear-gradient(135deg,var(--destaque),#052a52)", texto: chave === "artista" ? "🎤" : "💿" }),
          el("b", { style: "display:block;margin-top:8px", texto: nome }), el("small", { class: "suave", texto: `${fs.length} faixa(s)` })]))));
      return;
    }
    cont.replaceChildren(...lista.map(linhaFaixa));
  }

  function marcarVista() {
    document.querySelectorAll("#lateral [data-vista]").forEach((b) => b.setAttribute("aria-current", String(b.dataset.vista === estado.vista)));
  }

  function alternarFav(f) {
    estado.favoritas.has(f.id) ? estado.favoritas.delete(f.id) : estado.favoritas.add(f.id);
    prefs.gravar("musica.favoritas", [...estado.favoritas]);
    render();
  }

  /* ---------- Reprodução ---------- */
  function tocarLista(lista, inicial) {
    estado.fila = lista.map((f) => estado.faixas.indexOf(f));
    if (estado.aleatorio) estado.fila.sort(() => Math.random() - 0.5);
    const pos = inicial ? estado.fila.indexOf(estado.faixas.indexOf(inicial)) : 0;
    if (inicial && estado.aleatorio) { estado.fila.splice(pos, 1); estado.fila.unshift(estado.faixas.indexOf(inicial)); }
    tocarIndice(estado.fila[estado.aleatorio ? 0 : Math.max(0, pos)]);
  }

  function tocarIndice(i) {
    const f = estado.faixas[i];
    if (!f) return;
    estado.atual = i;
    audio.src = f.url;
    audio.play().catch(() => {});
    iniciarAudioGrafico();
    $("#p-titulo").textContent = f.titulo;
    $("#p-artista").textContent = `${f.artista}${f.album ? " — " + f.album : ""}`;
    $("#p-capa").replaceChildren(f.capa ? el("img", { src: f.capa, style: "width:100%;height:100%;border-radius:7px;object-fit:cover", alt: "" }) : "🎵");
    document.title = `${f.titulo} · Vorticis Music`;
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: f.titulo, artist: f.artista, album: f.album, artwork: f.capa ? [{ src: f.capa }] : [] });
    }
    render();
  }

  function passo(d) {
    if (!estado.fila.length) return;
    let p = estado.fila.indexOf(estado.atual) + d;
    if (p >= estado.fila.length) { if (estado.repetir === "todas") p = 0; else return; }
    if (p < 0) p = estado.repetir === "todas" ? estado.fila.length - 1 : 0;
    tocarIndice(estado.fila[p]);
  }

  /* ---------- Web Audio: equalizador e visualizador ---------- */
  let ctx, analisador, filtros = [];
  const BANDAS = [[60, "Graves"], [250, "Baixos-médios"], [1000, "Médios"], [4000, "Presença"], [12000, "Agudos"]];
  function iniciarAudioGrafico() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      const fonte = ctx.createMediaElementSource(audio);
      let no = fonte;
      const ganhos = prefs.ler("musica.eq", BANDAS.map(() => 0));
      filtros = BANDAS.map(([freq], i) => {
        const f = ctx.createBiquadFilter();
        f.type = i === 0 ? "lowshelf" : i === BANDAS.length - 1 ? "highshelf" : "peaking";
        f.frequency.value = freq; f.Q.value = 1; f.gain.value = ganhos[i] || 0;
        no.connect(f); no = f;
        return f;
      });
      analisador = ctx.createAnalyser();
      analisador.fftSize = 128;
      no.connect(analisador);
      analisador.connect(ctx.destination);
      montarEQ();
    } catch (_) { /* Web Audio indisponível: toca sem EQ */ }
  }

  function montarEQ() {
    const eq = $("#eq");
    const predef = { Plano: [0, 0, 0, 0, 0], "Mais graves": [6, 3, 0, 0, 1], Vocal: [-2, 0, 4, 3, 0], Rock: [4, 1, -2, 2, 4], Clássica: [3, 1, 0, 1, 3] };
    const sel = el("select", { class: "campo", onchange: (e) => aplicar(predef[e.target.value]) },
      Object.keys(predef).map((n) => el("option", { texto: n })));
    const sliders = filtros.map((f, i) => el("input", { type: "range", min: -12, max: 12, step: 1, value: f.gain.value, orient: "vertical",
      oninput: (e) => { f.gain.value = +e.target.value; prefs.gravar("musica.eq", filtros.map((x) => x.gain.value)); } }));
    function aplicar(v) { v.forEach((g, i) => { filtros[i].gain.value = g; sliders[i].value = g; }); prefs.gravar("musica.eq", v); }
    eq.replaceChildren(el("b", { texto: "Equalizador" }), sel, ...BANDAS.map(([, nome], i) => el("label", {}, [sliders[i], nome])));
  }

  function desenharVisual() {
    const c = $("#visual");
    if (!c.hidden && analisador && !audio.paused) {
      const w = (c.width = c.clientWidth), h = (c.height = c.clientHeight);
      const g = c.getContext("2d"), dados = new Uint8Array(analisador.frequencyBinCount);
      analisador.getByteFrequencyData(dados);
      const cor = getComputedStyle(document.documentElement).getPropertyValue("--destaque").trim() || "#38b6ff";
      g.clearRect(0, 0, w, h);
      g.fillStyle = cor;
      const larg = w / dados.length;
      dados.forEach((v, i) => { const a = (v / 255) * h; g.globalAlpha = 0.35 + v / 400; g.fillRect(i * larg + 1, h - a, larg - 2, a); });
    }
    requestAnimationFrame(desenharVisual);
  }

  /* ---------- Eventos ---------- */
  audio.addEventListener("loadedmetadata", () => {
    $("#t-total").textContent = tempo(audio.duration);
    const f = estado.faixas[estado.atual];
    if (f && !f.duracao) { f.duracao = audio.duration; render(); }
  });
  audio.addEventListener("timeupdate", () => {
    $("#t-atual").textContent = tempo(audio.currentTime);
    if (audio.duration) $("#posicao").value = (audio.currentTime / audio.duration) * 1000;
  });
  audio.addEventListener("play", () => { $("#tocar").textContent = "⏸"; render(); });
  audio.addEventListener("pause", () => { $("#tocar").textContent = "▶"; render(); });
  audio.addEventListener("ended", () => (estado.repetir === "uma" ? (audio.currentTime = 0, audio.play()) : passo(1)));

  $("#tocar").onclick = () => {
    if (estado.atual < 0) { if (filtradas().length) tocarLista(filtradas()); return; }
    audio.paused ? audio.play() : audio.pause();
  };
  $("#anterior").onclick = () => (audio.currentTime > 3 ? (audio.currentTime = 0) : passo(-1));
  $("#proxima").onclick = () => passo(1);
  $("#posicao").oninput = (e) => { if (audio.duration) audio.currentTime = (e.target.value / 1000) * audio.duration; };
  $("#volume").oninput = (e) => { audio.volume = e.target.value / 100; prefs.gravar("musica.volume", +e.target.value); };
  $("#volume").value = prefs.ler("musica.volume", 80);
  audio.volume = $("#volume").value / 100;

  function atualizarModos() {
    $("#aleatorio").classList.toggle("on", estado.aleatorio);
    $("#repetir").classList.toggle("on", estado.repetir !== "nao");
    $("#repetir").textContent = estado.repetir === "uma" ? "🔂" : "🔁";
  }
  $("#aleatorio").onclick = () => { estado.aleatorio = !estado.aleatorio; prefs.gravar("musica.aleatorio", estado.aleatorio); atualizarModos(); };
  $("#repetir").onclick = () => {
    estado.repetir = { nao: "todas", todas: "uma", uma: "nao" }[estado.repetir];
    prefs.gravar("musica.repetir", estado.repetir); atualizarModos();
  };
  $("#tocar-tudo").onclick = () => tocarLista(filtradas());
  $("#busca").oninput = (e) => { estado.filtro = e.target.value; render(); };
  document.querySelectorAll("#lateral [data-vista]").forEach((b) => (b.onclick = () => { estado.vista = b.dataset.vista; marcarVista(); render(); }));
  $("#add-pasta").onclick = () => $("#in-pasta").click();
  $("#add-arquivos").onclick = () => $("#in-arquivos").click();
  $("#in-pasta").onchange = (e) => adicionar([...e.target.files]);
  $("#in-arquivos").onchange = (e) => adicionar([...e.target.files]);
  $("#btn-eq").onclick = () => { iniciarAudioGrafico(); $("#eq").hidden = !$("#eq").hidden; };
  $("#btn-visual").onclick = () => { $("#visual").hidden = !$("#visual").hidden; prefs.gravar("musica.visual", !$("#visual").hidden); };
  $("#visual").hidden = !prefs.ler("musica.visual", true);

  // Arrastar e soltar (arquivos e pastas)
  async function lerEntrada(entrada, saida) {
    if (entrada.isFile) saida.push(await new Promise((ok) => entrada.file(ok)));
    else if (entrada.isDirectory) {
      const leitor = entrada.createReader();
      let lote;
      do { lote = await new Promise((ok) => leitor.readEntries(ok)); for (const e of lote) await lerEntrada(e, saida); } while (lote.length);
    }
  }
  document.addEventListener("dragover", (e) => { e.preventDefault(); document.body.classList.add("arrastando"); });
  document.addEventListener("dragleave", () => document.body.classList.remove("arrastando"));
  document.addEventListener("drop", async (e) => {
    e.preventDefault();
    document.body.classList.remove("arrastando");
    const arquivos = [];
    for (const it of e.dataTransfer.items) { const en = it.webkitGetAsEntry && it.webkitGetAsEntry(); if (en) await lerEntrada(en, arquivos); }
    adicionar(arquivos.length ? arquivos : [...e.dataTransfer.files]);
  });

  // Teclas de mídia e atalhos
  if ("mediaSession" in navigator) {
    navigator.mediaSession.setActionHandler("play", () => audio.play());
    navigator.mediaSession.setActionHandler("pause", () => audio.pause());
    navigator.mediaSession.setActionHandler("previoustrack", () => passo(-1));
    navigator.mediaSession.setActionHandler("nexttrack", () => passo(1));
  }
  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input[type=search], input[type=text]")) return;
    if (e.code === "Space") { e.preventDefault(); $("#tocar").click(); }
    if (e.key === "ArrowRight" && e.ctrlKey) passo(1);
    if (e.key === "ArrowLeft" && e.ctrlKey) passo(-1);
  });

  // Arquivos passados na abertura (vorticis-app musica arquivo.mp3 → ?abrir=file:///...)
  const abrir = new URLSearchParams(location.search).getAll("abrir");
  if (abrir.length) adicionar(abrir.map((u) => ({ nome: decodeURIComponent(u.split("/").pop()), url: u }))).then(() => tocarLista(estado.faixas));

  atualizarModos();
  render();
  desenharVisual();
  carregarDoSistema();
})();
