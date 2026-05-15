'use client'

import { useRef, useEffect, useState } from 'react'

/*
 * Animated beam rays — pure WebGL2 shader, zero external deps.
 * Replicates the react-bits Beams look: vertical light pillars
 * with perlin noise displacement and a teal glow.
 */

const fragmentShader = `#version 300 es
precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
out vec4 fragColor;

// --- noise functions ---
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float aspect = u_resolution.x / u_resolution.y;
  vec2 st = vec2(uv.x * aspect, uv.y);

  float t = u_time * 0.4;

  // beam color — HyperFunded mint teal #97FCE4
  vec3 beamColor = vec3(0.592, 0.988, 0.894);

  float totalLight = 0.0;

  // 15 beams spread across the viewport
  for (int i = 0; i < 15; i++) {
    float fi = float(i);
    // beam x-center with slow drift
    float cx = (fi + 0.5) / 15.0 * aspect;
    cx += sin(t * 0.3 + fi * 1.7) * 0.04;

    // noise-based displacement per beam
    float n = fbm(vec2(fi * 3.7, t * 0.5 + uv.y * 1.75)) * 0.12;
    cx += n;

    // beam width varies per beam
    float bw = 0.008 + 0.004 * sin(fi * 2.3 + 1.0);

    // distance from beam center
    float d = abs(st.x - cx);

    // soft beam falloff — sharp core + wide glow
    float beam = bw / (d + bw);
    beam = pow(beam, 3.0);

    // vertical fade: stronger in center, fades at top/bottom
    float yFade = smoothstep(0.0, 0.3, uv.y) * smoothstep(1.0, 0.7, uv.y);
    beam *= yFade;

    // flicker/shimmer
    float shimmer = 0.7 + 0.3 * sin(t * 2.0 + fi * 4.1 + uv.y * 8.0);
    beam *= shimmer;

    totalLight += beam;
  }

  totalLight = clamp(totalLight, 0.0, 1.0);

  // slight noise grain
  float grain = hash(gl_FragCoord.xy + fract(u_time)) * 0.03;

  vec3 col = beamColor * totalLight * 0.45;
  col -= grain;
  col = max(col, vec3(0.0));

  fragColor = vec4(col, 1.0);
}
`

const vertexShader = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`

export default function BeamsBg({ className = '' }) {
  const canvasRef = useRef(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl2')
    if (!gl) {
      setError('WebGL2 not supported')
      return
    }

    const compile = (type, src) => {
      const s = gl.createShader(type)
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s))
        gl.deleteShader(s)
        return null
      }
      return s
    }

    const vs = compile(gl.VERTEX_SHADER, vertexShader)
    const fs = compile(gl.FRAGMENT_SHADER, fragmentShader)
    if (!vs || !fs) return

    const prog = gl.createProgram()
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog))
      return
    }

    const quadVerts = new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1])
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW)
    const posLoc = gl.getAttribLocation(prog, 'position')
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(prog, 'u_resolution')
    const uTime = gl.getUniformLocation(prog, 'u_time')

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = canvas.clientWidth * dpr
      canvas.height = canvas.clientHeight * dpr
    }
    window.addEventListener('resize', resize)
    resize()

    let rafId
    const animate = (t) => {
      const w = canvas.width
      const h = canvas.height
      gl.viewport(0, 0, w, h)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(prog)
      gl.uniform2f(uRes, w, h)
      gl.uniform1f(uTime, t * 0.001)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      rafId = requestAnimationFrame(animate)
    }
    rafId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="block w-full h-full" />
      {error && (
        <div className="absolute inset-0 bg-zinc-950 flex items-center justify-center text-white font-mono text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
