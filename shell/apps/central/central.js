/* Central de Apps Vorticis — interface do vorticis-apps. */
(function () {
  "use strict";
  const { el } = Vorticis;
  const $ = (s) => document.querySelector(s);
  const ICONES_CAT = { "Multimídia": "🎬", Internet: "🌐", "Comunicação": "💬", "Escritório": "📝", Jogos: "🎮", Android: "🤖",
    Windows: "🪟", "Gráficos": "🎨", Desenvolvimento: "🧑‍💻", "Educação": "🧠", "Utilitários": "🧰" };
  const estado = { cat: null, vista: "explorar", ocupados: new Set(), instaladosDemo: new Set(Vorticis.prefs.ler("central.demo", [])) };

  async function carregar() {
    let dados = await Vorticis.executarJSON("vorticis-apps", ["catalogo", "--json"]);
    if (!dados) {
      dados = await (await fetch("catalogo.json")).json();
      dados.apps.forEach((a) => (a.instalado = a.fonte.startsWith("vorticis:") || estado.instaladosDemo.has(a.id)));
    }
    estado.dados = dados;
    renderLateral();
    render();
  }

  function renderLateral() {
    const botao = (vista, rotulo, cat = null) => el("button", {
      "aria-current": String(estado.vista === vista && estado.cat === cat),
      onclick: () => { estado.vista = vista; estado.cat = cat; $("#busca").value = ""; renderLateral(); render(); },
    }, rotulo);
    $("#lateral").replaceChildren(
      botao("explorar", "✨ Explorar"), botao("instalados", "✅ Instalados"), botao("atualizacoes", "🔄 Atualizações"),
      el("h3", { texto: "Categorias" }),
      ...estado.dados.categorias.map((c) => botao("categoria", `${ICONES_CAT[c] || "📦"} ${c}`, c)));
  }

  function cartao(app) {
    const ocupado = estado.ocupados.has(app.id);
    const sistema = (app.fonte || "").startsWith("vorticis:");
    let acao;
    if (ocupado) acao = el("div", { class: "progresso-inst" }, el("i"));
    else if (sistema) acao = el("span", { class: "chip ok", texto: "✔ Já vem no Vorticis" });
    else if (app.instalado) acao = el("div", { style: "display:flex;gap:6px" }, [
      el("span", { class: "chip ok", texto: "✔ Instalado" }),
      el("button", { class: "botao perigo", texto: "Remover", onclick: () => operar(app, "remover") })]);
    else acao = el("button", { class: "botao primario", texto: app.fonte.startsWith("web:") ? "Abrir site" : "Instalar", onclick: () => operar(app, "instalar") });
    const origem = { flatpak: "Flathub", apt: "Debian", compat: "Vorticis Compat", web: "Site oficial", vorticis: "Vorticis" }[(app.fonte || "").split(":")[0]] || app.origem || "";
    return el("div", { class: "cartao app-cartao" }, [
      el("div", { class: "icone", style: `--cor:${app.cor || "#1e7fd0"}`, texto: app.icone || "📦" }),
      el("div", { class: "texto" }, [el("b", { texto: app.nome }), el("small", { class: "suave origem", texto: `${app.categoria || ""}${origem ? " · " + origem : ""}` }),
        el("p", { texto: app.descricao || "" }), acao]),
    ]);
  }

  async function operar(app, acao) {
    estado.ocupados.add(app.id);
    render();
    const r = await Vorticis.executar("vorticis-apps", [acao, app.id], { codigo: 0, saida: "" });
    estado.ocupados.delete(app.id);
    if (r.codigo === 0) {
      app.instalado = acao === "instalar";
      if (!Vorticis.noSistema) {
        app.instalado ? estado.instaladosDemo.add(app.id) : estado.instaladosDemo.delete(app.id);
        Vorticis.prefs.gravar("central.demo", [...estado.instaladosDemo]);
      }
      Vorticis.toast(`${app.nome} ${acao === "instalar" ? "instalado" : "removido"}${Vorticis.noSistema ? "" : " (demonstração)"}.`);
    } else {
      Vorticis.toast(`Não foi possível ${acao} ${app.nome}: ${(r.saida || "").split("\n").slice(-2).join(" ")}`, 5000);
    }
    render();
  }

  async function renderBusca(q) {
    const c = $("#conteudo");
    const locais = estado.dados.apps.filter((a) => (a.nome + a.descricao + a.categoria).toLowerCase().includes(q.toLowerCase()));
    c.replaceChildren(el("h2", { texto: `Resultados para “${q}”` }), el("p", { class: "sub", texto: "Catálogo Vorticis, Flathub e repositórios Debian" }),
      locais.length ? el("div", { class: "destaques" }, locais.map(cartao)) : el("p", { class: "suave", texto: "Nada no catálogo Vorticis." }));
    if (Vorticis.noSistema && q.length > 2) {
      const extra = (await Vorticis.executarJSON("vorticis-apps", ["buscar", q, "--json"])) || [];
      const novos = extra.filter((x) => x.origem !== "Catálogo Vorticis");
      if (novos.length) c.append(el("div", { class: "secao" }, el("h3", { texto: "Mais resultados" })), el("div", { class: "destaques" }, novos.map(cartao)));
    }
  }

  async function render() {
    const c = $("#conteudo");
    const q = $("#busca").value.trim();
    if (q) return renderBusca(q);
    const apps = estado.dados.apps;
    if (estado.vista === "explorar") {
      c.replaceChildren(
        el("div", { class: "banner" }, [el("h2", { texto: "Tudo o que você precisa, em um só lugar" }),
          el("p", { texto: "Apps de Linux, programas de Windows e apps Android — instalados com um clique, com atualizações automáticas." })]),
        el("div", { class: "secao" }, el("h3", { texto: "Destaques" })),
        el("div", { class: "destaques" }, apps.filter((a) => a.destaque).map(cartao)),
        ...estado.dados.categorias.flatMap((cat) => [
          el("div", { class: "secao" }, [el("h3", { texto: `${ICONES_CAT[cat] || ""} ${cat}` }),
            el("a", { href: "#", texto: "ver tudo", onclick: (e) => { e.preventDefault(); estado.vista = "categoria"; estado.cat = cat; renderLateral(); render(); } })]),
          el("div", { class: "destaques" }, apps.filter((a) => a.categoria === cat).slice(0, 3).map(cartao))]));
    } else if (estado.vista === "categoria") {
      c.replaceChildren(el("h2", { texto: `${ICONES_CAT[estado.cat] || ""} ${estado.cat}` }),
        el("p", { class: "sub", texto: { Windows: "Programas e jogos de Windows: use estas ferramentas ou dê dois cliques em qualquer .exe/.msi.",
          Android: "Apps Android rodam nativamente no Waydroid. Dê dois cliques em qualquer .apk para instalar." }[estado.cat] || "" }),
        el("div", { class: "destaques" }, apps.filter((a) => a.categoria === estado.cat).map(cartao)));
    } else if (estado.vista === "instalados") {
      const doCatalogo = apps.filter((a) => a.instalado);
      c.replaceChildren(el("h2", { texto: "Instalados" }), el("p", { class: "sub", texto: "Apps do catálogo e de outras fontes" }),
        el("div", { class: "destaques" }, doCatalogo.map(cartao)));
      if (Vorticis.noSistema) {
        const todos = (await Vorticis.executarJSON("vorticis-apps", ["instalados", "--json"])) || [];
        const extras = todos.filter((x) => !apps.some((a) => a.fonte === x.fonte));
        if (extras.length) c.append(el("div", { class: "secao" }, el("h3", { texto: "Outros apps" })),
          el("div", { class: "cartao" }, extras.map((x) => el("div", { class: "linha" }, [
            el("div", { class: "texto" }, [el("b", { texto: x.nome }), el("br"), el("small", { texto: `${x.tipo} ${x.versao}` })]),
            el("button", { class: "botao perigo", texto: "Remover", onclick: async () => {
              const r = await Vorticis.executar("vorticis-apps", ["remover", x.fonte]);
              Vorticis.toast(r.codigo === 0 ? `${x.nome} removido.` : "Falha ao remover."); render(); } })]))));
      }
    } else if (estado.vista === "atualizacoes") {
      c.replaceChildren(el("h2", { texto: "Atualizações" }), el("p", { class: "sub", texto: "Sistema, apps Flatpak, Android e firmware (BIOS/dispositivos)" }),
        el("div", { class: "vazio" }, [el("b", { texto: "🔄" }), "Procurando atualizações…"]));
      const lista = (await Vorticis.executarJSON("vorticis-apps", ["atualizacoes", "--json"], [])) || [];
      const btn = el("button", { class: "botao primario", texto: "Atualizar tudo", onclick: async () => {
        btn.disabled = true; btn.textContent = "Atualizando…";
        const r = await Vorticis.executar("vorticis-apps", ["atualizar"]);
        Vorticis.toast(r.codigo === 0 ? "Tudo atualizado!" : "Algumas atualizações falharam."); render(); } });
      c.replaceChildren(el("h2", { texto: "Atualizações" }), el("p", { class: "sub", texto: "Sistema, apps Flatpak, Android e firmware (BIOS/dispositivos)" }),
        lista.length ? el("div", {}, [el("p", {}, [`${lista.length} atualização(ões) disponível(is). `, btn]),
          el("div", { class: "cartao" }, lista.map((x) => el("div", { class: "linha" }, [el("span", { class: "chip", texto: x.tipo }),
            el("div", { class: "texto", texto: x.nome }), el("small", { texto: x.versao })])))])
          : el("div", { class: "vazio" }, [el("b", { texto: "✅" }), "Tudo em dia!"]));
    }
  }

  let t;
  $("#busca").addEventListener("input", () => { clearTimeout(t); t = setTimeout(render, 250); });
  carregar();
})();
