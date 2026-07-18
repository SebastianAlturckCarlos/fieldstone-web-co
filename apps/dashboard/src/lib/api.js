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

export async function fetchAgent(id) {
  const res = await fetch(`/api/agents/${id}`)
  if (!res.ok) throw new Error(`agent fetch failed: ${res.status}`)
  return res.json()
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
