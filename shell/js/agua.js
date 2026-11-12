/*
 * Vorticis SO — Papel de parede de água interativa.
 *
 * Simulação de ondas em grade de baixa resolução (CPU, barata) e três modos
 * de exibição:
 *   "alto"     — WebGL (GLES2): refração + brilho especular + cáusticas;
 *   "leve"     — Canvas 2D: sombreamento por pixel em resolução reduzida;
 *   "estatico" — sem animação (só o gradiente do tema), custo zero.
 *
 * Funciona em GPUs antigas: usa apenas WebGL 1 e texturas de 8 bits.
 */
(function (global) {
  "use strict";

  function hexParaRgb(hex) {
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  /* ---------------- Simulação de ondas (equação de onda discreta) ---------------- */
  class Ondas {
    constructor(largura, altura, amortecimento) {
      this.w = largura;
      this.h = altura;
      this.amort = amortecimento;
      this.atual = new Float32Array(largura * altura);
      this.anterior = new Float32Array(largura * altura);
    }

    perturbar(x, y, raio, forca) {
      const { w, h } = this;
      const cx = Math.floor(x * w), cy = Math.floor(y * h);
      const r = Math.max(1, Math.floor(raio));
      for (let j = -r; j <= r; j++) {
        for (let i = -r; i <= r; i++) {
          const px = cx + i, py = cy + j;
          if (px < 1 || py < 1 || px >= w - 1 || py >= h - 1) continue;
          const d = Math.sqrt(i * i + j * j) / r;
          if (d <= 1) this.atual[py * w + px] += forca * (Math.cos(d * Math.PI) * 0.5 + 0.5);
        }
      }
    }

    passo() {
      const { w, h, amort } = this;
      const a = this.atual, b = this.anterior;
      let energia = 0;
      for (let y = 1; y < h - 1; y++) {
        const linha = y * w;
        for (let x = 1; x < w - 1; x++) {
          const k = linha + x;
          const v = ((a[k - 1] + a[k + 1] + a[k - w] + a[k + w]) * 0.5 - b[k]) * amort;
          b[k] = v;
          energia += v < 0 ? -v : v;
        }
      }
      this.atual = b;
      this.anterior = a;
      return energia;
    }
  }

  /* ---------------- Renderizador WebGL ---------------- */
  const VS = `
    attribute vec2 p;
    varying vec2 uv;
    void main(){ uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

  const FS = `
    precision mediump float;
    varying vec2 uv;
    uniform sampler2D alturas;
    uniform vec2 texel;
    uniform vec3 corFundo, corMeio, corBrilho;
    uniform float tempo, causticas, aspecto;

    float h(vec2 c){ return texture2D(alturas, c).r * 2.0 - 1.0; }

    float causticasProc(vec2 p){
      float t = tempo * 0.35;
      float v = 0.0;
      v += sin(p.x * 9.0 + t + sin(p.y * 7.0 - t * 1.3));
      v += sin(p.y * 11.0 - t * 0.8 + sin(p.x * 5.0 + t));
      v += sin((p.x + p.y) * 8.0 + t * 1.1);
      return pow(abs(v / 3.0), 3.0);
    }

    void main(){
      vec2 c = vec2(uv.x, 1.0 - uv.y);
      float dx = h(c + vec2(texel.x, 0.0)) - h(c - vec2(texel.x, 0.0));
      float dy = h(c + vec2(0.0, texel.y)) - h(c - vec2(0.0, texel.y));
      vec3 normal = normalize(vec3(-dx * 3.0, -dy * 3.0, 1.0));

      vec2 refr = c + normal.xy * 0.035;
      float prof = clamp(refr.y, 0.0, 1.0);
      vec3 cor = mix(corMeio, corFundo, smoothstep(0.0, 1.0, prof));
      float brilhoTopo = smoothstep(0.55, 0.0, length((refr - vec2(0.3, 0.0)) * vec2(aspecto, 1.0)) * 0.8);
      cor += corBrilho * brilhoTopo * 0.18;

      cor += corBrilho * causticasProc(refr * vec2(aspecto, 1.0)) * causticas * (1.0 - prof * 0.7);

      vec3 luz = normalize(vec3(-0.4, -0.6, 0.7));
      float spec = pow(max(dot(reflect(-luz, normal), vec3(0.0, 0.0, 1.0)), 0.0), 40.0);
      cor += corBrilho * spec * 0.9;
      cor *= 1.0 - 0.25 * length(c - 0.5);

      gl_FragColor = vec4(cor, 1.0);
    }`;

  class RenderGL {
    constructor(canvas) {
      const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" })
        || canvas.getContext("experimental-webgl");
      if (!gl) throw new Error("WebGL indisponível");
      this.gl = gl;
      const prog = gl.createProgram();
      for (const [tipo, src] of [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, FS]]) {
        const s = gl.createShader(tipo);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
        gl.attachShader(prog, s);
      }
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      gl.useProgram(prog);
      this.prog = prog;

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, "p");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      this.tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      for (const p of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D, p, gl.LINEAR);
      for (const p of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D, p, gl.CLAMP_TO_EDGE);
      this.u = {};
      for (const n of ["texel", "corFundo", "corMeio", "corBrilho", "tempo", "causticas", "aspecto"]) {
        this.u[n] = gl.getUniformLocation(prog, n);
      }
      this.bytes = null;
    }

    desenhar(ondas, tema, tempo, w, h) {
      const gl = this.gl;
      const n = ondas.w * ondas.h;
      if (!this.bytes || this.bytes.length !== n) this.bytes = new Uint8Array(n);
      const a = ondas.atual, b = this.bytes;
      for (let i = 0; i < n; i++) {
        let v = 128 + a[i] * 0.9;
        b[i] = v < 0 ? 0 : v > 255 ? 255 : v;
      }
      gl.viewport(0, 0, w, h);
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, ondas.w, ondas.h, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, b);
      gl.uniform2f(this.u.texel, 1 / ondas.w, 1 / ondas.h);
      gl.uniform3fv(this.u.corFundo, tema.fundo);
      gl.uniform3fv(this.u.corMeio, tema.meio);
      gl.uniform3fv(this.u.corBrilho, tema.brilho);
      gl.uniform1f(this.u.tempo, tempo);
      gl.uniform1f(this.u.causticas, tema.causticas);
      gl.uniform1f(this.u.aspecto, w / h);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  }

  /* ---------------- Renderizador Canvas 2D (modo leve) ---------------- */
  class Render2D {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.img = null;
    }

    desenhar(ondas) {
      const { w, h } = ondas;
      if (this.canvas.width !== w || this.canvas.height !== h) {
        this.canvas.width = w;
        this.canvas.height = h;
        this.img = null;
      }
      if (!this.img) this.img = this.ctx.createImageData(w, h);
      const d = this.img.data, a = ondas.atual, base = this.base;
      for (let y = 0; y < h; y++) {
        const yc = y < 1 ? 1 : y > h - 2 ? h - 2 : y; // bordas copiam a vizinha
        for (let x = 0; x < w; x++) {
          const xc = x < 1 ? 1 : x > w - 2 ? w - 2 : x;
          const k = y * w + x, kc = yc * w + xc;
          const dx = a[kc + 1] - a[kc - 1];
          const dy = a[kc + w] - a[kc - w];
          const yy = Math.min(h - 1, Math.max(0, y + (dy * 0.08) | 0));
          const luz = (-dx - dy) * 0.9;
          const o = k * 4, bo = yy * 3;
          d[o] = base[bo] + luz;
          d[o + 1] = base[bo + 1] + luz;
          d[o + 2] = base[bo + 2] + luz;
          d[o + 3] = 255;
        }
      }
      this.ctx.putImageData(this.img, 0, 0);
    }

    prepararBase(tema, h) {
      // Gradiente vertical pré-calculado por linha (economiza CPU).
      this.base = new Float32Array(h * 3);
      for (let y = 0; y < h; y++) {
        const t = y / (h - 1);
        for (let c = 0; c < 3; c++) {
          this.base[y * 3 + c] = (tema.meio[c] * (1 - t) + tema.fundo[c] * t) * 255;
        }
      }
    }
  }

  /* ---------------- Detecção de capacidade ---------------- */
  let qualidadeDetectada = null;
  function detectarQualidade() {
    if (qualidadeDetectada) return qualidadeDetectada;
    qualidadeDetectada = detectarQualidadeAgora();
    return qualidadeDetectada;
  }

  function detectarQualidadeAgora() {
    try {
      if (global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches) return "estatico";
    } catch (_) { /* ignora */ }
    const nucleos = navigator.hardwareConcurrency || 2;
    const memoria = navigator.deviceMemory || 4;
    let temGL = false;
    try {
      const c = document.createElement("canvas");
      const gl = c.getContext("webgl");
      if (gl) {
        temGL = true;
        const info = gl.getExtension("WEBGL_debug_renderer_info");
        const gpu = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
        if (/llvmpipe|softpipe|swiftshader|software/i.test(gpu)) temGL = false; // renderização por software
        const perder = gl.getExtension("WEBGL_lose_context");
        if (perder) perder.loseContext(); // libera o contexto de teste
      }
    } catch (_) { temGL = false; }
    if (temGL && nucleos >= 2 && memoria >= 2) return "alto";
    if (nucleos >= 2) return "leve";
    return "estatico";
  }

  /* ---------------- Controlador público ---------------- */
  class AguaVorticis {
    constructor(container) {
      this.container = container;
      this.qualidade = "estatico";
      this.temaCores = null;
      this.temaBruto = null;
      this.rodando = false;
      this.ocioso = 0;
      this.t0 = performance.now();
      this._quadro = this._quadro.bind(this);
      this._mouse = this._mouse.bind(this);
      this._clique = this._clique.bind(this);
      this.ultimoPonto = null;

      container.addEventListener("pointermove", this._mouse, { passive: true });
      container.addEventListener("pointerdown", this._clique, { passive: true });
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) this.pausar(); else this.retomar();
      });
      global.addEventListener("resize", () => this._redimensionar());
    }

    definirTema(tema) {
      this.temaBruto = tema;
      const ag = tema.agua || {};
      this.temaCores = {
        fundo: hexParaRgb(ag.corFundo || "#03214a").map((v) => v / 255),
        meio: hexParaRgb(ag.corMeio || "#0b6fb8").map((v) => v / 255),
        brilho: hexParaRgb(ag.corBrilho || "#bfe9ff").map((v) => v / 255),
        causticas: ag.causticas ?? 0.35,
        amortecimento: ag.amortecimento ?? 0.985,
        gotasAmbiente: ag.gotasAmbiente ?? true,
      };
      this.container.style.background = tema.fundoEstatico || "linear-gradient(#0b6fb8,#03214a)";
      if (tema.animado === false) this.definirQualidade("estatico");
      else this._reconstruir();
    }

    definirQualidade(q) {
      if (q === "auto") q = detectarQualidade();
      if (this.temaBruto && this.temaBruto.animado === false) q = "estatico";
      this.qualidade = q;
      this._reconstruir();
      return q;
    }

    _reconstruir() {
      this.pausar();
      if (this.render instanceof RenderGL) {
        const perder = this.render.gl.getExtension("WEBGL_lose_context");
        if (perder) perder.loseContext();
      }
      this.container.querySelectorAll("canvas").forEach((c) => c.remove());
      this.render = null;
      this.canvas = null;
      if (!this.temaCores || this.qualidade === "estatico") return;

      const canvas = document.createElement("canvas");
      canvas.className = "agua-canvas";
      this.container.appendChild(canvas);
      this.canvas = canvas;

      if (this.qualidade === "alto") {
        try {
          this.render = new RenderGL(canvas);
        } catch (e) {
          console.warn("[agua] WebGL falhou, usando modo leve:", e.message);
          canvas.remove();
          this.qualidade = "leve";
          return this._reconstruir();
        }
      } else {
        this.render = new Render2D(canvas);
      }
      this._redimensionar();
      this.retomar();
    }

    _redimensionar() {
      if (!this.canvas) return;
      const r = this.container.getBoundingClientRect();
      const aspecto = r.width / Math.max(1, r.height);
      // Grade da simulação: 240 colunas no modo alto, 160 no leve.
      const colunas = this.qualidade === "alto" ? 240 : 160;
      const linhas = Math.max(40, Math.round(colunas / aspecto));
      this.ondas = new Ondas(colunas, linhas, this.temaCores.amortecimento);
      if (this.render instanceof RenderGL) {
        const escala = Math.min(global.devicePixelRatio || 1, 1.5);
        this.canvas.width = Math.round(r.width * escala);
        this.canvas.height = Math.round(r.height * escala);
      } else if (this.render) {
        this.render.prepararBase(this.temaCores, linhas);
      }
    }

    _ponto(ev) {
      const r = this.container.getBoundingClientRect();
      return [(ev.clientX - r.left) / r.width, (ev.clientY - r.top) / r.height];
    }

    _mouse(ev) {
      if (!this.ondas) return;
      const [x, y] = this._ponto(ev);
      // Interpola o rastro para ondas contínuas mesmo com o mouse rápido.
      const ant = this.ultimoPonto || [x, y];
      const passos = Math.min(8, Math.ceil(Math.hypot(x - ant[0], y - ant[1]) * 60));
      for (let i = 1; i <= passos; i++) {
        const t = i / passos;
        this.ondas.perturbar(ant[0] + (x - ant[0]) * t, ant[1] + (y - ant[1]) * t, 2.2, 22);
      }
      this.ultimoPonto = [x, y];
      this.ocioso = 0;
      this.retomar();
    }

    _clique(ev) {
      if (!this.ondas) return;
      const [x, y] = this._ponto(ev);
      this.ondas.perturbar(x, y, 5, 160);
      this.retomar();
    }

    pausar() {
      this.rodando = false;
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = null;
    }

    retomar() {
      if (this.rodando || !this.render || document.hidden) return;
      this.rodando = true;
      this.raf = requestAnimationFrame(this._quadro);
    }

    _quadro(agora) {
      if (!this.rodando) return;
      const tempo = (agora - this.t0) / 1000;
      if (this.temaCores.gotasAmbiente && Math.random() < 0.025) {
        this.ondas.perturbar(Math.random(), Math.random(), 1.5, 40 + Math.random() * 40);
      }
      const energia = this.ondas.passo();
      const { width, height } = this.canvas;
      this.render.desenhar(this.ondas, this.temaCores, tempo, width, height);

      // Economia: sem gotas ambientes e com a água parada, para de desenhar.
      if (!this.temaCores.gotasAmbiente && energia < 1) {
        if (++this.ocioso > 30) return this.pausar();
      }
      this.raf = requestAnimationFrame(this._quadro);
    }
  }

  global.AguaVorticis = AguaVorticis;
  global.AguaVorticis.detectarQualidade = detectarQualidade;
})(window);
