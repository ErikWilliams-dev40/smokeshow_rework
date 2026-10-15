import {
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
} from 'three'
import { createSmokeClock } from './smoke-clock'

const fragmentShader = `
  uniform float uTime;
  uniform vec2 uResolution;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1., 0.)), u.x),
               mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float sum = 0., amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      sum += amplitude * noise(p);
      p = mat2(0.8, -0.6, 0.6, 0.8) * p * 2.03 + 9.2;
      amplitude *= 0.5;
    }
    return sum;
  }
  void main() {
    vec2 p = (vUv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0) * 2.0;
    float t = uTime * 0.025;
    vec2 flow = vec2(fbm(p + vec2(t, -t * 0.6)), fbm(p + vec2(3.1, t * 0.8)));
    float density = fbm(p * 1.4 + flow * 2.4 + vec2(t * 0.3, -t));
    float veil = smoothstep(0.22, 0.8, density);
    float blend = smoothstep(0.12, 0.88, vUv.x + (flow.x - 0.5) * 0.7);
    vec3 cyan = vec3(0.424, 0.906, 0.925);
    vec3 magenta = vec3(0.925, 0.0, 0.549);
    vec3 color = mix(cyan, magenta, blend);
    float edge = 1.0 - smoothstep(0.25, 0.85, abs(vUv.y - 0.5));
    gl_FragColor = vec4(color, veil * edge * 0.3);
  }
`

/** A single full-screen shader plane; no textures, remote assets or postprocessing. */
export function createSmokeRenderer(canvas: HTMLCanvasElement, host: HTMLElement) {
  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: 'low-power',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
  renderer.setClearColor(0x000000, 0)
  const scene = new Scene()
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const uniforms = { uTime: { value: 0 }, uResolution: { value: new Vector2(1, 1) } }
  const geometry = new PlaneGeometry(2, 2)
  const material = new ShaderMaterial({
    uniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    vertexShader:
      'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader,
  })
  scene.add(new Mesh(geometry, material))
  const clock = createSmokeClock()
  let enabled = false
  let intersecting = true
  let lost = false
  let disposed = false
  let frame = 0
  let lastDraw = 0
  const draw = () => renderer.render(scene, camera)
  const tick = (now: number) => {
    // Render at 30fps; keep the noise gentle and the fragment workload bounded.
    uniforms.uTime.value = clock.advance(now)
    if (now - lastDraw >= 1000 / 30) {
      draw()
      lastDraw = now
    }
    frame = requestAnimationFrame(tick)
  }
  const sync = () => {
    cancelAnimationFrame(frame)
    clock.pause()
    const running = enabled && intersecting && !document.hidden && !lost && !disposed
    host.dataset.motion = running ? 'running' : 'paused'
    if (running) frame = requestAnimationFrame(tick)
  }
  const resize = () => {
    if (disposed || lost) return
    const { width, height } = host.getBoundingClientRect()
    renderer.setSize(Math.max(1, width), Math.max(1, height), false)
    uniforms.uResolution.value.set(Math.max(1, width), Math.max(1, height))
    draw()
  }
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(host)
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    intersecting = entry?.isIntersecting ?? false
    sync()
  })
  intersectionObserver.observe(host)
  const contextLost = (event: Event) => {
    event.preventDefault()
    lost = true
    host.dataset.renderer = 'fallback'
    sync()
  }
  const contextRestored = () => {
    lost = false
    resize()
    host.dataset.renderer = 'webgl'
    sync()
  }
  canvas.addEventListener('webglcontextlost', contextLost)
  canvas.addEventListener('webglcontextrestored', contextRestored)
  document.addEventListener('visibilitychange', sync)
  resize()
  host.dataset.renderer = 'webgl'
  return {
    setMotion(value: boolean) {
      enabled = value
      sync()
    },
    dispose() {
      disposed = true
      sync()
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      canvas.removeEventListener('webglcontextlost', contextLost)
      canvas.removeEventListener('webglcontextrestored', contextRestored)
      document.removeEventListener('visibilitychange', sync)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
    },
  }
}
