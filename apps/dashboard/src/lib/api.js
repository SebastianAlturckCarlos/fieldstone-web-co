import { synapseBus } from './synapseBus.js'

export async function fetchState() {
  const res = await fetch('/api/state')
  if (!res.ok) throw new Error(`state fetch failed: ${res.status}`)
  return res.json()
}

export async function postAction(path) {
  const res = await fetch(path, { method: 'POST' })
  return res.json()
}

export async function postJSON(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

export async function fetchPipeline() {
  const res = await fetch('/api/pipeline')
  if (!res.ok) throw new Error(`pipeline fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchAgent(id) {
  const res = await fetch(`/api/agents/${id}`)
  if (!res.ok) throw new Error(`agent fetch failed: ${res.status}`)
  return res.json()
}

// Full drill-down for one lead: audit, brand, drafts, agent-run timeline.
export async function fetchLead(id) {
  const res = await fetch(`/api/leads/${id}`)
  if (!res.ok) throw new Error(`lead fetch failed: ${res.status}`)
  return res.json()
}

// The branded mockup screenshot for a lead (404s if none was rendered).
export function snapshotUrl(leadId) {
  return `/api/snapshots/${leadId}.png`
}

// Opens the SSE stream. Every feed event also fires a sphere pulse so
// business activity is literally visible as light.
export function openEventStream({ onFeed, onAlert, onAny }) {
  const es = new EventSource('/api/events')
  es.onmessage = msg => {
    const e = JSON.parse(msg.data)
    if (e.type === 'pulse') synapseBus.emit('pulse', e.data.n ?? 3)
    if (e.type === 'feed') {
      synapseBus.emit('pulse', 2)
      onFeed?.(e)
    }
    if (e.type === 'alert') onAlert?.(e)
    onAny?.(e)
  }
  return () => es.close()
}
