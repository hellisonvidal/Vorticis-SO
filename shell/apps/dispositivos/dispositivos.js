/* Dispositivos — gerenciador de dispositivos do Vorticis (interface do vorticis-dispositivos). */
(function () {
  "use strict";
  const { el } = Vorticis;
  const $ = (s) => document.querySelector(s);
  const ESTADOS = { ok: "Funcionando", "sem-driver": "Sem driver", desativado: "Desativado", desconectado: "Desconectado", aviso: "Atenção" };
  const ACOES = {
    "procurar-driver": "🔍 Procurar driver", desativar: "⏻ Desativar", ativar: "⏻ Ativar",
    "reiniciar-driver": "⟳ Reiniciar driver", ejetar: "⏏ Remover com segurança",
  };
  const estado = { dados: null, sel: null, fechadas: new Set(Vorticis.prefs.ler("dispositivos.fechadas", [])) };

  // Dados de demonstração (fora do Vorticis SO)
  const DEMO = {
    categorias: [
      { id: "processador", nome: "Processador", icone: "🧠" }, { id: "memoria", nome: "Memória", icone: "🧮" },
      { id: "video", nome: "Vídeo", icone: "🖥️" }, { id: "monitor", nome: "Monitores", icone: "🖵" }, { id: "som", nome: "Som", icone: "🔊" },
      { id: "rede", nome: "Rede", icone: "🌐" }, { id: "bluetooth", nome: "Bluetooth", icone: "🔷" },
      { id: "armazenamento", nome: "Armazenamento", icone: "💽" }, { id: "usb", nome: "USB", icone: "🔌" },
      { id: "entrada", nome: "Teclado, mouse e toque", icone: "⌨️" }, { id: "camera", nome: "Câmeras", icone: "📷" },
      { id: "energia", nome: "Bateria e energia", icone: "🔋" },
    ],
    dispositivos: [
      { id: "cpu:0", categoria: "processador", nome: "AMD Ryzen 7 5800H with Radeon Graphics", fabricante: "AMD", driver: "amd-pstate-epp", estado: "ok", detalhes: { "Núcleos/threads": "16", "Frequência máxima": "4.46 GHz", "Virtualização": "sim" }, acoes: ["procurar-driver"] },
      { id: "memoria:0", categoria: "memoria", nome: "Memória RAM 15.6 GB", estado: "ok", detalhes: { Total: "15.6 GB", "Swap comprimida (zram)": "ativa" }, acoes: [] },
      { id: "pci:0000:01:00.0", categoria: "video", nome: "GA107M [GeForce RTX 3050 Mobile]", fabricante: "NVIDIA Corporation", driver: "nouveau", estado: "ok", detalhes: { Endereço: "0000:01:00.0", "Fabricante (ID)": "0x10de", "Modelo (ID)": "0x25a2" }, acoes: ["procurar-driver", "reiniciar-driver"] },
      { id: "pci:0000:05:00.0", categoria: "video", nome: "Cezanne [Radeon Vega Series]", fabricante: "AMD", driver: "amdgpu", estado: "ok", detalhes: { Endereço: "0000:05:00.0" }, acoes: ["procurar-driver", "reiniciar-driver"] },
      { id: "monitor:card1-eDP-1", categoria: "monitor", nome: "Tela do notebook", estado: "ok", detalhes: { Conector: "eDP-1", "Resolução máxima": "1920x1080", "Modos disponíveis": "4" }, acoes: [] },
      { id: "som:card1", categoria: "som", nome: "Family 17h HD Audio", driver: "snd_hda_intel", estado: "ok", detalhes: {}, acoes: ["reiniciar-driver"] },
      { id: "pci:0000:03:00.0", categoria: "rede", nome: "RTL8852BE PCIe 802.11ax Wireless", fabricante: "Realtek", driver: null, estado: "sem-driver", detalhes: { Endereço: "0000:03:00.0", "Fabricante (ID)": "0x10ec", "Modelo (ID)": "0xb852" }, acoes: ["procurar-driver"] },
      { id: "rede:enp2s0", categoria: "rede", nome: "Rede cabeada enp2s0", driver: "r8169", estado: "ok", detalhes: { "Endereço MAC": "aa:bb:cc:12:34:56", Velocidade: "1000 Mb/s" }, acoes: ["desativar", "reiniciar-driver"] },
      { id: "bluetooth:hci0", categoria: "bluetooth", nome: "Adaptador Bluetooth hci0", driver: "btusb", estado: "desativado", detalhes: {}, acoes: ["ativar"] },
      { id: "disco:nvme0n1", categoria: "armazenamento", nome: "KINGSTON SNV2S500G", driver: "nvme", estado: "ok", detalhes: { Tipo: "NVMe SSD", Capacidade: "500.1 GB" }, acoes: [] },
      { id: "disco:sda", categoria: "armazenamento", nome: "SanDisk Ultra", driver: "usb-storage", estado: "ok", detalhes: { Tipo: "Removível (pen-drive/cartão)", Capacidade: "32.0 GB" }, acoes: ["ejetar"] },
      { id: "usb:1-3", categoria: "usb", nome: "Controle Xbox Wireless", fabricante: "Microsoft", driver: "xpad", estado: "ok", detalhes: { Velocidade: "12 Mb/s" }, acoes: ["procurar-driver", "desativar"] },
      { id: "entrada:event5", categoria: "entrada", nome: "ELAN Touchpad", estado: "ok", detalhes: { Tipo: "Touchpad" }, acoes: [] },
      { id: "camera:video0", categoria: "camera", nome: "HD Webcam", driver: "uvcvideo", estado: "ok", detalhes: {}, acoes: [] },
      { id: "bateria:BAT0", categoria: "energia", nome: "Bateria L20M3PF0", estado: "aviso", detalhes: { Carga: "83%", "Saúde": "58%", Ciclos: "612" }, acoes: [] },
    ],
  };
  const DEMO_DRIVERS = {
    "pci:0000:01:00.0": [{ pacote: "nvidia-open-kernel-dkms", motivo: "módulo de kernel aberto NVIDIA (GPUs Turing ou mais novas)", instalado: false },
      { pacote: "nvidia-driver", motivo: "driver proprietário NVIDIA (melhor desempenho em jogos)", instalado: false }],
    "pci:0000:03:00.0": [{ pacote: "@kernel-recente", motivo: "Realtek 10ec:b852 sem driver no kernel atual — kernel mais novo (backports) costuma resolver", instalado: false },
      { pacote: "firmware-realtek", motivo: "firmware de rede Realtek", instalado: true }],
    "cpu:0": [{ pacote: "amd64-microcode", motivo: "correções de segurança e estabilidade da CPU", instalado: true }],
  };

  async function carregar() {
    $("#lista").replaceChildren(el("p", { class: "suave", style: "padding:12px", texto: "Detectando dispositivos…" }));
    estado.dados = (await Vorticis.executarJSON("vorticis-dispositivos", ["listar", "--json"], DEMO)) || DEMO;
    renderLista();
    const q = new URLSearchParams(location.search).get("dispositivo");
    const primeiro = estado.dados.dispositivos.find((d) => d.id === q) || estado.dados.dispositivos.find((d) => d.estado !== "ok") || estado.dados.dispositivos[0];
    if (primeiro) selecionar(primeiro);
  }

  function renderLista() {
    const f = $("#busca").value.trim().toLowerCase();
    const { categorias, dispositivos } = estado.dados;
    $("#lista").replaceChildren(...categorias.map((c) => {
      const itens = dispositivos.filter((d) => d.categoria === c.id && (!f || (d.nome + d.fabricante + d.id + (d.driver || "")).toLowerCase().includes(f)));
      if (!itens.length) return null;
      const problemas = itens.filter((d) => d.estado === "sem-driver" || d.estado === "aviso").length;
      const bloco = el("div", { class: "categoria" + (estado.fechadas.has(c.id) && !f ? " fechada" : "") }, [
        el("button", { onclick: () => {
          estado.fechadas.has(c.id) ? estado.fechadas.delete(c.id) : estado.fechadas.add(c.id);
          Vorticis.prefs.gravar("dispositivos.fechadas", [...estado.fechadas]); renderLista(); } },
          [el("span", { class: "seta", texto: "▾" }), `${c.icone} ${c.nome}`,
           el("span", { class: "chip qtd" + (problemas ? "" : " ok"), texto: problemas ? `⚠ ${problemas}` : String(itens.length) })]),
        el("div", { class: "itens" }, itens.map((d) => el("button", {
          class: "item", "aria-current": String(estado.sel && estado.sel.id === d.id), onclick: () => selecionar(d) },
          [el("span", { class: "estado " + d.estado, title: ESTADOS[d.estado] || d.estado }), el("span", { class: "nome", texto: d.nome })]))),
      ]);
      return bloco;
    }).filter(Boolean));
  }

  function selecionar(d) {
    estado.sel = d;
    renderLista();
    const linhas = [["Estado", ESTADOS[d.estado] || d.estado], ["Fabricante", d.fabricante], ["Driver em uso", d.driver || (["processador", "memoria"].includes(d.categoria) ? null : "nenhum")],
      ["Identificação", d.id], ...Object.entries(d.detalhes || {})].filter(([, v]) => v);
    const saida = el("div", { id: "saida-drivers" });
    $("#detalhe").replaceChildren(
      el("h2", { texto: d.nome }),
      el("p", { class: "sub", texto: (estado.dados.categorias.find((c) => c.id === d.categoria) || {}).nome || "" }),
      d.estado === "sem-driver" ? el("div", { class: "cartao", style: "border-color:#f5b301" },
        "⚠ Nenhum driver está controlando este dispositivo. Use “Procurar driver” para ver o que pode ser instalado.") : null,
      el("div", { class: "acoes" }, (d.acoes || []).map((a) => el("button", {
        class: "botao" + (a === "procurar-driver" ? " primario" : ""), texto: ACOES[a] || a, onclick: () => acao(d, a, saida) }))),
      el("table", {}, linhas.map(([k, v]) => el("tr", {}, [el("td", { texto: k }), el("td", { texto: v })]))),
      saida);
  }

  async function acao(d, a, saida) {
    if (a === "procurar-driver") return procurarDriver(d, saida);
    // As ações que exigem administrador pedem a senha pela janela do polkit (pkexec).
    const r = await Vorticis.executar("vorticis-dispositivos", [a, d.id], { codigo: 0, saida: "" });
    Vorticis.toast(r.codigo === 0 ? `${ACOES[a].slice(2)}: feito.` : (r.saida || "Não foi possível."));
    if (!Vorticis.noSistema && (a === "ativar" || a === "desativar")) {
      d.estado = a === "ativar" ? "ok" : "desativado";
      d.acoes = d.acoes.map((x) => (x === a ? (a === "ativar" ? "desativar" : "ativar") : x));
    }
    setTimeout(async () => { if (Vorticis.noSistema) await carregar(); else selecionar(d); }, 600);
  }

  async function procurarDriver(d, saida) {
    saida.replaceChildren(el("h3", { texto: "Drivers para este dispositivo" }), el("p", { class: "suave", texto: "Procurando…" }));
    const lista = (await Vorticis.executarJSON("vorticis-dispositivos", ["drivers", d.id, "--json"], DEMO_DRIVERS[d.id] || [])) || [];
    const itens = lista.map((s) => {
      const nome = s.pacote === "@kernel-recente" ? "Kernel mais recente (backports)" : s.pacote;
      const botao = s.instalado ? el("span", { class: "chip ok", texto: "✔ Instalado" })
        : el("button", { class: "botao primario", texto: "Instalar", onclick: async () => {
          botao.disabled = true;
          const args = s.pacote === "@kernel-recente" ? ["vorticis-drivers", "kernel-recente"] : ["vorticis-drivers", "instalar", s.pacote, "--auto"];
          const r = await Vorticis.executar("@terminal", args, { codigo: 0, saida: "" });
          Vorticis.toast(r.codigo === 0 ? `Instalando ${nome} no terminal… reinicie ao terminar.` : "Não foi possível iniciar a instalação.");
        } });
      return el("div", { class: "sugestao" }, [el("div", { class: "texto" }, [el("b", { texto: nome }), el("br"), el("small", { class: "suave", texto: s.motivo })]), botao]);
    });
    saida.replaceChildren(el("h3", { texto: "Drivers para este dispositivo" }),
      itens.length ? el("div", {}, itens) : el("p", { class: "suave", texto: "Nenhum driver adicional é necessário: este dispositivo usa o driver incluído no kernel." }),
      el("p", { class: "suave", style: "margin-top:14px" }, ["Atualizações de firmware (BIOS, SSD, periféricos) ficam em ", el("a", { href: "#", texto: "Procurar drivers → Firmware", onclick: (e) => { e.preventDefault(); procurarTodos(); } }), "."]));
  }

  async function procurarTodos() {
    estado.sel = null;
    renderLista();
    $("#detalhe").replaceChildren(el("h2", { texto: "🔍 Procurar drivers" }), el("p", { class: "sub", texto: "Analisando o hardware e os drivers disponíveis…" }));
    const lista = (await Vorticis.executarJSON("vorticis-drivers", ["sugerir", "--json"],
      Object.entries(DEMO_DRIVERS).flatMap(([id, l]) => l.map((s) => ({ ...s, dispositivos: [id] }))))) || [];
    const faltando = lista.filter((s) => !s.instalado);
    const nomeDe = (id) => (estado.dados.dispositivos.find((d) => d.id === id) || {}).nome || id;
    $("#detalhe").replaceChildren(
      el("h2", { texto: "🔍 Drivers e firmware" }),
      el("p", { class: "sub", texto: faltando.length ? `${faltando.length} item(ns) recomendado(s) para este computador.` : "Tudo certo: nenhum driver adicional é necessário." }),
      el("div", { class: "acoes" }, [
        faltando.length ? el("button", { class: "botao primario", texto: "Instalar todos os recomendados",
          onclick: () => Vorticis.executar("@terminal", ["vorticis-drivers", "instalar", "--auto"], { codigo: 0 }).then(() => Vorticis.toast("Instalando no terminal…")) }) : null,
        el("button", { class: "botao", texto: "🧬 Atualizar BIOS e firmware (LVFS)",
          onclick: () => Vorticis.executar("@terminal", ["vorticis-drivers", "firmware", "--auto"], { codigo: 0 }).then(() => Vorticis.toast("Verificando firmware no terminal…")) }),
        el("button", { class: "botao", texto: "🆕 Kernel mais recente",
          onclick: () => Vorticis.executar("@terminal", ["vorticis-drivers", "kernel-recente"], { codigo: 0 }) }),
      ]),
      el("div", { class: "cartao" }, lista.length ? lista.map((s) => el("div", { class: "sugestao" }, [
        el("div", { class: "texto" }, [el("b", { texto: s.pacote === "@kernel-recente" ? "Kernel mais recente (backports)" : s.pacote }), el("br"),
          el("small", { class: "suave", texto: s.motivo + ((s.dispositivos || []).length ? " · " + s.dispositivos.map(nomeDe).join(", ") : "") })]),
        s.instalado ? el("span", { class: "chip ok", texto: "✔ Instalado" }) : el("span", { class: "chip", texto: "Recomendado" })])) : [el("p", { texto: "Nenhuma recomendação." })]));
  }

  $("#busca").addEventListener("input", renderLista);
  $("#atualizar").addEventListener("click", carregar);
  $("#procurar-todos").addEventListener("click", procurarTodos);
  carregar();
})();
