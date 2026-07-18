import React, { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import { synapseBus } from '../lib/synapseBus.js'

const NODE_COUNT = 420
const PULSE_COUNT = 24
const NEBULA_COUNT = 1200
const RADIUS = 2.0
const LINK_DIST = 0.55 // max neighbor distance for a synapse

// Volumetric inner cloud — uniform random points inside a sphere
function nebulaCloud(count, radius) {
  const pts = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    // rejection-free: direction * cbrt(u) * r gives uniform density
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

// Thin orbital ring in the XZ plane
function ringPoints(radius, segments = 128) {
  const pts = new Float32Array(segments * 3)
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2
    pts.set([Math.cos(a) * radius, 0, Math.sin(a) * radius], i * 3)
  }
  return pts
}

// Even node distribution — Fibonacci sphere
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

// Precompute synapses: 3 nearest neighbors within LINK_DIST, deduped
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

function NeuralMesh() {
  const spin = useRef()
  const pulseGeo = useRef()
  const flashMat = useRef()
  const ringA = useRef()
  const ringB = useRef()

  const nodes = useMemo(() => fibonacciSphere(NODE_COUNT, RADIUS), [])
  const edges = useMemo(() => buildEdges(nodes), [nodes])
  const nebula = useMemo(() => nebulaCloud(NEBULA_COUNT, 1.45), [])
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

  // Business events -> burst: re-seed n pulses at one node so light radiates outward
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
    // Energy surge: the shell flashes and decays back down in useFrame
    if (flashMat.current) flashMat.current.opacity = Math.min(0.32, 0.1 + n * 0.045)
  }), [edges, pulses])

  useFrame((state, dt) => {
    spin.current.rotation.y += dt * 0.04
    spin.current.rotation.x += dt * 0.015

    // Counter-rotating orbital rings + slow breathing
    const t = state.clock.elapsedTime
    if (ringA.current) { ringA.current.rotation.y = t * 0.12; ringA.current.rotation.x = 0.5 }
    if (ringB.current) { ringB.current.rotation.y = -t * 0.08; ringB.current.rotation.x = -0.35; ringB.current.rotation.z = 0.4 }
    spin.current.scale.setScalar(1 + Math.sin(t * 0.5) * 0.015)

    // Flash decay — energy surge fades over ~1s
    if (flashMat.current && flashMat.current.opacity > 0.02)
      flashMat.current.opacity = Math.max(0.02, flashMat.current.opacity - dt * 0.35)

    pulses.forEach((p, i) => {
      p.t += dt * p.speed
      if (p.t >= 1) {
        p.t = 0
        p.edge = Math.floor(Math.random() * edges.length)
        p.speed = 0.7 + Math.random() * 1.1 // bursts decay back to ambient speed
      }
      const [a, b] = edges[p.edge]
      for (let c = 0; c < 3; c++) {
        pulsePositions[i * 3 + c] =
          nodes[a * 3 + c] + (nodes[b * 3 + c] - nodes[a * 3 + c]) * p.t
      }
    })
    pulseGeo.current.attributes.position.needsUpdate = true // GPU re-upload — required
  })

  return (
    <group ref={spin}>
      {/* Neuron nodes */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[nodes, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#22D3EE" size={0.035} sizeAttenuation transparent
          depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      {/* Synaptic connections — one draw call */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#0EA5E9" transparent opacity={0.12}
          depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>

      {/* Traveling signal pulses */}
      <points>
        <bufferGeometry ref={pulseGeo}>
          <bufferAttribute attach="attributes-position" args={[pulsePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#7DD3FC" size={0.09} sizeAttenuation transparent
          depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      {/* Inner nebula — volumetric depth */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[nebula, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#0EA5E9" size={0.02} sizeAttenuation transparent opacity={0.35}
          depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      {/* Energy-surge shell — flashes on synapseBus bursts, decays in useFrame */}
      <mesh>
        <sphereGeometry args={[2.06, 32, 32]} />
        <meshBasicMaterial ref={flashMat} color="#38BDF8" transparent opacity={0.02}
          depthWrite={false} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Counter-rotating orbital rings */}
      <lineLoop ref={ringA}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[ring, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#22D3EE" transparent opacity={0.18}
          depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineLoop>
      <lineLoop ref={ringB}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[ring, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#0EA5E9" transparent opacity={0.12}
          depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineLoop>
    </group>
  )
}

// Outer parallax rig: the sphere leans toward the pointer AND shifts in space,
// so it reads as an object floating in front of the screen, not a texture on it.
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

// Warp-in: camera dollies from deep space to its seat over ~2s on load
function WarpIn({ reduced }) {
  const { camera } = useThree()
  const t = useRef(0)
  useFrame((_, dt) => {
    if (reduced) { camera.position.z = 5.4; return }
    if (t.current >= 1) return
    t.current = Math.min(1, t.current + dt / 2.0)
    const eased = 1 - Math.pow(1 - t.current, 4) // expo-ish out
    camera.position.z = 14 - (14 - 5.4) * eased
  })
  return null
}

export function SynapseCore() {
  const reduced = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  return (
    // No clipping circle, no border — the sphere floats free in the page's space.
    <div className="relative w-full h-[480px] lg:h-[540px]">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none">
        <h3 className="label glow-text" style={{ color: 'var(--color-accent)' }}>Synapse Core</h3>
        <p className="font-mono mt-1 text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>
          Real-Time Vector Sync
        </p>
      </div>
      <Canvas
        gl={{ antialias: true, alpha: true }} // antialias only works at construction
        dpr={[1, 2]}
        camera={{ position: [0, 0, 14], fov: 52 }}
        frameloop={reduced ? 'demand' : 'always'}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.outputColorSpace = THREE.SRGBColorSpace
        }}
      >
        <ambientLight intensity={0.4} />
        <WarpIn reduced={reduced} />
        <ParallaxRig>
          <NeuralMesh />
        </ParallaxRig>
        <EffectComposer>
          <Bloom luminanceThreshold={0.12} intensity={1.7} mipmapBlur />
          <Noise premultiply blendFunction={BlendFunction.SCREEN} opacity={0.05} />
          <Vignette eskil={false} offset={0.14} darkness={0.7} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
