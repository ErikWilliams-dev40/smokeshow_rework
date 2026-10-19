'use client'

import { useEffect, useRef } from 'react'
import { useMotion } from '@/components/motion/MotionSettings'
import styles from './SmokeCanvas.module.css'

const vertexShader = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main(){vUv=uv;gl_Position=vec4(position,0.,1.);}
`

const fragmentShader = `
precision highp float;
uniform float t; uniform vec2 res; varying vec2 vUv;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<6;i++){v+=a*n(p);p=m*p;a*=.5;}return v;}
void main(){vec2 p=vUv*vec2(res.x/res.y,1.)*1.6;
vec2 rise=vec2(t*.012,-t*.06);
vec2 q=vec2(fbm(p+rise),fbm(p+vec2(5.2,1.3)+rise*.8));
vec2 w=vec2(fbm(p+3.*q+vec2(1.7,9.2)+rise*1.3),fbm(p+3.*q+vec2(8.3,2.8)+rise*1.1));
float r=fbm(p+2.2*w);
float body=smoothstep(.38,.9,r);
float wisp=pow(smoothstep(.5,.85,fbm(p*2.4+4.*w-vec2(0.,t*.09))),2.);
float m=(body*.75+wisp*.6)*(.35+.65*smoothstep(0.,.9,1.-vUv.y*.6));
vec3 col=mix(vec3(.447,.925,.949),vec3(.929,.012,.553),smoothstep(.25,.8,w.x));
col=mix(col,vec3(1.),wisp*.25);
float a=clamp(m*.62,0.,.75);gl_FragColor=vec4(col*a,a);}
`

export function SmokeCanvas() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const syncMotion = useRef<(() => void) | null>(null)
  const motion = useRef(true)
  const { enabled } = useMotion()

  useEffect(() => {
    motion.current = enabled
    syncMotion.current?.()
  }, [enabled])

  useEffect(() => {
    const target = canvas.current
    const host = target?.parentElement
    const hero = host?.parentElement
    if (!target || !host || !hero) return

    const gl = target.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
    })
    // The hidden canvas contributes neither pixels nor layout in the fallback.
    if (!gl) return

    const loss = gl.getExtension('WEBGL_lose_context')
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    let program: WebGLProgram | null = null
    let buffer: WebGLBuffer | null = null
    let time: WebGLUniformLocation | null = null
    let resolution: WebGLUniformLocation | null = null
    let frame = 0
    let previous: number | null = null
    let lastDraw = 0
    let elapsed = 0
    let intersecting = false
    let dirty = true
    let lastTime: number | null = null
    let disposed = false

    const stop = () => {
      cancelAnimationFrame(frame)
      frame = 0
      previous = null
      host.dataset.motion = 'paused'
    }
    const release = () => {
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      buffer = null
      program = null
    }
    const fallback = () => {
      stop()
      target.hidden = true
      delete target.dataset.ready
      host.dataset.renderer = 'fallback'
    }
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader)
        return null
      }
      return shader
    }
    const setup = () => {
      const vertex = compile(gl.VERTEX_SHADER, vertexShader)
      const fragment = compile(gl.FRAGMENT_SHADER, fragmentShader)
      program = gl.createProgram()
      if (vertex && fragment && program) {
        gl.attachShader(program, vertex)
        gl.attachShader(program, fragment)
        gl.linkProgram(program)
      }
      if (vertex) gl.deleteShader(vertex)
      if (fragment) gl.deleteShader(fragment)
      if (
        !vertex ||
        !fragment ||
        !program ||
        !gl.getProgramParameter(program, gl.LINK_STATUS)
      ) {
        release()
        return false
      }
      buffer = gl.createBuffer()
      if (!buffer) {
        release()
        return false
      }
      gl.useProgram(program)
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      // One clip-space quad, interleaved position.xy and uv.xy.
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1, 1, 1, 1, 1]),
        gl.STATIC_DRAW,
      )
      for (const [name, offset] of [
        ['position', 0],
        ['uv', 8],
      ] as const) {
        const attribute = gl.getAttribLocation(program, name)
        gl.enableVertexAttribArray(attribute)
        gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 16, offset)
      }
      time = gl.getUniformLocation(program, 't')
      resolution = gl.getUniformLocation(program, 'res')
      dirty = true
      return true
    }
    const draw = () => {
      const seconds = reduced.matches ? 8 : elapsed
      gl.viewport(0, 0, target.width, target.height)
      gl.uniform2f(resolution, target.width, target.height)
      gl.uniform1f(time, seconds)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      dirty = false
      lastTime = seconds
      target.hidden = false
      target.dataset.ready = 'true'
      host.dataset.renderer = 'webgl'
    }
    const tick = (now: number) => {
      if (previous !== null) elapsed += (now - previous) / 1000
      previous = now
      // The drift is deliberately slow; retain the previous renderer's 30fps
      // budget without changing shader time or queuing unnecessary GPU work.
      if (now - lastDraw >= 1000 / 30) {
        draw()
        lastDraw = now
      }
      frame = requestAnimationFrame(tick)
    }
    const sync = () => {
      stop()
      if (
        disposed ||
        !program ||
        gl.isContextLost() ||
        document.hidden ||
        !intersecting
      )
        return
      if (dirty || lastTime !== (reduced.matches ? 8 : elapsed)) draw()
      if (motion.current && !reduced.matches) {
        host.dataset.motion = 'running'
        frame = requestAnimationFrame(tick)
      }
    }
    const resize = () => {
      // Soft smoke needs no extra mobile pixels. Keep high-DPI phones at CSS
      // resolution, with the requested 1.5 ceiling on larger viewports.
      const ratio = Math.min(
        window.devicePixelRatio || 1,
        hero.clientWidth <= 560 ? 1 : 1.5,
      )
      const width = Math.max(1, Math.round(hero.clientWidth * ratio))
      const height = Math.max(1, Math.round(hero.clientHeight * ratio))
      if (target.width !== width || target.height !== height) {
        target.width = width
        target.height = height
        dirty = true
      }
      sync()
    }
    const onLost = (event: Event) => {
      event.preventDefault()
      fallback()
      // Lost resources are invalidated by the browser, including on restoration.
      buffer = null
      program = null
    }
    const onRestored = () => {
      release()
      if (setup()) resize()
      else fallback()
    }

    if (!setup()) {
      fallback()
      loss?.loseContext()
      return
    }
    const sizeObserver = new ResizeObserver(resize)
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      intersecting = entry?.isIntersecting ?? false
      sync()
    })
    sizeObserver.observe(hero)
    visibilityObserver.observe(hero)
    document.addEventListener('visibilitychange', sync)
    reduced.addEventListener('change', sync)
    window.addEventListener('resize', resize)
    target.addEventListener('webglcontextlost', onLost)
    target.addEventListener('webglcontextrestored', onRestored)
    syncMotion.current = sync
    resize()

    return () => {
      disposed = true
      stop()
      sizeObserver.disconnect()
      visibilityObserver.disconnect()
      document.removeEventListener('visibilitychange', sync)
      reduced.removeEventListener('change', sync)
      window.removeEventListener('resize', resize)
      target.removeEventListener('webglcontextlost', onLost)
      target.removeEventListener('webglcontextrestored', onRestored)
      syncMotion.current = null
      fallback()
      release()
      loss?.loseContext()
    }
  }, [])

  return <canvas ref={canvas} className={styles.canvas} aria-hidden="true" hidden />
}
