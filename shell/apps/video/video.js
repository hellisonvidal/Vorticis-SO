/* Vorticis Video Player — vídeos locais e por endereço, legendas, velocidade, PiP, retomar de onde parou. */
(function () {
  "use strict";
  const { el, tempo, prefs } = Vorticis;
  const $ = (s) => document.querySelector(s);
  const video = $("#video");
  const EXT_VIDEO = /\.(mp4|m4v|mkv|webm|avi|mov|ogv|mpg|mpeg|ts|wmv|flv|3gp)$/i;

  const estado = { itens: [], atual: -1, posicoes: prefs.ler("video.posicoes", {}) };

  function osd(texto) {
    const o = $("#osd");
    o.textContent = texto; o.hidden = false;
    clearTimeout(osd.t); osd.t = setTimeout(() => (o.hidden = true), 900);
  }

  /* ---------- Legendas: .srt → WebVTT ---------- */
  function srtParaVtt(srt) {
    return "WEBVTT\n\n" + srt.replace(/\r/g, "").replace(/(\d\d:\d\d:\d\d),(\d\d\d)/g, "$1.$2").replace(/^\d+\n(?=\d\d:)/gm, "");
  }
  async function adicionarLegenda(arquivoOuTexto, nome) {
    let texto = typeof arquivoOuTexto === "string" ? arquivoOuTexto : await arquivoOuTexto.text();
    if (!texto.startsWith("WEBVTT")) texto = srtParaVtt(texto);
    const url = URL.createObjectURL(new Blob([texto], { type: "text/vtt" }));
    const trilha = el("track", { kind: "subtitles", label: nome, srclang: "pt", src: url });
    video.append(trilha);
    const idx = video.textTracks.length - 1;
    $("#legendas").append(el("option", { value: String(idx), texto: nome }));
    $("#legendas").value = String(idx);
    escolherLegenda(String(idx));
    osd("💬 " + nome);
  }
  function escolherLegenda(v) {
    [...video.textTracks].forEach((t, i) => (t.mode = String(i) === v ? "showing" : "disabled"));
  }

  /* ---------- Lista ---------- */
  function adicionar(arquivos) {
    const legendas = arquivos.filter((f) => /\.(srt|vtt)$/i.test(f.name || f.nome));
    const videos = arquivos.filter((f) => EXT_VIDEO.test(f.name || f.nome) || (f.type || "").startsWith("video/"));
    for (const f of videos) {
      const nome = f.name || f.nome;
      const base = nome.replace(/\.[^.]+$/, "");
      estado.itens.push({ nome, id: nome + ":" + (f.size || 0), url: f.url || URL.createObjectURL(f),
        legenda: legendas.find((l) => (l.name || l.nome).startsWith(base)) });
    }
    renderLista();
    if (estado.atual < 0 && estado.itens.length) tocar(0);
    else if (legendas.length && !videos.length) legendas.forEach((l) => adicionarLegenda(l, l.name));
  }

  function renderLista() {
    $("#itens").replaceChildren(...(estado.itens.length ? estado.itens.map((it, i) =>
      el("button", { class: "item" + (i === estado.atual ? " atual" : ""), onclick: () => tocar(i) }, [
        el("span", { texto: (i === estado.atual ? "▶ " : "") + it.nome }),
        estado.posicoes[it.id] ? el("small", { texto: "Parou em " + tempo(estado.posicoes[it.id]) }) : null,
      ])) : [el("p", { class: "suave", style: "padding:8px", texto: "Nenhum vídeo na lista." })]));
  }

  function tocar(i) {
    const it = estado.itens[i];
    if (!it) return;
    estado.atual = i;
    video.querySelectorAll("track").forEach((t) => t.remove());
    $("#legendas").replaceChildren(el("option", { value: "", texto: "Sem legenda" }));
    video.src = it.url;
    $("#inicio").hidden = true;
    $("#barra-video").hidden = false;
    $("#titulo-video").hidden = false;
    $("#titulo-video").textContent = it.nome;
    document.title = it.nome + " · Vorticis Video";
    if (it.legenda) adicionarLegenda(it.legenda, it.legenda.name || "Legenda");
    video.addEventListener("loadedmetadata", function retomar() {
      video.removeEventListener("loadedmetadata", retomar);
      const p = estado.posicoes[it.id];
      if (p && p < video.duration - 10) { video.currentTime = p; osd("Retomando de " + tempo(p)); }
    });
    video.play().catch(() => {});
    renderLista();
  }

  /* ---------- Controles ---------- */
  video.addEventListener("loadedmetadata", () => ($("#t-total").textContent = tempo(video.duration)));
  let ultimoSalvo = 0;
  video.addEventListener("timeupdate", () => {
    $("#t-atual").textContent = tempo(video.currentTime);
    if (video.duration) $("#posicao").value = (video.currentTime / video.duration) * 1000;
    const it = estado.itens[estado.atual];
    if (it && Math.abs(video.currentTime - ultimoSalvo) > 5) {
      ultimoSalvo = video.currentTime;
      estado.posicoes[it.id] = video.currentTime > video.duration - 15 ? 0 : video.currentTime;
      prefs.gravar("video.posicoes", estado.posicoes);
    }
  });
  video.addEventListener("play", () => ($("#tocar").textContent = "⏸"));
  video.addEventListener("pause", () => ($("#tocar").textContent = "▶"));
  video.addEventListener("ended", () => tocar(estado.atual + 1));
  video.addEventListener("error", () => Vorticis.toast("Formato não suportado por este motor. Abra com: mpv \"" + (estado.itens[estado.atual] || {}).nome + "\"", 5000));
  video.addEventListener("click", () => (video.paused ? video.play() : video.pause()));
  video.addEventListener("dblclick", alternarCheia);

  function pular(s) { video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + s)); osd((s > 0 ? "⏩ +" : "⏪ ") + s + " s"); }
  function volume(d) { video.volume = Math.max(0, Math.min(1, video.volume + d)); $("#volume").value = video.volume * 100; osd("🔊 " + Math.round(video.volume * 100) + "%"); prefs.gravar("video.volume", video.volume); }
  function alternarCheia() {
    if (document.fullscreenElement) document.exitFullscreen();
    else (document.documentElement.requestFullscreen || (() => document.body.classList.toggle("cheia"))).call(document.documentElement);
  }
  document.addEventListener("fullscreenchange", () => document.body.classList.toggle("cheia", !!document.fullscreenElement));

  $("#tocar").onclick = () => (video.paused ? video.play() : video.pause());
  $("#voltar").onclick = () => pular(-10);
  $("#avancar").onclick = () => pular(10);
  $("#anterior").onclick = () => tocar(estado.atual - 1);
  $("#proximo").onclick = () => tocar(estado.atual + 1);
  $("#posicao").oninput = (e) => { if (video.duration) video.currentTime = (e.target.value / 1000) * video.duration; };
  $("#volume").oninput = (e) => { video.volume = e.target.value / 100; prefs.gravar("video.volume", video.volume); };
  video.volume = prefs.ler("video.volume", 0.9);
  $("#volume").value = video.volume * 100;
  $("#velocidade").onchange = (e) => { video.playbackRate = +e.target.value; osd(e.target.value.replace(".", ",") + "×"); };
  $("#legendas").onchange = (e) => escolherLegenda(e.target.value);
  $("#add-legenda").onclick = () => $("#in-legenda").click();
  $("#in-legenda").onchange = (e) => e.target.files[0] && adicionarLegenda(e.target.files[0], e.target.files[0].name);
  $("#cheia").onclick = alternarCheia;
  $("#pip").onclick = () => (document.pictureInPictureElement ? document.exitPictureInPicture() : video.requestPictureInPicture && video.requestPictureInPicture().catch(() => Vorticis.toast("Janela flutuante indisponível")));
  $("#captura").onclick = () => {
    const c = el("canvas", { width: video.videoWidth, height: video.videoHeight });
    c.getContext("2d").drawImage(video, 0, 0);
    c.toBlob((b) => {
      const a = el("a", { href: URL.createObjectURL(b), download: `captura-${Math.floor(video.currentTime)}s.png` });
      a.click(); osd("📷 Quadro salvo");
    });
  };
  $("#alt-lista").onclick = () => ($("#lista").hidden = !$("#lista").hidden);
  const abrirArq = () => $("#in-arquivos").click();
  $("#abrir").onclick = abrirArq;
  $("#abrir2").onclick = abrirArq;
  $("#in-arquivos").onchange = (e) => adicionar([...e.target.files]);
  $("#abrir-url").onclick = () => {
    const u = prompt("Endereço do vídeo (MP4/WebM/HLS direto):");
    if (u) adicionar([{ nome: decodeURIComponent(u.split("/").pop().split("?")[0]) || u, url: u, type: "video/mp4" }]);
  };

  // Barra some quando o mouse fica parado
  let ocioso;
  $("#tela").addEventListener("mousemove", () => {
    $("#tela").classList.remove("ocioso");
    clearTimeout(ocioso);
    ocioso = setTimeout(() => !video.paused && $("#tela").classList.add("ocioso"), 2500);
  });

  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" && e.target.type !== "range") return;
    const k = e.key.toLowerCase();
    if (k === " " || k === "k") { e.preventDefault(); $("#tocar").click(); }
    else if (k === "arrowright") pular(e.shiftKey ? 60 : 10);
    else if (k === "arrowleft") pular(e.shiftKey ? -60 : -10);
    else if (k === "arrowup") { e.preventDefault(); volume(0.05); }
    else if (k === "arrowdown") { e.preventDefault(); volume(-0.05); }
    else if (k === "f") alternarCheia();
    else if (k === "m") { video.muted = !video.muted; osd(video.muted ? "🔇" : "🔊"); }
    else if (k === "n") tocar(estado.atual + 1);
    else if (k === "p") tocar(estado.atual - 1);
  });

  document.addEventListener("dragover", (e) => e.preventDefault());
  document.addEventListener("drop", (e) => { e.preventDefault(); adicionar([...e.dataTransfer.files]); });

  const abrir = new URLSearchParams(location.search).getAll("abrir");
  if (abrir.length) adicionar(abrir.map((u) => ({ nome: decodeURIComponent(u.split("/").pop()), url: u, type: "video/" })));
  renderLista();
})();
