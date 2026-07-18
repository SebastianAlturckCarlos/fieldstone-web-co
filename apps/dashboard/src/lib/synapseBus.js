// Tiny event bus: business events -> visible light on the Synapse Core.
const handlers = new Set()

export const synapseBus = {
  emit(event, n = 3) {
    if (event === 'pulse') handlers.forEach(h => h(n))
  },
  on(event, h) {
    if (event === 'pulse') handlers.add(h)
    return () => handlers.delete(h)
  },
}
