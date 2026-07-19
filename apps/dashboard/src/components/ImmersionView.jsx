// Sprint 5 — Synapse Immersion. Clicking the sphere flies the camera through
// the membrane into the org itself: CEO node at the top, the worker agents
// arranged below, live pulse traffic on the real pipeline edges. Click a
// worker for its detail panel; click the CEO for the command console; Escape
// backs out. Honors the same quality tier as the sphere (no post passes
// below tier 2).
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { X } from 'lucide-react'
import { synapseBus } from '../lib/synapseBus.js'
import { detectSoftwareGL, QUALITY_LOCK_KEY } from './SynapseCore.jsx'

const NODES = [
  { id: 'ceo_agent', label: 'CEO', pos: [0, 1.55, 0], size: 0.34 },
  { id: 'researcher_agent', label: 'RES', pos: [-2.5, -0.55, 0.1], size: 0.22 },
  { id: 'cmo_agent', label: 'CMO', pos: [-1.25, -1.05, 0.45], size: 0.22 },
  { id: 'sales_rep_agent', label: 'SLS', pos: [0, -1.25, 0.6], size: 0.22 },
  { id: 'analytics_agent', label: 'ANL', pos: [1.25, -1.05, 0.45], size: 0.22 },
  { id: 'dev_agent', label: 'DEV', pos: [2.5, -0.55, 0.1], size: 0.22 },
]
// The actual pipeline: audit -> draft -> QA -> consult/dispatch, plus the
// CEO's supervision spokes.
const EDGES = [
  [1, 2], [2, 0], [0, 3], [3, 4], [4, 0], [0, 5], [5, 0],
  [0, 1], [0, 2], [0, 4],
]
const PULSES = 12

function idx(id) { return NODES.findIndex(n => n.id === id) }

function OrgGraph({ roster, onNode, labelRefs, cheap }) {
  const group = useRef()
  const pulseGeo = useRef()
  const pulsePositions = useMemo(() => new Float32Array(PULSES * 3), [])
  const pulses = useMemo(() => Array.from({ length: PULSES }, () => ({
    edge: Math.floor(Math.random() * EDGES.length),
    t: Math.random(),
    speed: 0.5 + Math.random() * 0.7,
  })), [])

  const linePositions = useMemo(() => {
    const arr = new Float32Array(EDGES.length * 6)
    EDGES.forEach(([a, b], k) => {
      arr.set(NODES[a].pos, k * 6)
      arr.set(NODES[b].pos, k * 6 + 3)
    })
    return arr
  }, [])

  useEffect(() => synapseBus.on('pulse', n => {
    for (let k = 0; k < Math.min(n, PULSES); k++) {
      const p = pulses[Math.floor(Math.random() * PULSES)]
      p.t = 0
      p.speed = 1.2 + Math.random() * 0.8
    }
  }), [pulses])

  const statusOf = id => roster?.find(r => r.id === id)?.status ?? 'idle'

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    if (group.current) group.current.position.y = Math.sin(t * 0.6) * 0.04

    pulses.forEach((p, i) => {
      p.t += dt * p.speed
      if (p.t >= 1) { p.t = 0; p.edge = Math.floor(Math.random() * EDGES.length); p.speed = 0.5 + Math.random() * 0.7 }
      const [a, b] = EDGES[p.edge]
      for (let c = 0; c < 3; c++) {
        pulsePositions[i * 3 + c] = NODES[a].pos[c] + (NODES[b].pos[c] - NODES[a].pos[c]) * p.t
      }
    })
    if (pulseGeo.current) pulseGeo.current.attributes.position.needsUpdate = true

    // Project node positions into screen space and move the HTML labels —
    // direct DOM writes, no per-frame React state.
    const v = new THREE.Vector3()
    NODES.forEach((n, i) => {
      const el = labelRefs.current[i]
      if (!el) return
      v.set(n.pos[0], n.pos[1] + (group.current?.position.y ?? 0), n.pos[2]).project(state.camera)
      el.style.left = `${(v.x * 0.5 + 0.5) * 100}%`
      el.style.top = `${(-v.y * 0.5 + 0.5) * 100 + 4.5}%`
    })
  })

  return (
    <group ref={group}>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#0EA5E9" transparent opacity={0.28}
          depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>

      <points>
        <bufferGeometry ref={pulseGeo}>
          <bufferAttribute attach="attributes-position" args={[pulsePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#7DD3FC" size={0.1} sizeAttenuation transparent
          depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      {NODES.map((n, i) => {
        const running = statusOf(n.id) === 'run'
        return (
          <group key={n.id} position={n.pos}>
            <mesh
              onClick={e => { e.stopPropagation(); onNode(n.id) }}
              onPointerOver={() => (document.body.style.cursor = 'pointer')}
              onPointerOut={() => (document.body.style.cursor = '')}
            >
              <sphereGeometry args={[n.size, cheap ? 12 : 24, cheap ? 12 : 24]} />
              <meshBasicMaterial
                color={i === 0 ? '#38BDF8' : running ? '#22D3EE' : '#164E63'}
                transparent opacity={running || i === 0 ? 0.95 : 0.7}
              />
            </mesh>
            <mesh>
              <sphereGeometry args={[n.size * 1.5, cheap ? 10 : 16, cheap ? 10 : 16]} />
              <meshBasicMaterial color={i === 0 ? '#38BDF8' : '#0EA5E9'} transparent
                opacity={running || i === 0 ? 0.18 : 0.07}
                depthWrite={false} blending={THREE.AdditiveBlending} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

// Camera flies through the membrane: starts at the sphere's seat and dollies
// through to the org's viewing position. In cheap mode (software/weak GL) the
// dolly is skipped — at seconds-per-frame the animation would never finish
// and the org nodes would sit off-camera, unclickable.
function FlyIn({ skip }) {
  const t = useRef(0)
  useFrame(({ camera }, dt) => {
    if (skip) { camera.position.set(0, 0.15, 5.2); return }
    if (t.current >= 1) return
    t.current = Math.min(1, t.current + dt / 1.4)
    const eased = 1 - Math.pow(1 - t.current, 3)
    camera.position.z = 1.2 + (5.2 - 1.2) * eased
    camera.position.y = 0.15 * eased
  })
  return null
}

export function ImmersionView({ roster, onSelectAgent, onOpenCeo, onClose }) {
  const labelRefs = useRef([])
  const [tier] = useState(() => {
    const saved = Number(localStorage.getItem('synapse-quality-tier'))
    return Number.isInteger(saved) && saved >= 0 ? saved : 2
  })
  // Cheap mode: no fly-in, no bloom, no AA, low DPR, low-poly nodes. The org
  // scene is tiny (6 spheres + a dozen lines), so unlike the main sphere it
  // stays ANIMATED even on software WebGL — it just sheds every fullscreen
  // pass. Entered when the saved tier is already lowered, or the moment
  // software GL is detected at canvas creation. A pinned tier (the badge on
  // the sphere) always wins — pinned q2 runs the full fly-in regardless.
  const pinned = localStorage.getItem(QUALITY_LOCK_KEY) === '1'
  const [cheap, setCheap] = useState(tier < 2)

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-30" role="dialog" aria-modal="true"
      style={{ background: 'radial-gradient(ellipse at 50% 35%, #071228 0%, #020617 70%)' }}>
      <div className="absolute top-5 left-1/2 z-10 -translate-x-1/2 text-center pointer-events-none">
        <h2 className="label glow-text" style={{ color: 'var(--color-accent)' }}>Inside the Synapse</h2>
        <p className="mt-1 font-mono text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>
          click an agent · CEO opens the command console · Esc to exit
        </p>
      </div>
      <button onClick={onClose} aria-label="Exit the Synapse"
        className="absolute top-4 right-4 z-10 rounded-lg border p-2"
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)', background: 'rgba(2,6,23,0.6)' }}>
        <X size={16} />
      </button>

      {/* HTML labels, positioned every frame from the 3D projection */}
      {NODES.map((n, i) => (
        <div key={n.id} ref={el => (labelRefs.current[i] = el)}
          className="pointer-events-none absolute z-10 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.25em]"
          style={{ color: i === 0 ? 'var(--color-accent)' : 'var(--color-muted-foreground)' }}>
          {n.label}
        </div>
      ))}

      {/* key: antialias/dpr are construction-time options — flipping to cheap
          mid-flight (software-GL detection) needs a clean canvas rebuild */}
      <Canvas
        key={cheap ? 'cheap' : 'full'}
        gl={{ antialias: !cheap, alpha: true }}
        dpr={cheap ? 0.75 : [1, 2]}
        camera={{ position: cheap ? [0, 0.15, 5.2] : [0, 0, 1.2], fov: 50 }}
        frameloop="always"
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.outputColorSpace = THREE.SRGBColorSpace
          if (detectSoftwareGL(gl) && !cheap && !pinned) setCheap(true)
        }}
      >
        <ambientLight intensity={0.5} />
        <FlyIn skip={cheap} />
        <OrgGraph roster={roster} labelRefs={labelRefs} cheap={cheap}
          onNode={id => (id === 'ceo_agent' ? onOpenCeo() : onSelectAgent(id))} />
        {!cheap && tier === 2 && (
          <EffectComposer>
            <Bloom luminanceThreshold={0.15} intensity={1.3} mipmapBlur />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  )
}
