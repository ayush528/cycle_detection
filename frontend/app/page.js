'use client'
import { useState } from 'react'
import TreeView from './components/TreeView'

const EXAMPLE = JSON.stringify([
  "A->B", "A->C", "B->D", "C->E", "E->F",
  "X->Y", "Y->Z", "Z->X",
  "P->Q", "Q->R",
  "G->H", "G->H", "G->I",
  "hello", "1->2", "A->"
], null, 2)

export default function Home() {
  const [input, setInput] = useState(EXAMPLE)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [parseError, setParseError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setError(null)
    setParseError(null)
    setResult(null)

    let parsed
    try {
      parsed = JSON.parse(input)
      if (!Array.isArray(parsed)) throw new Error('Must be a JSON array')
    } catch (e) {
      setParseError(e.message)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/bfhl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: parsed }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setResult(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const trees = result?.hierarchies?.filter(h => !h.has_cycle) ?? []
  const cycles = result?.hierarchies?.filter(h => h.has_cycle) ?? []
  const summary = result?.summary ?? null

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-[#2e2e2e] px-4 sm:px-6 py-4 sticky top-0 bg-[#0f0f0f] z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#3b82f6]" />
            <span className="font-mono text-sm text-[#e8e8e8] tracking-wide">BFHL</span>
            <span className="text-[#2e2e2e] hidden sm:inline">/</span>
            <span className="text-[#6b6b6b] text-sm hidden sm:inline">Graph Hierarchy Analyzer</span>
          </div>
          <span className="text-[#6b6b6b] text-xs font-mono">SRM Full Stack</span>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Two-column layout — stacks on mobile, side by side on lg+ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 items-start">

          {/* LEFT: Input Panel — sticky on desktop */}
          <div className="flex flex-col gap-4 lg:sticky lg:top-20">
            <div>
              <label className="text-xs font-mono text-[#6b6b6b] uppercase tracking-widest">
                Input
              </label>
              <p className="text-[#6b6b6b] text-sm mt-1">
                JSON array of edge strings, e.g.{' '}
                <code className="font-mono text-[#3b82f6] text-xs">["A-&gt;B", "A-&gt;C"]</code>
              </p>
            </div>

            <textarea
              value={input}
              onChange={e => { setInput(e.target.value); setParseError(null) }}
              spellCheck={false}
              rows={12}
              className={`w-full bg-[#1a1a1a] border ${parseError ? 'border-[#ef4444]' : 'border-[#2e2e2e]'} rounded-lg p-4 font-mono text-sm text-[#e8e8e8] resize-y focus:outline-none focus:border-[#3b82f6] transition-colors leading-relaxed`}
              placeholder={'["A->B", "A->C"]'}
            />

            {parseError && (
              <p className="text-xs text-[#ef4444] font-mono -mt-2">! {parseError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={loading || !input.trim()}
                className="flex-1 py-2.5 px-5 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                    Analyzing...
                  </span>
                ) : 'Analyze'}
              </button>
              <button
                onClick={() => { setInput(''); setResult(null); setError(null); setParseError(null) }}
                disabled={loading}
                className="py-2.5 px-4 bg-[#1a1a1a] hover:bg-[#242424] border border-[#2e2e2e] text-[#6b6b6b] hover:text-[#e8e8e8] text-sm rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>

            {error && (
              <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-lg p-4">
                <p className="text-xs font-mono text-[#6b6b6b] uppercase tracking-wide mb-1">API Error</p>
                <p className="text-sm text-[#ef4444]">{error}</p>
              </div>
            )}

            {/* Summary stats */}
            {summary && (
              <div className="grid grid-cols-3 gap-3">
                <StatBox label="Trees" value={summary.total_trees} color="#22c55e" />
                <StatBox label="Cycles" value={summary.total_cycles} color="#a855f7" />
                <StatBox label="Deepest Root" value={summary.largest_tree_root || '-'} color="#3b82f6" mono />
              </div>
            )}
          </div>

          {/* RIGHT: Results Panel — scrolls naturally with the page */}
          <div className="flex flex-col gap-3 min-w-0">
            <div>
              <label className="text-xs font-mono text-[#6b6b6b] uppercase tracking-widest">
                Result
              </label>
              <p className="text-[#6b6b6b] text-sm mt-1">
                {result
                  ? `${result.hierarchies?.length ?? 0} ${result.hierarchies?.length === 1 ? 'hierarchy' : 'hierarchies'} found`
                  : 'Submit a request to see results'}
              </p>
            </div>

            {!result && !loading && (
              <div className="flex items-center justify-center border border-dashed border-[#2e2e2e] rounded-lg h-48">
                <p className="text-[#3a3a3a] text-sm font-mono">no data yet</p>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center h-48">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-2 border-[#2e2e2e] border-t-[#3b82f6] rounded-full animate-spin" />
                  <p className="text-[#6b6b6b] text-xs font-mono">processing...</p>
                </div>
              </div>
            )}

            {result && (
              <>
                {trees.map((h, i) => (
                  <HierarchyPanel key={`tree-${i}`} h={h} type="tree" />
                ))}
                {cycles.map((h, i) => (
                  <HierarchyPanel key={`cycle-${i}`} h={h} type="cycle" />
                ))}
                {result.invalid_entries?.length > 0 && (
                  <TokenList label="Invalid Entries" items={result.invalid_entries} color="#ef4444" />
                )}
                {result.duplicate_edges?.length > 0 && (
                  <TokenList label="Duplicate Edges" items={result.duplicate_edges} color="#f59e0b" />
                )}
              </>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}

function StatBox({ label, value, color, mono = false }) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg p-3">
      <p className="text-[#6b6b6b] text-xs mb-1">{label}</p>
      <p className={`text-xl font-semibold ${mono ? 'font-mono' : ''}`} style={{ color }}>{value}</p>
    </div>
  )
}

function HierarchyPanel({ h, type }) {
  const [open, setOpen] = useState(true)
  const isCycle = type === 'cycle'

  return (
    <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#242424] transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`w-1.5 h-1.5 rounded-full ${isCycle ? 'bg-[#a855f7]' : 'bg-[#22c55e]'}`} />
          <span className="font-mono text-sm text-[#e8e8e8]">{h.root}</span>
          <span className={`text-xs px-2 py-0.5 rounded font-mono ${isCycle ? 'bg-[#a855f7]/10 text-[#a855f7] border border-[#a855f7]/20' : 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20'}`}>
            {isCycle ? 'cycle' : `depth ${h.depth}`}
          </span>
        </div>
        <span className="text-[#3a3a3a] text-xs font-mono">{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-[#2e2e2e]">
          {isCycle ? (
            <p className="text-xs text-[#6b6b6b] font-mono italic pt-2">Cyclic structure — no tree representation</p>
          ) : (
            <div className="pt-2">
              <TreeView tree={h.tree} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TokenList({ label, items, color }) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg p-4">
      <p className="text-xs font-mono text-[#6b6b6b] uppercase tracking-widest mb-3">
        {label} <span className="text-[#3a3a3a]">({items.length})</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span
            key={i}
            className="font-mono text-xs px-2.5 py-1 rounded border"
            style={{ color, borderColor: `${color}30`, background: `${color}10` }}
          >
            {item === '' ? <span style={{ opacity: 0.6, fontStyle: 'italic' }}>(empty string)</span> : item}
          </span>
        ))}
      </div>
    </div>
  )
}
