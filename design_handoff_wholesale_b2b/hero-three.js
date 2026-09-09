/* Smoke Show Labs — three.js hero layer.
   Registers <ss-hero-three effect="…" intensity="…"> — three interchangeable
   WebGL studies that sit under the 2D cursor-trail canvas.
   effect: "Volumetric plume" | "Ember drift" | "Glass mark" | "Off"        */
(() => {
  if (customElements.get("ss-hero-three")) return;
  const SRC = "https://unpkg.com/three@0.184.0/build/three.module.js";
  let threeP = null;
  const three = () => (threeP || (threeP = import(SRC)));

  const CY = [0.47, 0.84, 0.945];   // #78d6f1
  const EM = [0.969, 0.722, 0.161]; // #f7b829
  const BL = [0.925, 0.557, 0.745]; // #ec8ebe
  const AZ = [0.188, 0.525, 0.784]; // #3086c8

  const NOISE = `
  vec2 h2(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));return -1.+2.*fract(sin(p)*43758.5453);}
  float n2(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
    return mix(mix(dot(h2(i),f),dot(h2(i+vec2(1,0)),f-vec2(1,0)),u.x),
               mix(dot(h2(i+vec2(0,1)),f-vec2(0,1)),dot(h2(i+vec2(1,1)),f-vec2(1,1)),u.x),u.y);}
  float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*n2(p);p*=2.03;p+=vec2(1.7,9.2);a*=.5;}return s;}`;

  class Hero extends HTMLElement {
    static get observedAttributes() { return ["effect", "intensity"]; }

    connectedCallback() {
      if (this._root) return;
      this._root = this.attachShadow({ mode: "open" });
      this._root.innerHTML =
        "<style>:host{position:absolute;inset:0;display:block;pointer-events:none;" +
        "mix-blend-mode:screen;contain:strict}canvas{width:100%;height:100%;display:block}</style>";
      this._p = { x: 0.62, y: 0.42, tx: 0.62, ty: 0.42 };
      this._reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
      this._boot();
    }

    disconnectedCallback() { this._tear && this._tear(); this._tear = null; }

    attributeChangedCallback(n) {
      if (!this._T) return;
      if (n === "effect") this._build();
      if (n === "intensity") this._amp = this._readAmp();
    }

    _readAmp() { return parseFloat(this.getAttribute("intensity") || "1") || 1; }

    async _boot() {
      let T;
      try { T = await three(); } catch (e) { console.warn("three.js unavailable", e); return; }
      if (!this.isConnected) return;
      this._T = T;
      const cv = document.createElement("canvas");
      this._root.appendChild(cv);
      const r = new T.WebGLRenderer({ canvas: cv, alpha: true, antialias: false, powerPreference: "high-performance" });
      r.setClearColor(0x000000, 0);
      r.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
      this._r = r;
      this._amp = this._readAmp();
      this._last = performance.now();

      const host = this.parentElement || this;
      const fit = () => {
        const b = this.getBoundingClientRect();
        this._w = Math.max(1, b.width); this._h = Math.max(1, b.height);
        r.setSize(this._w, this._h, false);
        if (this._cam) {
          if (this._cam.isPerspectiveCamera) { this._cam.aspect = this._w / this._h; }
          this._cam.updateProjectionMatrix();
        }
        if (this._u && this._u.uRes && this._u.uT) this._u.uRes.value.set(this._w, this._h);
      };
      this._fit = fit;
      this._ro = new ResizeObserver(fit); this._ro.observe(this);
      fit();

      const move = e => {
        const b = host.getBoundingClientRect();
        this._p.tx = (e.clientX - b.left) / b.width;
        this._p.ty = 1 - (e.clientY - b.top) / b.height;
      };
      host.addEventListener("pointermove", move, { passive: true });

      let vis = true;
      const io = new IntersectionObserver(es => { vis = es[0].isIntersecting; }, { threshold: 0.01 });
      io.observe(this);

      this._build();

      let raf = 0;
      const tick = () => {
        raf = requestAnimationFrame(tick);
        if (!vis || !this._scene) return;
        const now = performance.now();
        const dt = Math.min(0.05, (now - this._last) / 1000); this._last = now;
        this._p.x += (this._p.tx - this._p.x) * Math.min(1, dt * 4);
        this._p.y += (this._p.ty - this._p.y) * Math.min(1, dt * 4);
        this._step(this._reduce ? 0 : dt);
        r.render(this._scene, this._cam);
      };
      raf = requestAnimationFrame(tick);

      this._tear = () => {
        cancelAnimationFrame(raf); io.disconnect(); this._ro.disconnect();
        host.removeEventListener("pointermove", move);
        this._dispose(); r.dispose();
      };
    }

    _dispose() {
      if (!this._scene) return;
      this._scene.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
      });
      if (this._env) { this._env.dispose(); this._env = null; }
      this._scene = null; this._u = null; this._step = () => {};
    }

    _build() {
      const T = this._T; if (!T) return;
      this._dispose();
      const mode = (this.getAttribute("effect") || "Volumetric plume").trim();
      if (mode === "Off") { this.style.display = "none"; return; }
      this.style.display = "block";
      const s = new T.Scene();
      this._scene = s;
      if (mode === "Ember drift") this._embers(T, s);
      else if (mode === "Glass mark") this._glass(T, s);
      else this._plume(T, s);
      this._fit && this._fit();
    }

    /* ── 1. Volumetric plume: warped fbm smoke, pointer displaces the flow ── */
    _plume(T, s) {
      this._cam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const u = {
        uT: { value: 0 }, uRes: { value: new T.Vector2(1, 1) },
        uP: { value: new T.Vector2(0.6, 0.4) }, uAmp: { value: 1 },
        uCy: { value: new T.Vector3(...CY) }, uEm: { value: new T.Vector3(...EM) },
        uBl: { value: new T.Vector3(...BL) }
      };
      this._u = u;
      const m = new T.ShaderMaterial({
        uniforms: u, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
        vertexShader: "void main(){gl_Position=vec4(position.xy,0.,1.);}",
        fragmentShader: `precision highp float;
        uniform float uT,uAmp;uniform vec2 uRes,uP;uniform vec3 uCy,uEm,uBl;${NOISE}
        void main(){
          vec2 uv=gl_FragCoord.xy/uRes;
          vec2 q=uv*vec2(uRes.x/uRes.y,1.);
          float t=uT*.05;
          vec2 w=vec2(fbm(q*1.6+vec2(0.,t*1.3)),fbm(q*1.6+vec2(5.2,1.3)-t));
          vec2 d=uv-uP;float g=exp(-dot(d,d)*7.);
          vec2 push=normalize(d+1e-4)*g*.35;
          float f=fbm(q*2.4+w*1.5+push+vec2(0.,-t*2.6));
          f=smoothstep(-.05,.72,f);
          float col=fbm(q*1.1+vec2(t*.6,-t));
          vec3 c=mix(uCy,uBl,smoothstep(.0,.7,col));
          c=mix(c,uEm,smoothstep(.45,1.,f)*.55);
          float veil=smoothstep(0.,.42,uv.y)*smoothstep(1.06,.5,uv.y);
          float side=smoothstep(-.1,.62,uv.x);
          float a=pow(f,1.7)*veil*side*(.34+g*.5)*uAmp;
          gl_FragColor=vec4(c*a,a);
        }`
      });
      s.add(new T.Mesh(new T.PlaneGeometry(2, 2), m));
      let t = 0;
      this._step = dt => { t += dt; u.uT.value = t; u.uAmp.value = this._amp; u.uP.value.set(this._p.x, this._p.y); };
    }

    /* ── 2. Ember drift: 2,400 additive sprites rising on a curl field ── */
    _embers(T, s) {
      const cam = new T.PerspectiveCamera(46, 1, 0.1, 60); cam.position.set(0, 0, 7);
      this._cam = cam;
      const N = 2400, pos = new Float32Array(N * 3), seed = new Float32Array(N), tint = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        pos[i * 3] = (Math.random() - 0.4) * 13;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 9;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 5;
        seed[i] = Math.random() * 100; tint[i] = Math.random();
      }
      const g = new T.BufferGeometry();
      g.setAttribute("position", new T.BufferAttribute(pos, 3));
      g.setAttribute("aSeed", new T.BufferAttribute(seed, 1));
      g.setAttribute("aTint", new T.BufferAttribute(tint, 1));
      const u = {
        uT: { value: 0 }, uAmp: { value: 1 }, uDpr: { value: this._r.getPixelRatio() },
        uP: { value: new T.Vector3(0, 0, 0) },
        uCy: { value: new T.Vector3(...CY) }, uEm: { value: new T.Vector3(...EM) },
        uAz: { value: new T.Vector3(...AZ) }
      };
      this._u = u;
      const m = new T.ShaderMaterial({
        uniforms: u, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
        vertexShader: `attribute float aSeed,aTint;uniform float uT,uDpr;uniform vec3 uP;
        varying float vA;varying vec3 vC;uniform vec3 uCy,uEm,uAz;
        void main(){
          vec3 p=position;
          float ph=aSeed+uT*.16;
          p.y=mod(p.y+uT*(.24+fract(aSeed)*.5)+4.5,9.)-4.5;
          p.x+=sin(ph*1.7)*.55+cos(ph*.6)*.3;
          p.z+=cos(ph*1.3)*.45;
          vec3 d=p-uP;float g=exp(-dot(d,d)*.28);
          p+=normalize(d+1e-4)*g*1.35;
          vec4 mv=modelViewMatrix*vec4(p,1.);
          gl_Position=projectionMatrix*mv;
          float sz=mix(5.,26.,pow(fract(aSeed*7.3),2.));
          gl_PointSize=sz*uDpr*(6.5/-mv.z)*(1.+g*.7);
          vC=aTint<.55?uCy:(aTint<.86?uAz:uEm);
          vA=(.1+.32*fract(aSeed*3.1))*smoothstep(4.6,1.6,abs(p.y))*(1.+g*1.5);
        }`,
        fragmentShader: `precision highp float;varying float vA;varying vec3 vC;uniform float uAmp;
        void main(){
          float d=length(gl_PointCoord-.5);
          float a=smoothstep(.5,.02,d)*vA*uAmp;
          gl_FragColor=vec4(vC*a,a);
        }`
      });
      const pts = new T.Points(g, m); s.add(pts);
      let t = 0;
      this._step = dt => {
        t += dt; u.uT.value = t; u.uAmp.value = this._amp;
        u.uDpr.value = this._r.getPixelRatio();
        u.uP.value.set((this._p.x - 0.5) * 11, (this._p.y - 0.5) * 7.4, 0);
        pts.rotation.y = (this._p.x - 0.5) * 0.22;
        pts.rotation.x = (this._p.y - 0.5) * -0.14;
      };
    }

    /* ── 3. Glass mark: iridescent envMap shell, held right of the copy ── */
    _glass(T, s) {
      const cam = new T.PerspectiveCamera(38, 1, 0.1, 60); cam.position.set(0, 0, 6.4);
      this._cam = cam;

      const c = document.createElement("canvas"); c.width = 512; c.height = 256;
      const g2 = c.getContext("2d");
      const grd = g2.createLinearGradient(0, 0, 512, 256);
      grd.addColorStop(0, "#0a050a"); grd.addColorStop(0.35, "#3a1030");
      grd.addColorStop(0.6, "#78d6f1"); grd.addColorStop(0.8, "#ec8ebe");
      grd.addColorStop(1, "#f7b829");
      g2.fillStyle = grd; g2.fillRect(0, 0, 512, 256);
      g2.fillStyle = "rgba(255,255,255,.85)";
      g2.beginPath(); g2.ellipse(370, 60, 80, 34, 0, 0, 6.3); g2.fill();
      const tex = new T.CanvasTexture(c);
      tex.mapping = T.EquirectangularReflectionMapping;
      tex.colorSpace = T.SRGBColorSpace;
      const pm = new T.PMREMGenerator(this._r);
      const env = pm.fromEquirectangular(tex).texture;
      pm.dispose(); tex.dispose();
      s.environment = env; this._env = env;

      // Screen-space left cut: the copy column lives in the left ~46% of the hero,
      // and the host blends with screen, so anything over it would wash the text out.
      const fade = { value: new T.Vector2(1, 1) };
      this._u = { uRes: fade };
      const cut = m => {
        m.transparent = true; m.depthWrite = false;
        m.onBeforeCompile = sh => {
          sh.uniforms.uRes = fade;
          sh.fragmentShader = "uniform vec2 uRes;\n" + sh.fragmentShader.replace(
            "#include <opaque_fragment>",
            "gl_FragColor = vec4(0.);\n#include <opaque_fragment>\n" +
            "gl_FragColor.a *= smoothstep(0.44, 0.68, gl_FragCoord.x / uRes.x);"
          );
        };
        return m;
      };

      const shell = cut(new T.MeshPhysicalMaterial({
        name: "vapour shell", color: 0x9fdff5, metalness: 0.28, roughness: 0.13,
        transmission: 0, iridescence: 1, iridescenceIOR: 1.4,
        iridescenceThicknessRange: [120, 620], clearcoat: 1, clearcoatRoughness: 0.08,
        envMapIntensity: 2.6, opacity: 0.92
      }));
      const rim = cut(new T.MeshStandardMaterial({
        name: "cyan rim", color: 0x78d6f1, roughness: 0.22, metalness: 0.95,
        envMapIntensity: 1.8, opacity: 0.9
      }));

      const grp = new T.Group(); grp.name = "glass mark";
      const knot = new T.Mesh(new T.TorusKnotGeometry(1.05, 0.32, 220, 32, 2, 3), shell);
      knot.name = "knot"; grp.add(knot);
      const ring = new T.Mesh(new T.TorusGeometry(1.8, 0.011, 8, 200), rim);
      ring.name = "ring"; ring.rotation.x = Math.PI * 0.44; grp.add(ring);
      const bead = new T.Mesh(new T.IcosahedronGeometry(0.34, 3), shell);
      bead.name = "bead"; bead.position.set(1.6, -1.15, 0.6); grp.add(bead);
      s.add(grp);
      s.add(new T.PointLight(0xf7b829, 22, 14).translateX(3).translateY(2.4).translateZ(3));
      s.add(new T.AmbientLight(0xffffff, 0.3));

      let t = 0;
      this._step = dt => {
        t += dt;
        fade.value.set(this._w || 1, this._h || 1);
        const halfW = Math.tan(cam.fov * Math.PI / 360) * cam.position.z * (this._cam.aspect || 1.6);
        grp.position.x = Math.min(halfW * 0.46, 3.4);
        grp.position.y = 0.1 + Math.sin(t * 0.4) * 0.08;
        grp.rotation.y = t * 0.22 + (this._p.x - 0.5) * 0.6;
        grp.rotation.x = Math.sin(t * 0.17) * 0.14 + (this._p.y - 0.5) * -0.42;
        ring.rotation.z = t * 0.4;
        bead.position.y = -1.15 + Math.sin(t * 0.7) * 0.16;
        grp.scale.setScalar(0.9 + 0.03 * Math.sin(t * 0.5) + (this._amp - 1) * 0.06);
      };
    }
  }
  customElements.define("ss-hero-three", Hero);
})();
