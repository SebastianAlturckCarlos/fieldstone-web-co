import { useCallback, useEffect, useRef, useState } from 'react'
import { Zap, Crown, Sparkles } from 'lucide-react'
import { fetchState, openEventStream } from './lib/api.js'
import { SynapseCore } from './components/SynapseCore.jsx'
import { AgentDetail } from './components/AgentDetail.jsx'
import { GrowthScreen } from './components/GrowthScreen.jsx'
import { PipelineScreen } from './components/PipelineScreen.jsx'
import { BacklogScreen } from './components/BacklogScreen.jsx'
import { CEOCommand } from './components/CEOCommand.jsx'
import { ImmersionView } from './components/ImmersionView.jsx'
import { JarvisPanel } from './components/JarvisPanel.jsx'

export default function App() {
  const [state, setState] = useState(null)
  const [feed, setFeed] = useState([])
  const [alert, setAlert] = useState(null)
  const [offline, setOffline] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [immersed, setImmersed] = useState(false)
  const [jarvis, setJarvis] = useState(false)
  // The landing is deliberately minimal: header + sphere, nothing else.
  // Everything operational (roster, feed, KPIs, queues, controls) lives in
  // the CEO tab — a first-class view, not a modal.
  const [view, setView] = useState('mission') // 'mission' | 'ceo' | 'pipeline' | 'growth'
  const keyRef = useRef(0)

  const refresh = useCallback(async () => {
    try {
      setState(await fetchState())
      setOffline(false)
    } catch {
      setOffline(true)
    }
  }, [])

  useEffect(() => {
    refresh()
    const close = openEventStream({
      onFeed: e => {
        setFeed(f => [{ ...e, key: keyRef.current++ }, ...f].slice(0, 100))
        refresh()
      },
      onAlert: e => setAlert(e.data.msg),
    })
    const poll = setInterval(refresh, 15_000) // safety net if SSE drops
    return () => { close(); clearInterval(poll) }
  }, [refresh])

  const openCeo = useCallback(() => { setImmersed(false); setView('ceo') }, [])

  // Roster click (from the CEO tab or inside the sphere): the CEO opens the
  // command view; workers open their detail panels.
  const onSelectRosterAgent = useCallback(id => {
    if (id === 'ceo_agent') openCeo()
    else setSelectedAgent(id)
  }, [openCeo])

  const pendingDecisions = (state?.approvals?.length ?? 0) + (state?.replyQueue?.length ?? 0)

  return (
    <div className="mx-auto min-h-screen max-w-[1600px] px-4 py-4 flex flex-col gap-4">
      <header className="panel flex items-center gap-4 px-5 py-3">
        <span aria-hidden className="h-3 w-3 rotate-45"
          style={{ background: 'var(--color-primary)', boxShadow: '0 0 10px var(--color-primary)' }} />
        <h1 className="font-display text-sm font-semibold tracking-[0.25em] uppercase glow-text">
          Fieldstone Agentic OS
        </h1>
        <span className="font-mono text-[10px] rounded-full border px-2 py-0.5 uppercase"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)' }}>
          mode: {state?.mode ?? '…'}
        </span>
        {state?.autoTick?.enabled && (
          <span className="flex items-center gap-1 font-mono text-[10px] rounded-full border px-2 py-0.5 uppercase"
            style={{ borderColor: 'rgba(34,197,94,0.4)', color: 'var(--color-success)' }}>
            <Zap size={10} /> autonomous · {Math.round(state.autoTick.intervalMs / 1000)}s
          </span>
        )}
        <nav className="ml-4 flex gap-1 font-mono text-xs">
          {[['mission', 'Mission Control'], ['pipeline', 'Pipeline'], ['backlog', 'Backlog'], ['growth', 'Growth']].map(([id, label]) => (
            <button key={id} onClick={() => setView(id)}
              className="rounded-lg px-3 py-1.5 uppercase tracking-wider transition-colors duration-150"
              style={view === id
                ? { background: 'var(--color-muted)', color: 'var(--color-accent)' }
                : { color: 'var(--color-muted-foreground)' }}>
              {label}
            </button>
          ))}
        </nav>
        {offline && (
          <span className="font-mono text-xs" style={{ color: 'var(--color-destructive)' }}>
            engine offline — start it with `npm run serve`
          </span>
        )}
        <button
          onClick={() => setJarvis(j => !j)}
          className="ml-auto flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-xs uppercase tracking-wider transition-colors duration-150"
          style={jarvis
            ? { borderColor: 'rgba(34,211,238,0.5)', color: 'var(--color-accent)' }
            : { borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)' }}
        >
          <Sparkles size={13} /> JARVIS
        </button>
        <button
          onClick={() => setView(view === 'ceo' ? 'mission' : 'ceo')}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-transform duration-150 active:scale-[0.97]"
          style={view === 'ceo'
            ? { background: 'var(--color-accent)', color: '#020617', boxShadow: '0 0 24px rgba(34,211,238,0.35)' }
            : { background: 'var(--color-primary)', color: '#020617' }}
        >
          <Crown size={14} />
          CEO{pendingDecisions > 0 ? ` (${pendingDecisions})` : ''}
        </button>
      </header>

      {alert && (
        <div className="panel px-4 py-2 font-mono text-sm" style={{ color: 'var(--color-warning)' }}>
          ⚠ {alert}
        </div>
      )}
      {state?.sendPaused && view !== 'ceo' && (
        <div className="panel px-4 py-2 font-mono text-sm" style={{ color: 'var(--color-warning)' }}>
          ⚠ {state.sendPaused}
        </div>
      )}

      {view === 'mission' ? (
        <main className="relative" style={{ height: 'calc(100dvh - 130px)', minHeight: 560 }}>
          <SynapseCore onActivate={() => setImmersed(true)} />
          {pendingDecisions > 0 && (
            <button onClick={openCeo}
              className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2.5 rounded-full border px-5 py-2.5 transition-transform duration-150 active:scale-[0.97]"
              style={{
                borderColor: 'rgba(56,189,248,0.4)',
                background: 'rgba(2,6,23,0.72)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 0 32px rgba(14,165,233,0.18)',
              }}>
              <Crown size={14} style={{ color: 'var(--color-accent)' }} />
              <span className="font-display text-sm">
                {pendingDecisions} decision{pendingDecisions === 1 ? '' : 's'} waiting
              </span>
              <span className="font-mono text-[10px] uppercase" style={{ color: 'var(--color-muted-foreground)' }}>
                open console →
              </span>
            </button>
          )}
        </main>
      ) : view === 'ceo' ? (
        <main className="flex-1">
          <CEOCommand
            state={state}
            feed={feed}
            onChanged={refresh}
            onSelectAgent={onSelectRosterAgent}
          />
        </main>
      ) : view === 'pipeline' ? (
        <main className="flex-1">
          <PipelineScreen replyQueue={state?.replyQueue ?? []} onStateChanged={refresh} />
        </main>
      ) : view === 'backlog' ? (
        <main className="flex-1">
          <BacklogScreen />
        </main>
      ) : (
        <main className="flex-1">
          <GrowthScreen />
        </main>
      )}

      {immersed && (
        <ImmersionView
          roster={state?.roster ?? []}
          onSelectAgent={setSelectedAgent}
          onOpenCeo={openCeo}
          onClose={() => setImmersed(false)}
        />
      )}

      {selectedAgent && (
        <AgentDetail agentId={selectedAgent} onClose={() => setSelectedAgent(null)} />
      )}

      {jarvis && <JarvisPanel onChanged={refresh} onClose={() => setJarvis(false)} />}
    </div>
  )
}
