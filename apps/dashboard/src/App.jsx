import { useCallback, useEffect, useRef, useState } from 'react'
import { Zap, Crown, Sparkles } from 'lucide-react'
import { fetchState, openEventStream } from './lib/api.js'
import { SynapseCore } from './components/SynapseCore.jsx'
import { AgentRoster } from './components/AgentRoster.jsx'
import { AgentDetail } from './components/AgentDetail.jsx'
import { ActivityFeed } from './components/ActivityFeed.jsx'
import { KpiTile } from './components/KpiTile.jsx'
import { GrowthScreen } from './components/GrowthScreen.jsx'
import { PipelineScreen } from './components/PipelineScreen.jsx'
import { CEOCommand } from './components/CEOCommand.jsx'
import { ImmersionView } from './components/ImmersionView.jsx'
import { JarvisPanel } from './components/JarvisPanel.jsx'

export default function App() {
  const [state, setState] = useState(null)
  const [feed, setFeed] = useState([])
  const [alert, setAlert] = useState(null)
  const [offline, setOffline] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [showCeo, setShowCeo] = useState(false)
  const [immersed, setImmersed] = useState(false)
  const [jarvis, setJarvis] = useState(false)
  const [view, setView] = useState('mission') // 'mission' | 'pipeline' | 'growth'
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

  // Roster click: the CEO opens the command console (the human's one job);
  // workers open their detail panels.
  const onSelectRosterAgent = useCallback(id => {
    if (id === 'ceo_agent') setShowCeo(true)
    else setSelectedAgent(id)
  }, [])

  const funnel = state?.funnel ?? {}
  const pendingDecisions = (state?.approvals?.length ?? 0) + (state?.replyQueue?.length ?? 0)

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-4 flex flex-col gap-4">
      <div aria-hidden className="bg-fx">
        <div className="nebula nebula--indigo" />
        <div className="nebula nebula--violet" />
        <div className="nebula nebula--teal" />
        <div className="bg-glow bg-glow--core" />
        <div className="bg-glow bg-glow--edge" />
        <div className="starfield" />
        <div className="shooting-star" />
        <div className="shooting-star shooting-star--2" />
        <div className="bg-grid" />
        <div className="scanlines" />
      </div>

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
          {[['mission', 'Mission Control'], ['pipeline', 'Pipeline'], ['growth', 'Growth']].map(([id, label]) => (
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
          onClick={() => setShowCeo(true)}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-transform duration-150 active:scale-[0.97]"
          style={{ background: 'var(--color-primary)', color: '#020617' }}
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
      {state?.sendPaused && (
        <div className="panel px-4 py-2 font-mono text-sm" style={{ color: 'var(--color-warning)' }}>
          ⚠ {state.sendPaused}
        </div>
      )}

      {view === 'mission' ? (
        <main className="grid flex-1 gap-4 lg:grid-cols-[240px_1fr_300px]">
          <AgentRoster roster={state?.roster ?? []} onSelect={onSelectRosterAgent} />
          <div className="flex flex-col gap-4 min-w-0">
            <SynapseCore onActivate={() => setImmersed(true)} />
            {pendingDecisions > 0 && (
              <button onClick={() => setShowCeo(true)}
                className="panel panel--active flex items-center gap-3 px-4 py-3 text-left transition-transform duration-150 active:scale-[0.99]">
                <Crown size={15} style={{ color: 'var(--color-accent)' }} />
                <span className="font-display text-sm">
                  {pendingDecisions} decision{pendingDecisions === 1 ? '' : 's'} waiting in the CEO console
                </span>
                <span className="ml-auto font-mono text-[10px] uppercase" style={{ color: 'var(--color-muted-foreground)' }}>
                  open →
                </span>
              </button>
            )}
          </div>
          <ActivityFeed items={feed} />
        </main>
      ) : view === 'pipeline' ? (
        <main className="flex-1">
          <PipelineScreen replyQueue={state?.replyQueue ?? []} onStateChanged={refresh} />
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
          onOpenCeo={() => setShowCeo(true)}
          onClose={() => setImmersed(false)}
        />
      )}

      {showCeo && (
        <CEOCommand state={state} onChanged={refresh} onClose={() => setShowCeo(false)} />
      )}

      {selectedAgent && (
        <AgentDetail agentId={selectedAgent} onClose={() => setSelectedAgent(null)} />
      )}

      {jarvis && <JarvisPanel onChanged={refresh} onClose={() => setJarvis(false)} />}

      <footer className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <KpiTile label="Pending" value={funnel.pending ?? '–'} />
        <KpiTile label="Drafted" value={funnel.drafted ?? '–'} accent />
        <KpiTile label="Validated" value={funnel.validated ?? '–'} />
        <KpiTile label="Sent / Converted" value={`${funnel.sent ?? 0} / ${funnel.converted ?? 0}`} />
        {state?.mode === 'api' ? (
          <KpiTile
            label="API Spend Today"
            value={`$${(state?.spend.today ?? 0).toFixed(2)}`}
            sub={`cap $${state?.spend.cap ?? '–'} · ${state?.tokens.runs ?? 0} runs`}
          />
        ) : (
          <KpiTile
            label="Engine Cost"
            value="$0.00"
            sub={`${state?.mode === 'claude-code' ? 'Claude subscription' : 'dry-run'} · ${state?.tokens.runs ?? 0} runs · no per-token billing`}
          />
        )}
      </footer>
    </div>
  )
}
