/*
 * Vorticis SO — efeitos de fundo animados além da água:
 *   "bolhas" — bolhas que sobem e fogem do mouse (Canvas 2D)
 *   "aurora" — faixas de luz ondulando lentamente, que seguem o mouse (Canvas 2D em baixa resolução)
 * e o gerenciador FundoVorticis, que escolhe o efeito do tema e respeita a qualidade
 * (alto / leve / estatico) para rodar bem até em computadores modestos.
 */
(function (global) {
  "use strict";

  const rgb = (hex) => {
    const n = parseInt(hex.replace("#", ""), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };

  class EfeitoCanvas {
    constructor(container) {
      this.container = container;
      this.mouse = { x: -1, y: -1 };
      this.rodando = false;
      this._quadro = this._quadro.bind(this);
      this._mover = (e) => {
        const r = container.getBoundingClientRect();
        this.mouse.x = (e.clientX - r.left) / r.width;
        this.mouse.y = (e.clientY - r.top) / r.height;
      };
      container.addEventListener("pointermove", this._mover, { passive: true });
    }
    montar(qualidade, tema) {
      this.qualidade = qualidade;
      this.tema = tema;
      this.canvas = document.createElement("canvas");
      this.canvas.className = "agua-canvas";
      this.container.appendChild(this.canvas);
      this.ctx = this.canvas.getContext("2d");
      this.redimensionar();
      this.iniciar();
      this.retomar();
    }
    redimensionar() {
      const r = this.container.getBoundingClientRect();
      const escala = this.qualidade === "alto" ? Math.min(global.devicePixelRatio || 1, 1.5) : 0.5;
      this.canvas.width = Math.max(1, Math.round(r.width * escala));
      this.canvas.height = Math.max(1, Math.round(r.height * escala));
    }
    retomar() {
      if (this.rodando || document.hidden) return;
      this.rodando = true;
      this.raf = requestAnimationFrame(this._quadro);
    }
    pausar() { this.rodando = false; if (this.raf) cancelAnimationFrame(this.raf); }
    destruir() {
      this.pausar();
      this.container.removeEventListener("pointermove", this._mover);
      if (this.canvas) this.canvas.remove();
    }
    _quadro(t) {
      if (!this.rodando) return;
      // Modo leve: ~30 quadros por segundo
      if (this.qualidade !== "alto" && this._ult && t - this._ult < 32) { this.raf = requestAnimationFrame(this._quadro); return; }
      this._ult = t;
      this.desenhar(t / 1000);
      this.raf = requestAnimationFrame(this._quadro);
    }
  }

  class Bolhas extends EfeitoCanvas {
    iniciar() {
      const n = this.qualidade === "alto" ? 90 : 40;
      this.bolhas = Array.from({ length: n }, () => this.nova(true));
    }
    nova(qualquerAltura) {
      return { x: Math.random(), y: qualquerAltura ? Math.random() : 1.05, r: 0.004 + Math.random() * 0.018,
               v: 0.0006 + Math.random() * 0.0016, fase: Math.random() * 6.28, vx: 0 };
    }
    desenhar(t) {
      const { ctx, canvas } = this, w = canvas.width, h = canvas.height;
      const a = this.tema.agua || {};
      const [r1, g1, b1] = rgb(a.corMeio || "#0d78c4"), [r2, g2, b2] = rgb(a.corFundo || "#021a3d");
      const fundo = ctx.createLinearGradient(0, 0, 0, h);
      fundo.addColorStop(0, `rgb(${r1},${g1},${b1})`);
      fundo.addColorStop(1, `rgb(${r2},${g2},${b2})`);
      ctx.fillStyle = fundo;
      ctx.fillRect(0, 0, w, h);
      const [rb, gb, bb] = rgb(a.corBrilho || "#c6ecff");
      for (const b of this.bolhas) {
        b.y -= b.v;
        b.x += Math.sin(t * 1.3 + b.fase) * 0.0004 + b.vx;
        b.vx *= 0.94;
        const dx = b.x - this.mouse.x, dy = (b.y - this.mouse.y) * (h / w);
        const d = Math.hypot(dx, dy);
        if (d < 0.08 && d > 0) { b.vx += (dx / d) * 0.002; b.y += (dy / d) * 0.002; }
        if (b.y < -0.05) Object.assign(b, this.nova(false));
        const R = b.r * w, x = b.x * w, y = b.y * h;
        const grad = ctx.createRadialGradient(x - R * 0.35, y - R * 0.35, R * 0.1, x, y, R);
        grad.addColorStop(0, `rgba(${rb},${gb},${bb},0.55)`);
        grad.addColorStop(0.7, `rgba(${rb},${gb},${bb},0.08)`);
        grad.addColorStop(1, `rgba(${rb},${gb},${bb},0.35)`);
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(x, y, R, 0, 6.2832); ctx.fill();
      }
    }
  }

  class Aurora extends EfeitoCanvas {
    iniciar() { this.mx = 0.5; }
    desenhar(t) {
      const { ctx, canvas } = this, w = canvas.width, h = canvas.height;
      const a = this.tema.aurora || {};
      const cores = (a.cores || ["#2af598", "#08aeea", "#b721ff"]).map(rgb);
      const [fr, fg, fb] = rgb(a.corFundo || "#020814");
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = `rgb(${fr},${fg},${fb})`;
      ctx.fillRect(0, 0, w, h);
      if (this.mouse.x >= 0) this.mx += (this.mouse.x - this.mx) * 0.02;
      ctx.globalCompositeOperation = "lighter";
      const passo = Math.max(4, Math.round(w / (this.qualidade === "alto" ? 160 : 70)));
      cores.forEach(([r, g, b], i) => {
        const base = h * (0.28 + i * 0.12);
        for (let x = 0; x < w; x += passo) {
          const u = x / w;
          const onda = Math.sin(u * 5 + t * 0.35 + i * 1.7) * 0.5 + Math.sin(u * 11 - t * 0.22 + i) * 0.25 + (u - this.mx) * 0.4 * Math.sin(t * 0.2 + i);
          const y = base + onda * h * 0.12;
          const alt = h * (0.18 + 0.1 * Math.sin(u * 7 + t * 0.5 + i));
          const brilho = 0.05 + 0.04 * Math.sin(u * 13 + t * 0.9 + i * 2);
          const grad = ctx.createLinearGradient(0, y - alt, 0, y + alt * 0.3);
          grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
          grad.addColorStop(0.75, `rgba(${r},${g},${b},${brilho.toFixed(3)})`);
          grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
          ctx.fillStyle = grad;
          ctx.fillRect(x - passo, y - alt, passo * 3, alt * 1.3); // faixas sobrepostas = transição suave
        }
      });
      ctx.globalCompositeOperation = "source-over";
    }
  }

  /* Gerenciador: um único ponto de entrada para o shell */
  class FundoVorticis {
    constructor(container) {
      this.container = container;
      this.agua = new global.AguaVorticis(container);
      this.efeito = null;
      this.tema = null;
      this.qualidade = "auto";
      this.imagem = null;
      global.addEventListener("resize", () => this.efeito && this.efeito.redimensionar && this.efeito.redimensionar());
      document.addEventListener("visibilitychange", () => this.efeito && (document.hidden ? this.efeito.pausar() : this.efeito.retomar()));
    }
    definirImagem(url) { this.imagem = url; this.aplicar(); }
    definirTema(tema) { this.tema = tema; this.aplicar(); }
    definirQualidade(q) { this.qualidade = q; return this.aplicar(); }
    aplicar() {
      const t = this.tema;
      if (!t) return "estatico";
      if (this.efeito) { this.efeito.destruir(); this.efeito = null; }
      let q = this.qualidade === "auto" ? global.AguaVorticis.detectarQualidade() : this.qualidade;
      const efeito = this.imagem ? "imagem" : t.efeito || (t.animado === false ? "estatico" : "agua");
      this.container.style.backgroundImage = "";
      this.container.style.background = this.imagem ? `center / cover no-repeat url("${this.imagem}")` : t.fundoEstatico;
      if (efeito === "agua") {
        this.agua.definirTema(t);
        return this.agua.definirQualidade(q);
      }
      this.agua.temaBruto = { animado: false };
      this.agua.definirQualidade("estatico");
      if (efeito === "estatico" || efeito === "imagem" || q === "estatico") return "estatico";
      if (q === "alto" && efeito === "aurora" && !this._temGL()) q = "leve";
      this.efeito = new (efeito === "bolhas" ? Bolhas : Aurora)(this.container);
      this.efeito.montar(q, t);
      return q;
    }
    _temGL() { return global.AguaVorticis.detectarQualidade() === "alto"; }
  }

  global.FundoVorticis = FundoVorticis;
})(window);
