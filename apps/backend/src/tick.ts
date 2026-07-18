import { AGENT_MODE } from './core/config.js'
import { tick } from './core/orchestrator.js'
import { BudgetExceeded } from './core/ledger.js'
import { printStatus } from './jobs/status.js'

console.log(`=== Fieldstone Agentic OS — tick (mode: ${AGENT_MODE}) ===\n`)
try {
  await tick()
} catch (err) {
  if (err instanceof BudgetExceeded) {
    console.log(`PAUSED — ${err.message}. No work dispatched; resumes when the day rolls over or the cap is raised.`)
  } else {
    throw err
  }
}
console.log('')
printStatus()
