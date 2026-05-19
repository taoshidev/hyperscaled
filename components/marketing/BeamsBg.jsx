'use client'

import { useRef, useEffect, useState } from 'react'

/*
 * Animated beam ribbons — pure WebGL2 shader, zero external deps.
 * Replicates the react-bits Beams visual: vertical light ribbons
 * with 3D Perlin noise displacement, lit by a teal directional light.
 *
 * HyperFunded settings:
 *   beamWidth=5, beamHeight=12, beamNumber=15,
 *   lightColor=#97fce4, speed=2, noiseIntensity=1.75,
 *   scale=0.15, rotation=0
 */

const fragmentShader = `#version 300 es
precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
out vec4 fragColor;

// ─── 3D Perlin noise (identical to react-bits cnoise) ───
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

float cnoise(vec3 P){
  vec3 Pi0 = floor(P);
  vec3 Pi1 = Pi0 + vec3(1.0);
  Pi0 = mod(Pi0, 289.0);
  Pi1 = mod(Pi1, 289.0);
  vec3 Pf0 = fract(P);
  vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;
  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);
  vec4 gx0 = ixy0 / 7.0;
  vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);
  vec4 gx1 = ixy1 / 7.0;
  vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);
  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
  vec4 norm0 = taylorInvSqrt(vec4(dot(g000,g000),dot(g010,g010),dot(g100,g100),dot(g110,g110)));
  g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001,g001),dot(g011,g011),dot(g101,g101),dot(g111,g111)));
  g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;
  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x,Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x,Pf1.y,Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy,Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy,Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x,Pf0.y,Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x,Pf1.yz));
  float n111 = dot(g111, Pf1);
  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000,n100,n010,n110),vec4(n001,n101,n011,n111),fade_xyz.z);
  vec2 n_yz = mix(n_z.xy,n_z.zw,fade_xyz.y);
  float n_xyz = mix(n_yz.x,n_yz.y,fade_xyz.x);
  return 2.2 * n_xyz;
}

// ─── 2D noise for grain ───
float random2(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

// ─── Config ───
const int BEAM_COUNT = 15;
const vec3 LIGHT_COLOR = vec3(0.592, 0.988, 0.894); // #97FCE4
const float SPEED = 2.0;
const float NOISE_SCALE = 0.15;
const float NOISE_INTENSITY = 1.75;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float aspect = u_resolution.x / u_resolution.y;

  // Time — react-bits increments at 0.1x real-time
  float time = u_time * 0.1;

  vec3 col = vec3(0.0);

  // Each beam is a vertical strip across the screen.
  // We map them to fill the viewport with slight overlap.
  float beamSpacing = 1.0 / float(BEAM_COUNT);

  for (int i = 0; i < 15; i++) {
    float fi = float(i);

    // Beam center in UV space [0,1]
    float cx = (fi + 0.5) * beamSpacing;

    // Per-beam random seeds (deterministic)
    float seed1 = fract(sin(fi * 127.1 + 23.7) * 43758.5453);
    float seed2 = fract(sin(fi * 311.7 + 91.3) * 43758.5453);
    float uvYOffset = seed2 * 300.0;

    // Beam width in UV space — slightly wider than spacing so they overlap
    float halfW = beamSpacing * 0.65;

    // Distance from beam center (in X)
    float dx = abs(uv.x - cx) / halfW;
    if (dx > 1.0) continue;

    // Soft beam falloff
    float beamMask = 1.0 - dx * dx;
    beamMask = smoothstep(0.0, 1.0, beamMask);

    // Noise-based surface displacement (matching react-bits vertex shader)
    // react-bits: noisePos = vec3(0, pos.y - uv.y, time * speed * 3) * scale
    // pos.y maps to worldY, uv.y maps to texV
    float worldY = (uv.y - 0.5) * 12.0; // beam height = 12
    float texV = uv.y + uvYOffset;

    vec3 np = vec3(0.0, worldY - texV, time * SPEED * 3.0) * NOISE_SCALE;
    float disp = cnoise(np);

    // Compute surface normal via finite differences in noise space
    float eps = 0.05;
    float dispUp = cnoise(np + vec3(0.0, eps, 0.0));

    // Slope with amplification for dramatic lighting variation
    float slope = (dispUp - disp) / eps;
    slope *= 4.0; // amplify to create strong light/dark banding

    // Normal = normalize(0, -slope, 1)
    vec3 normal = normalize(vec3(0.0, -slope, 1.0));

    // Directional light from [0, 3, 10] (react-bits DirLight)
    vec3 lightDir = normalize(vec3(0.0, 0.287, 0.958));

    // Diffuse
    float NdotL = max(dot(normal, lightDir), 0.0);

    // Specular (Blinn-Phong, roughness=0.3)
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    vec3 halfVec = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfVec), 0.0), 24.0);

    // Combine lighting — bias dark for subtlety
    float lighting = NdotL * 0.55 + spec * 0.35 + 0.01;

    // Apply beam mask and add to output
    vec3 beamCol = LIGHT_COLOR * lighting * beamMask;
    col += beamCol;
  }

  // Subtle noise grain (react-bits: rgb -= randomNoise / 15 * noiseIntensity)
  float grain = random2(gl_FragCoord.xy + fract(u_time)) / 15.0 * NOISE_INTENSITY;
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
        console.error('BeamsBg shader error:', gl.getShaderInfoLog(s))
        gl.deleteShader(s)
        return null
      }
      return s
    }

    const vs = compile(gl.VERTEX_SHADER, vertexShader)
    const fs = compile(gl.FRAGMENT_SHADER, fragmentShader)
    if (!vs || !fs) {
      setError('Shader compilation failed')
      return
    }

    const prog = gl.createProgram()
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('BeamsBg link error:', gl.getProgramInfoLog(prog))
      setError('Shader link failed')
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
