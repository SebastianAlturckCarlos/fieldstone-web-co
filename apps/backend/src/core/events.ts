// In-process event hub. The HTTP server subscribes and forwards to SSE
// clients; the orchestrator emits as leads move through the pipeline.

export type EngineEvent = {
  type: 'feed' | 'pulse' | 'agent_status' | 'approval_needed' | 'alert'
  data: any
  at: string
}

type Listener = (e: EngineEvent) => void
const listeners = new Set<Listener>()

export function emitEvent(type: EngineEvent['type'], data: any) {
  const e: EngineEvent = { type, data, at: new Date().toISOString() }
  for (const l of listeners) l(e)
}

export function onEvent(l: Listener): () => void {
  listeners.add(l)
  return () => listeners.delete(l)
}
