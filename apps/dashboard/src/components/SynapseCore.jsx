import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import { synapseBus } from '../lib/synapseBus.js'

const NODE_COUNT = 420
const PULSE_COUNT = 24
const RADIUS = 2.0
const LINK_DIST = 0.55 // max neighbor distance for a synapse

// ── Adaptive quality ────────────────────────────────────────────────────────
// Tier 2: full cinema (bloom/noise/vignette, nebula, DPR≤2, AA)
// Tier 1: lean — no fullscreen post passes, half nebula, DPR 1. The post
//         chain is the single biggest cost; dropping it keeps everything
//         animated on integrated GPUs.
// Tier 0: static frame — for software WebGL (SwiftShader etc), where even
//         one animated pass is seconds-per-frame.
// The governor measures real frame times and steps down until usable; the
// choice persists so a slow machine never re-thrashes on reload. Tier<2 also
// sets .perf-lean on <html>, which turns off backdrop-filter + bg animation
// (each blurred panel re-samples the animated backdrop EVERY frame — that
// combination is what melted weak GPUs, not the sphere's own geometry).
const TIER_KEY = 'synapse-quality-tier'

function initialTier() {
  const saved = Number(localStorage.getItem(TIER_KEY))
  return Number.isInteger(saved) && saved >= 0 && saved <= 2 ? saved : 2
}

function applyLeanClass(tier) {
  document.documentElement.classList.toggle('perf-lean', tier < 2)
}

function detectSoftwareGL(gl) {
  try {
    const ctx = gl.getContext()
    const ext = ctx.getExtension('WEBGL_debug_renderer_info')
    const renderer = ext ? ctx.getParameter(ext.UNMASKED_RENDERER_WEBGL) : ''
    return /swiftshader|llvmpipe|software|basic render/i.test(renderer)
  } catch { return false }
}

// Rolling frame-time monitor. Reports ~1×/s; parent decides on downgrades.
function FrameGovernor({ onSample }) {
  const acc = useRef({ time: 0, frames: 0 })
  useFrame((_, dt) => {
    acc.current.time += dt
    acc.current.frames++
    if (acc.current.time >= 1) {
      onSample(acc.current.frames / acc.current.time)
      acc.current.time = 0
      acc.current.frames = 0
    }
  })
  return null
}

// ── Geometry (unchanged from the blueprint spec) ────────────────────────────
function nebulaCloud(count, radius) {
  const pts = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const u = Math.random(), v = Math.random(), w = Math.random()
    const theta = 2 * Math.PI * u
    const phi = Math.acos(2 * v - 1)
    const r = Math.cbrt(w) * radius
    pts.set([
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi),
    ], i * 3)
  }
  return pts
}

function ringPoints(radius, segments = 128) {
  const pts = new Float32Array(segments * 3)
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2
    pts.set([Math.cos(a) * radius, 0, Math.sin(a) * radius], i * 3)
  }
  return pts
}

function fibonacciSphere(count, radius) {
  const pts = new Float32Array(count * 3)
  const phi = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const t = phi * i
    pts.set([Math.cos(t) * r * radius, y * radius, Math.sin(t) * r * radius], i * 3)
  }
  return pts
}

function buildEdges(nodes) {
  const v = i => new THREE.Vector3(nodes[i * 3], nodes[i * 3 + 1], nodes[i * 3 + 2])
  const edges = []
  const seen = new Set()
  for (let i = 0; i < NODE_COUNT; i++) {
    const near = []
    for (let j = 0; j < NODE_COUNT; j++) {
      if (i === j) continue
      const d = v(i).distanceTo(v(j))
      if (d < LINK_DIST) near.push({ j, d })
    }
    near.sort((a, b) => a.d - b.d).slice(0, 3).forEach(({ j }) => {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`
      if (!seen.has(key)) { seen.add(key); edges.push([i, j]) }
    })
  }
  return edges
}

function NeuralMesh({ tier }) {
  const spin = useRef()
  const pulseGeo = useRef()
  const flashMat = useRef()
  const ringA = useRef()
  const ringB = useRef()

  const nebulaCount = tier === 2 ? 1200 : 500
  const nodes = useMemo(() => fibonacciSphere(NODE_COUNT, RADIUS), [])
  const edges = useMemo(() => buildEdges(nodes), [nodes])
  const nebula = useMemo(() => nebulaCloud(nebulaCount, 1.45), [nebulaCount])
  const ring = useMemo(() => ringPoints(2.65), [])

  const linePositions = useMemo(() => {
    const arr = new Float32Array(edges.length * 6)
    edges.forEach(([a, b], k) => {
      arr.set(nodes.slice(a * 3, a * 3 + 3), k * 6)
      arr.set(nodes.slice(b * 3, b * 3 + 3), k * 6 + 3)
    })
    return arr
  }, [edges, nodes])

  const pulses = useMemo(() =>
    Array.from({ length: PULSE_COUNT }, () => ({
      edge: Math.floor(Math.random() * edges.length),
      t: Math.random(),
      speed: 0.7 + Math.random() * 1.1,
    })), [edges])
  const pulsePositions = useMemo(() => new Float32Array(PULSE_COUNT * 3), [])

  useEffect(() => synapseBus.on('pulse', n => {
    const origin = Math.floor(Math.random() * NODE_COUNT)
    const local = edges.map((e, i) => (e[0] === origin || e[1] === origin) ? i : -1)
                       .filter(i => i >= 0)
    if (!local.length) return
    for (let k = 0; k < Math.min(n, PULSE_COUNT); k++) {
      const p = pulses[Math.floor(Math.random() * PULSE_COUNT)]
      p.edge = local[k % local.length]
      p.t = 0
      p.speed = 1.6 + Math.random() * 0.8 // bursts travel faster
    }
    if (flashMat.current) flashMat.current.opacity = Math.min(0.32, 0.1 + n * 0.045)
  }), [edges, pulses])

  useFrame((state, dt) => {
    spin.current.rotation.y += dt * 0.04
    spin.current.rotation.x += dt * 0.015

    const t = state.clock.elapsedTime
    if (ringA.current) { ringA.current.rotation.y = t * 0.12; ringA.current.rotation.x = 0.5 }
    if (ringB.current) { ringB.current.rotation.y = -t * 0.08; ringB.current.rotation.x = -0.35; ringB.current.rotation.z = 0.4 }
    spin.current.scale.setScalar(1 + Math.sin(t * 0.5) * 0.015)

    if (flashMat.current && flashMat.current.opacity > 0.02)
      flashMat.current.opacity = Math.max(0.02, flashMat.current.opacity - dt * 0.35)

    pulses.forEach((p, i) => {
      p.t += dt * p.speed
      if (p.t >= 1) {
        p.t = 0
        p.edge = Math.floor(Math.random() * edges.length)
        p.speed = 0.7 + Math.random() * 1.1
      }
      const [a, b] = edges[p.edge]
      for (let c = 0; c < 3; c++) {
        pulsePositions[i * 3 + c] =
          nodes[a * 3 + c] + (nodes[b * 3 + c] - nodes[a * 3 + c]) * p.t
      }
    })
    pulseGeo.current.attributes.position.needsUpdate = true // GPU re-upload — required
  })

  // Without the bloom pass (tier<2), brighten materials so the glow survives
  const glowBoost = tier === 2 ? 1 : 1.6

  return (
    <group ref={spin}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[nodes, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#22D3EE" size={0.035 * (tier === 2 ? 1 : 1.15)} sizeAttenuation transparent
          opacity={Math.min(1, 0.9 * glowBoost)} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#0EA5E9" transparent opacity={0.12 * glowBoost}
          depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>

      <points>
        <bufferGeometry ref={pulseGeo}>
          <bufferAttribute attach="attributes-position" args={[pulsePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#7DD3FC" size={0.09} sizeAttenuation transparent
          depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[nebula, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#0EA5E9" size={0.02} sizeAttenuation transparent opacity={0.35}
          depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      <mesh>
        <sphereGeometry args={[2.06, 32, 32]} />
        <meshBasicMaterial ref={flashMat} color="#38BDF8" transparent opacity={0.02}
          depthWrite={false} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
      </mesh>

      <lineLoop ref={ringA}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[ring, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#22D3EE" transparent opacity={0.18 * glowBoost}
          depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineLoop>
      <lineLoop ref={ringB}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[ring, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#0EA5E9" transparent opacity={0.12 * glowBoost}
          depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineLoop>
    </group>
  )
}

function ParallaxRig({ children }) {
  const rig = useRef()
  const { pointer } = useThree()
  useFrame(() => {
    rig.current.rotation.x = THREE.MathUtils.lerp(rig.current.rotation.x, pointer.y * 0.22, 0.06)
    rig.current.rotation.y = THREE.MathUtils.lerp(rig.current.rotation.y, pointer.x * 0.22, 0.06)
    rig.current.position.x = THREE.MathUtils.lerp(rig.current.position.x, pointer.x * 0.35, 0.05)
    rig.current.position.y = THREE.MathUtils.lerp(rig.current.position.y, pointer.y * 0.2, 0.05)
  })
  return <group ref={rig}>{children}</group>
}

function WarpIn({ still }) {
  const { camera } = useThree()
  const t = useRef(0)
  useFrame((_, dt) => {
    if (still) { camera.position.z = 5.4; return }
    if (t.current >= 1) return
    t.current = Math.min(1, t.current + dt / 2.0)
    const eased = 1 - Math.pow(1 - t.current, 4)
    camera.position.z = 14 - (14 - 5.4) * eased
  })
  return null
}

export function SynapseCore({ onActivate }) {
  const reduced = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [tier, setTier] = useState(initialTier)
  const [fps, setFps] = useState(null)
  const [hidden, setHidden] = useState(document.hidden)
  const slowSamples = useRef(0)

  useEffect(() => { applyLeanClass(tier); localStorage.setItem(TIER_KEY, String(tier)) }, [tier])
  useEffect(() => {
    const onVis = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  const onSample = useCallback(avgFps => {
    setFps(Math.round(avgFps))
    // Two consecutive slow seconds -> drop a tier. 24fps is the floor of
    // "reads as motion"; below it the cinematic frame does more harm than good.
    if (avgFps < 24) {
      if (++slowSamples.current >= 2) {
        slowSamples.current = 0
        setTier(t => Math.max(0, t - 1))
      }
    } else {
      slowSamples.current = 0
    }
  }, [])

  const still = reduced || tier === 0 || hidden

  return (
    <div
      className="relative w-full h-[480px] lg:h-[540px] cursor-pointer"
      onClick={onActivate}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter') onActivate?.() }}
      aria-label="Enter the Synapse — spatial agent view"
    >
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none">
        <h3 className="label glow-text" style={{ color: 'var(--color-accent)' }}>Synapse Core</h3>
        <p className="font-mono mt-1 text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>
          Real-Time Vector Sync · click to enter
        </p>
      </div>
      <div className="absolute bottom-2 right-3 z-10 font-mono text-[9px] pointer-events-none"
        style={{ color: 'var(--color-muted-foreground)', opacity: 0.7 }}>
        q{tier}{fps !== null && !still ? ` · ${fps}fps` : tier === 0 ? ' · static' : ''}
      </div>
      {/* key={tier} — antialias/dpr are construction-time options, so a tier
          change rebuilds the canvas cleanly */}
      <Canvas
        key={tier}
        gl={{ antialias: tier === 2, alpha: true }}
        dpr={tier === 2 ? [1, 2] : 1}
        camera={{ position: [0, 0, still ? 5.4 : 14], fov: 52 }}
        frameloop={still ? 'demand' : 'always'}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.outputColorSpace = THREE.SRGBColorSpace
          // Software WebGL can't do this scene at speed no matter what we
          // trim — jump straight to the static frame instead of thrashing.
          if (detectSoftwareGL(gl) && tier > 0) setTier(0)
        }}
      >
        <ambientLight intensity={0.4} />
        <WarpIn still={still} />
        {!still && <FrameGovernor onSample={onSample} />}
        <ParallaxRig>
          <NeuralMesh tier={tier} />
        </ParallaxRig>
        {tier === 2 && (
          <EffectComposer>
            <Bloom luminanceThreshold={0.12} intensity={1.7} mipmapBlur />
            <Noise premultiply blendFunction={BlendFunction.SCREEN} opacity={0.05} />
            <Vignette eskil={false} offset={0.14} darkness={0.7} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  )
}
