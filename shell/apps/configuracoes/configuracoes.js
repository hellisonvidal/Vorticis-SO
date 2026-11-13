/* Configurações Vorticis — painel único para as ferramentas do sistema (vorticis-*). */
(function () {
  "use strict";
  const { el } = Vorticis;
  const $ = (s) => document.querySelector(s);

  // Cada ação: [rótulo, comando, argumentos, {terminal, primario, campos}]
  const SECOES = [
    { id: "sobre", icone: "💧", nome: "Sobre o sistema", desc: "Versão, hardware e tempo ligado.", inicial: ["vorticis-sistema", ["info"]], grupos: [] },
    { id: "atualizacoes", icone: "🔄", nome: "Atualizações", desc: "Novas versões do Vorticis, do sistema, dos apps e do firmware — tudo por dentro do sistema.",
      inicial: ["vorticis-atualizar", ["verificar"]], grupos: [
        { titulo: "Atualizar", acoes: [["⬇️ Atualizar tudo", "vorticis-atualizar", ["instalar"], { primario: true, terminal: true }],
          ["🌀 Só o Vorticis", "vorticis-atualizar", ["instalar", "--so-vorticis"], { terminal: true }],
          ["🛍️ Abrir na Central de Apps", "@abrir", ["central", "atualizacoes"]]] },
        { titulo: "Verificação automática", desc: "Procura novidades a cada 12 horas e avisa na área de trabalho. Atualizações de segurança do Debian já são automáticas.",
          acoes: [["Ligar", "vorticis-atualizar", ["automatico", "ligar"]], ["Desligar", "vorticis-atualizar", ["automatico", "desligar"]],
            ["Situação", "vorticis-atualizar", ["automatico", "status"]]] },
      ] },
    { id: "dispositivos", icone: "🧩", nome: "Dispositivos e drivers", desc: "Todo o hardware do computador, o driver de cada dispositivo e busca de drivers.",
      inicial: ["vorticis-dispositivos", ["listar"]], grupos: [
        { titulo: "Gerenciador", acoes: [["🧩 Abrir Dispositivos", "@abrir", ["dispositivos"], { primario: true }],
          ["🔍 Procurar drivers", "vorticis-drivers", ["sugerir"]]] },
      ] },
    { id: "diagnostico", icone: "🩺", nome: "Diagnóstico", desc: "Verifica serviços, pacotes, discos, memória, temperatura, drivers, rede, segurança e atualizações.",
      inicial: null, grupos: [
        { titulo: "Verificar", acoes: [["🩺 Abrir Diagnóstico", "@abrir", ["diagnostico"], { primario: true }],
          ["Verificar aqui", "vorticis-diagnostico", ["verificar"]], ["📄 Salvar relatório", "vorticis-diagnostico", ["relatorio"]]] },
      ] },
    { id: "tela", icone: "🖥️", nome: "Tela e resolução", desc: "Todas as resoluções e taxas que o monitor suporta, escala automática para telas de alta densidade e vários monitores.",
      inicial: ["vorticis-tela", ["listar"]], grupos: [
        { titulo: "Ajustes rápidos", acoes: [["✨ Melhor resolução automática", "vorticis-tela", ["auto", "--salvar"], { primario: true }],
          ["🪞 Espelhar monitores", "vorticis-tela", ["espelhar", "--salvar"]], ["↔️ Estender monitores", "vorticis-tela", ["estender", "--salvar"]]] },
        { titulo: "Definir manualmente", campos: [["saida", "Saída (ex.: HDMI-A-1)"], ["resolucao", "1920x1080"], ["taxa", "Hz (ex.: 144)"], ["escala", "Escala (ex.: 1.25)"]],
          acoes: [["Aplicar", "vorticis-tela", (v) => ["definir", v.saida, ...(v.resolucao ? ["--resolucao", v.resolucao] : []), ...(v.taxa ? ["--taxa", v.taxa] : []), ...(v.escala ? ["--escala", v.escala] : []), "--salvar"]],
            ["Criar modo personalizado", "vorticis-tela", (v) => ["personalizada", v.saida, v.resolucao, "--taxa", v.taxa || "60", "--salvar"]]] },
        { titulo: "Menu de boot", desc: "Resolução do menu de inicialização e do console.", campos: [["boot", "1920x1080"]],
          acoes: [["Aplicar ao boot", "vorticis-tela", (v) => ["boot", v.boot], { terminal: true }]] },
      ] },
    { id: "drivers", icone: "🔧", nome: "Drivers e firmware", desc: "Detecta o hardware e instala os drivers e firmwares mais atuais.",
      inicial: ["vorticis-drivers", ["sugerir"]], grupos: [
        { titulo: "Ações", acoes: [["⬇️ Instalar drivers recomendados", "vorticis-drivers", ["instalar", "--auto"], { primario: true, terminal: true }],
          ["🧬 Atualizar BIOS/firmware", "vorticis-drivers", ["firmware", "--auto"], { terminal: true }],
          ["🆕 Kernel mais recente (hardware novo)", "vorticis-drivers", ["kernel-recente"], { terminal: true }],
          ["📋 Listar hardware", "vorticis-drivers", ["listar"]]] },
      ] },
    { id: "rede", icone: "🛡️", nome: "Rede e segurança", desc: "Firewall, DNS criptografado, privacidade no Wi-Fi e isolamento de apps.",
      inicial: ["vorticis-rede", ["status"]], grupos: [
        { titulo: "Abrir/fechar porta", desc: "Só abra portas para serviços que você conhece (ex.: 22/tcp para SSH).", campos: [["porta", "22/tcp"]],
          acoes: [["Abrir porta", "vorticis-rede", (v) => ["abrir", v.porta], { terminal: true }], ["Fechar porta", "vorticis-rede", (v) => ["fechar", v.porta], { terminal: true }]] },
      ] },
    { id: "usuarios", icone: "👥", nome: "Usuários", desc: "Contas com níveis: Administrador, Padrão, Convidado e Infantil.",
      inicial: ["vorticis-usuarios", ["listar"]], grupos: [
        { titulo: "Nova conta", campos: [["login", "login (ex.: maria)"], ["nome", "Nome completo"], ["nivel", "padrao | admin | convidado | infantil"]],
          acoes: [["Criar conta", "vorticis-usuarios", (v) => ["criar", v.login, "--nivel", v.nivel || "padrao", "--nome", v.nome || v.login], { terminal: true, primario: true }]] },
        { titulo: "Mudar nível", campos: [["login2", "login"], ["nivel2", "novo nível"]],
          acoes: [["Aplicar", "vorticis-usuarios", (v) => ["nivel", v.login2, v.nivel2], { terminal: true }]] },
      ] },
    { id: "desempenho", icone: "⚡", nome: "Desempenho e armazenamento", desc: "Memória comprimida (zram), proteção contra travamentos, limpeza e energia.",
      inicial: ["vorticis-recursos", ["status"]], grupos: [
        { titulo: "Energia", acoes: [["🍃 Economia", "vorticis-recursos", ["energia", "economia"]], ["⚖️ Equilibrado", "vorticis-recursos", ["energia", "equilibrado"]], ["🚀 Desempenho", "vorticis-recursos", ["energia", "desempenho"]]] },
        { titulo: "Manutenção", acoes: [["🧹 Liberar espaço", "vorticis-recursos", ["limpar"], { terminal: true, primario: true }], ["🔁 Reotimizar para este hardware", "vorticis-recursos", ["aplicar"], { terminal: true }]] },
      ] },
    { id: "backup", icone: "🛟", nome: "Backup e restauração", desc: "Pontos de restauração do sistema (Btrfs) e cópia dos seus arquivos.",
      inicial: ["vorticis-backup", ["sistema", "listar"]], grupos: [
        { titulo: "Sistema", acoes: [["📍 Criar ponto de restauração", "vorticis-backup", ["sistema", "criar", "Ponto manual"], { primario: true, terminal: true }],
          ["⏱️ Pontos automáticos", "vorticis-backup", ["automatico", "ligar"], { terminal: true }]] },
        { titulo: "Restaurar", campos: [["numero", "número do ponto"]], acoes: [["Restaurar sistema", "vorticis-backup", (v) => ["sistema", "restaurar", v.numero], { terminal: true }]] },
        { titulo: "Arquivos pessoais", campos: [["destino", "/media/seu-hd"]], acoes: [["Copiar pasta pessoal", "vorticis-backup", (v) => ["pessoal", v.destino], { terminal: true }]] },
      ] },
    { id: "compat", icone: "🪟", nome: "Windows e Android", desc: "Camadas de compatibilidade e ajustes automáticos para programas do Windows.",
      inicial: ["vorticis-compat", ["status"]], grupos: [
        { titulo: "Preparar", acoes: [["🪟 Programas Windows (Wine)", "vorticis-compat", ["preparar", "windows"], { terminal: true, primario: true }],
          ["🤖 Apps Android (Waydroid)", "vorticis-compat", ["preparar", "android"], { terminal: true }],
          ["🖥️ Windows integrado (VM)", "vorticis-compat", ["preparar", "vm"], { terminal: true }],
          ["🔤 Fontes Microsoft", "vorticis-compat", ["preparar", "fontes"], { terminal: true }]] },
        { titulo: "Office", acoes: [["ONLYOFFICE", "vorticis-compat", ["office", "onlyoffice"], { terminal: true }], ["LibreOffice", "vorticis-compat", ["office", "libreoffice"], { terminal: true }],
          ["Microsoft 365 (web)", "vorticis-compat", ["office", "web"]], ["Office 2013/2016 pelo Wine", "vorticis-compat", ["office", "wine"]], ["Office completo (VM)", "vorticis-compat", ["office", "vm"]]] },
        { titulo: "Receitas automáticas", acoes: [["Ver receitas", "vorticis-compat", ["receitas"]]] },
      ] },
    { id: "jogos", icone: "🎮", nome: "Jogos e anti-cheat", desc: "Verifique se o anti-cheat de um jogo funciona no Vorticis e prepare Steam/Proton.",
      inicial: null, grupos: [
        { titulo: "Verificar jogo", campos: [["jogo", "Nome do jogo (ex.: Elden Ring)"]], acoes: [["Verificar", "vorticis-jogos", (v) => ["verificar", v.jogo], { primario: true }],
          ["Alternativas", "vorticis-jogos", (v) => ["alternativas", v.jogo || "jogo"]]] },
        { titulo: "Preparar", acoes: [["Steam + Proton + anti-cheat", "vorticis-jogos", ["preparar"], { terminal: true }], ["Otimizar para jogos", "vorticis-jogos", ["otimizar"], { terminal: true }]] },
      ] },
    { id: "ajuda", icone: "❓", nome: "Ajuda", desc: "Manual do usuário, referência de comandos e solução de problemas.", inicial: null, grupos: [
        { titulo: "Documentação", acoes: [["📘 Abrir a Ajuda", "@abrir", ["ajuda"], { primario: true }],
          ["⌨️ Referência de comandos", "@abrir", ["ajuda", "REFERENCIA.md"]]] },
      ] },
    { id: "navegadores", icone: "🌐", nome: "Navegadores", desc: "Instale e escolha o navegador padrão.", inicial: ["vorticis-navegadores", ["listar"]], grupos: [
        { titulo: "Navegador padrão", campos: [["nav", "firefox | chromium | chrome | brave | edge | opera | vivaldi"]],
          acoes: [["Instalar", "vorticis-navegadores", (v) => ["instalar", v.nav], { terminal: true }], ["Tornar padrão", "vorticis-navegadores", (v) => ["padrao", v.nav]],
            ["Otimizar (GPU/Wayland)", "vorticis-navegadores", ["otimizar"]]] },
      ] },
  ];

  let atual = SECOES[0];

  async function executar(cmd, args, opcoes = {}, saidaEl) {
    saidaEl.textContent = `$ ${cmd} ${args.join(" ")}\n…`;
    const r = await Vorticis.executar(opcoes.terminal ? "@terminal" : cmd, opcoes.terminal ? [cmd, ...args] : args, {
      codigo: 0, saida: `Demonstração: no Vorticis SO este botão executa\n\n  ${cmd} ${args.join(" ")}${opcoes.terminal ? "\n\n(em uma janela de terminal, pedindo a senha de administrador quando necessário)" : ""}` });
    saidaEl.textContent = `$ ${cmd} ${args.join(" ")}\n${r.saida || (opcoes.terminal ? "Aberto no terminal." : "(sem saída)")}`;
  }

  function render() {
    const saida = el("pre", { class: "saida", texto: "" });
    const blocos = atual.grupos.map((g) => {
      const valores = {};
      const campos = (g.campos || []).map(([k, ph]) => el("input", { class: "campo", placeholder: ph, oninput: (e) => (valores[k] = e.target.value.trim()) }));
      const acoes = g.acoes.map(([rot, cmd, args, op = {}]) => el("button", {
        class: "botao" + (op.primario ? " primario" : ""), texto: rot,
        onclick: () => executar(cmd, typeof args === "function" ? args(valores).filter((x) => x !== undefined && x !== "") : args, op, saida) }));
      return el("div", { class: "grupo" }, [el("h3", { texto: g.titulo }), g.desc ? el("p", { texto: g.desc }) : null,
        campos.length ? el("div", { class: "form" }, campos) : null, el("div", { class: "acoes" }, acoes)]);
    });
    $("#conteudo").replaceChildren(el("h2", { texto: `${atual.icone} ${atual.nome}` }), el("p", { class: "sub", texto: atual.desc }), saida, ...blocos);
    if (atual.inicial) executar(atual.inicial[0], atual.inicial[1], {}, saida);
    else saida.textContent = "Escolha uma ação abaixo.";
    $("#lateral").replaceChildren(...SECOES.map((s) => el("button", { "aria-current": String(s === atual), onclick: () => { atual = s; render(); } }, `${s.icone} ${s.nome}`)));
  }

  const inicial = new URLSearchParams(location.search).get("secao");
  atual = SECOES.find((s) => s.id === inicial) || SECOES[0];
  render();
})();
