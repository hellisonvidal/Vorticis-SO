/*
 * Biblioteca comum dos apps Vorticis.
 *
 * - Aplica as cores do tema ativo (lidas do localStorage compartilhado com o shell).
 * - Vorticis.executar(cmd, args) → Promise com {codigo, saida}: dentro do SO passa pela
 *   ponte do vorticis-app (só comandos permitidos); fora dele, retorna dados simulados.
 */
(function (global) {
  "use strict";

  const SCRIPT_SRC = (document.currentScript && document.currentScript.src) || location.href;
  const pendentes = new Map();
  let seq = 0;

  function temPonte() {
    try { return !!(global.webkit && global.webkit.messageHandlers && global.webkit.messageHandlers.vorticis); }
    catch (_) { return false; }
  }

  // Chamado pelo vorticis-app (Python) com a resposta de um comando.
  global.__vorticisResposta = function (id, resposta) {
    const p = pendentes.get(id);
    if (p) { pendentes.delete(id); p(resposta); }
  };

  const Vorticis = {
    noSistema: temPonte(),

    executar(cmd, args = [], simulado = null) {
      if (!temPonte()) {
        const r = typeof simulado === "function" ? simulado() : simulado;
        return new Promise((ok) => setTimeout(() => ok(r || { codigo: 0, saida: "" }), 350));
      }
      const id = ++seq;
      return new Promise((ok) => {
        pendentes.set(id, ok);
        global.webkit.messageHandlers.vorticis.postMessage(JSON.stringify({ acao: "executar", id, cmd, args }));
      });
    },

    async executarJSON(cmd, args, simulado) {
      const r = await Vorticis.executar(cmd, args, simulado ? { codigo: 0, saida: JSON.stringify(typeof simulado === "function" ? simulado() : simulado) } : null);
      try { return JSON.parse(r.saida); } catch (_) { return null; }
    },

    prefs: {
      ler(chave, padrao) {
        try { const v = localStorage.getItem("vorticis." + chave); return v === null ? padrao : JSON.parse(v); }
        catch (_) { return padrao; }
      },
      gravar(chave, valor) {
        try { localStorage.setItem("vorticis." + chave, JSON.stringify(valor)); } catch (_) { /* ignora */ }
      },
    },

    toast(msg, ms = 2600) {
      let t = document.querySelector(".toast");
      if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.append(t); }
      t.textContent = msg;
      t.hidden = false;
      clearTimeout(Vorticis.toast.t);
      Vorticis.toast.t = setTimeout(() => (t.hidden = true), ms);
    },

    el(tag, attrs = {}, filhos = []) {
      const e = document.createElement(tag);
      for (const [k, v] of Object.entries(attrs)) {
        if (v === undefined || v === null || v === false) continue;
        if (k === "texto") e.textContent = v;
        else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
        else if (k === "style") e.style.cssText = v;
        else e.setAttribute(k, v === true ? "" : v);
      }
      for (const f of [].concat(filhos)) if (f !== null && f !== undefined && f !== false) e.append(f);
      return e;
    },

    tempo(seg) {
      if (!isFinite(seg)) return "0:00";
      seg = Math.floor(seg);
      const h = Math.floor(seg / 3600), m = Math.floor((seg % 3600) / 60), s = seg % 60;
      return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(s).padStart(2, "0");
    },

    bytes(b) {
      const u = ["B", "KB", "MB", "GB", "TB"];
      let i = 0;
      while (b >= 1024 && i < u.length - 1) { b /= 1024; i++; }
      return (i ? b.toFixed(1) : b) + " " + u[i];
    },

    async aplicarTema() {
      const id = Vorticis.prefs.ler("tema", "mare");
      const base = new URL("../../themes/", SCRIPT_SRC);
      try {
        const r = await fetch(new URL(id + ".json", base));
        const t = await r.json();
        const c = { ...t.cores, ...(Vorticis.prefs.ler("corDestaque", null) ? { destaque: Vorticis.prefs.ler("corDestaque") } : {}) };
        const raiz = document.documentElement.style;
        raiz.setProperty("--destaque", c.destaque);
        raiz.setProperty("--destaque-forte", c.destaqueForte);
        raiz.setProperty("--texto", c.texto);
        raiz.setProperty("--texto-suave", c.textoSuave);
        if (t.fundoApp) raiz.setProperty("--fundo-app", t.fundoApp);
        if (t.claro) {
          raiz.setProperty("--superficie", "rgba(10, 40, 80, 0.05)");
          raiz.setProperty("--superficie-2", "rgba(10, 40, 80, 0.09)");
          raiz.setProperty("--borda", "rgba(10, 60, 110, 0.16)");
        }
      } catch (_) { /* mantém o padrão Maré */ }
    },
  };

  global.Vorticis = Vorticis;
  Vorticis.aplicarTema();
  global.addEventListener("storage", (e) => { if (e.key && e.key.startsWith("vorticis.")) Vorticis.aplicarTema(); });
})(window);
