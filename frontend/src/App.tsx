// /**
//  * App.tsx
//  * -------
//  * Root layout: header + two-panel split (60% graph / 40% chat).
//  * Orchestrates state shared between GraphView, ChatPanel, and EntityDrawer.
//  */
//
// import { useState, useCallback } from 'react'
// import { motion } from 'framer-motion'
// import { Network, BarChart3, GitBranch } from 'lucide-react'
// import GraphView from './components/GraphView'
// import ChatPanel from './components/ChatPanel'
// import EntityDrawer from './components/EntityDrawer'
// import AnalyticsPanel from './components/AnalyticsPanel'
// import type { EntityRecord, PanelView } from './types'
//
// export default function App() {
//   const [leftView, setLeftView] = useState<PanelView>('graph')
//   const [selectedEntity, setSelectedEntity] = useState<string | null>(null)
//   const [entityRecords, setEntityRecords] = useState<EntityRecord[]>([])
//   const [highlightedNodes, setHighlightedNodes] = useState<string[]>([])
//
//   const handleNodeSelect = useCallback((entity: string, records: EntityRecord[]) => {
//     setSelectedEntity(entity)
//     setEntityRecords(records)
//   }, [])
//
//   const handleChatData = useCallback((records: EntityRecord[]) => {
//     // When chat returns data, we could highlight relevant nodes
//     // For now just ensure graph is visible
//     setLeftView('graph')
//   }, [])
//
//   return (
//     <div className="flex flex-col h-screen overflow-hidden bg-navy-950">
//       {/* ── Header ────────────────────────────────────────────────────────── */}
//       <motion.header
//         initial={{ opacity: 0, y: -16 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.4 }}
//         className="flex items-center gap-4 px-5 py-3 border-b border-slate-800/60 bg-navy-900/80 backdrop-blur flex-shrink-0 z-10"
//       >
//         {/* Logo */}
//         <div className="flex items-center gap-2.5">
//           <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400/20 to-cyan-600/10 border border-cyan-400/30 flex items-center justify-center glow-cyan">
//             <GitBranch size={14} className="text-cyan-400" />
//           </div>
//           <div>
//             <h1 className="text-sm font-display font-bold text-slate-100 leading-none">
//               O2C Graph Explorer
//             </h1>
//             <p className="text-xs font-mono text-slate-500 leading-tight">SAP Order-to-Cash · ABCD · FY2025</p>
//           </div>
//         </div>
//
//         {/* Left panel view tabs */}
//         <div className="flex items-center gap-1 ml-6 p-1 rounded-lg bg-navy-950/60 border border-slate-800/60">
//           {[
//             { id: 'graph'     as PanelView, label: 'Graph',     icon: Network    },
//             { id: 'analytics' as PanelView, label: 'Analytics', icon: BarChart3  },
//           ].map(({ id, label, icon: Icon }) => (
//             <button key={id} onClick={() => setLeftView(id)}
//               className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
//                 leftView === id
//                   ? 'bg-cyan-400/10 border border-cyan-400/20 text-cyan-400'
//                   : 'text-slate-500 hover:text-slate-300'
//               }`}>
//               <Icon size={11} />
//               {label}
//             </button>
//           ))}
//         </div>
//
//         {/* Status indicators */}
//         <div className="ml-auto flex items-center gap-4">
//           <div className="hidden sm:flex items-center gap-3">
//             {[
//               { label: 'Sales Orders',   count: '100', color: '#22c55e' },
//               { label: 'Billing Docs',   count: '163', color: '#a855f7' },
//               { label: 'Payments',       count: '120', color: '#fb7185' },
//             ].map(({ label, count, color }) => (
//               <div key={label} className="flex items-center gap-1.5">
//                 <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
//                 <span className="text-xs font-mono text-slate-500">{count} {label}</span>
//               </div>
//             ))}
//           </div>
//
//           {/* DB badge */}
//           <div className="px-2.5 py-1 rounded-md border border-slate-800/60 bg-navy-800/40">
//             <span className="text-xs font-mono text-slate-500">SQLite · 4,670 rows</span>
//           </div>
//         </div>
//       </motion.header>
//
//       {/* ── Main Content ───────────────────────────────────────────────────── */}
//       <div className="flex flex-1 min-h-0">
//
//         {/* Left panel — Graph or Analytics */}
//         <motion.div
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ duration: 0.5, delay: 0.1 }}
//           className="relative flex-1 min-w-0 border-r border-slate-800/60"
//         >
//           {leftView === 'graph' ? (
//             <>
//               <GraphView
//                 onNodeSelect={handleNodeSelect}
//                 highlightedNodes={highlightedNodes}
//               />
//               <EntityDrawer
//                 entity={selectedEntity}
//                 records={entityRecords}
//                 onClose={() => setSelectedEntity(null)}
//               />
//             </>
//           ) : (
//             <AnalyticsPanel />
//           )}
//         </motion.div>
//
//         {/* Right panel — Chat */}
//         <motion.div
//           initial={{ opacity: 0, x: 24 }}
//           animate={{ opacity: 1, x: 0 }}
//           transition={{ duration: 0.4, delay: 0.2 }}
//           className="w-[420px] flex-shrink-0 flex flex-col bg-navy-900/50"
//           style={{ borderLeft: '1px solid rgba(30,41,59,0.6)' }}
//         >
//           <ChatPanel onDataReceived={handleChatData} />
//         </motion.div>
//       </div>
//     </div>
//   )
// }
/**
 * App.tsx
 * -------
 * Root layout. Manages dark/light theme and passes theme down to GraphView.
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Network, BarChart3, GitBranch, Sun, Moon } from 'lucide-react'
import { useTheme } from './hooks/useTheme'
import GraphView    from './components/GraphView'
import ChatPanel    from './components/ChatPanel'
import EntityDrawer from './components/EntityDrawer'
import AnalyticsPanel from './components/AnalyticsPanel'
import type { EntityRecord, PanelView } from './types'

export default function App() {
  const { theme, toggle } = useTheme()
  const [leftView,         setLeftView]         = useState<PanelView>('graph')
  const [selectedEntity,   setSelectedEntity]   = useState<string | null>(null)
  const [entityRecords,    setEntityRecords]     = useState<EntityRecord[]>([])
  const [highlightedNodes, setHighlightedNodes] = useState<string[]>([])

  const handleNodeSelect = useCallback((entity: string, records: EntityRecord[]) => {
    setSelectedEntity(entity)
    setEntityRecords(records)
  }, [])

  const handleChatData = useCallback((_records: EntityRecord[]) => {
    setLeftView('graph')
  }, [])

  const isDark = theme === 'dark'

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-4 px-5 py-3 flex-shrink-0 z-10"
        style={{ borderBottom: '1px solid var(--border)', background: `${isDark ? '#0A0F1Ecc' : '#ffffffcc'}`, backdropFilter: 'blur(12px)' }}>

        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center glow-cyan"
            style={{ background: 'color-mix(in srgb, var(--cyan) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--cyan) 30%, transparent)' }}>
            <GitBranch size={14} style={{ color: 'var(--cyan)' }} />
          </div>
          <div>
            <h1 className="text-sm font-display font-bold leading-none" style={{ color: 'var(--text-primary)' }}>
              O2C Graph Explorer
            </h1>
            <p className="text-xs font-mono leading-tight" style={{ color: 'var(--text-muted)' }}>
              SAP Order-to-Cash · ABCD · FY2025
            </p>
          </div>
        </div>

        {/* View tabs */}
        <div className="flex items-center gap-1 ml-6 p-1 rounded-lg"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          {[
            { id: 'graph'     as PanelView, label: 'Graph',     icon: Network   },
            { id: 'analytics' as PanelView, label: 'Analytics', icon: BarChart3 },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setLeftView(id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all"
              style={leftView === id ? {
                background: 'color-mix(in srgb, var(--cyan) 12%, transparent)',
                border: '1px solid color-mix(in srgb, var(--cyan) 25%, transparent)',
                color: 'var(--cyan)',
              } : {
                background: 'transparent', border: '1px solid transparent',
                color: 'var(--text-muted)',
              }}>
              <Icon size={11} /> {label}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-4 ml-4">
          {[
            { label: 'Sales Orders',  count: '100', varName: '--node-order-border'   },
            { label: 'Billing Docs',  count: '163', varName: '--node-billing-border' },
            { label: 'Payments',      count: '120', varName: '--node-payment-border' },
          ].map(({ label, count, varName }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full"
                style={{ background: `var(${varName})` }} />
              <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                {count} {label}
              </span>
            </div>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* DB badge */}
          <div className="px-2.5 py-1 rounded-md"
            style={{ border: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
            <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>SQLite · 4,670 rows</span>
          </div>

          {/* Theme toggle */}
          <motion.button
            onClick={toggle} whileTap={{ scale: 0.9 }}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
            <AnimatedThemeIcon isDark={isDark} />
          </motion.button>
        </div>
      </motion.header>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* Left — Graph or Analytics */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative flex-1 min-w-0"
          style={{ borderRight: '1px solid var(--border)' }}>
          {leftView === 'graph' ? (
            <>
              <GraphView
                theme={theme}
                onNodeSelect={handleNodeSelect}
                highlightedNodes={highlightedNodes}
              />
              <EntityDrawer
                entity={selectedEntity}
                records={entityRecords}
                onClose={() => setSelectedEntity(null)}
              />
            </>
          ) : (
            <AnalyticsPanel />
          )}
        </motion.div>

        {/* Right — Chat */}
        <motion.div
          initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="w-[420px] flex-shrink-0 flex flex-col"
          style={{ borderLeft: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
          <ChatPanel onDataReceived={handleChatData} />
        </motion.div>
      </div>
    </div>
  )
}

// Animated sun/moon swap
function AnimatedThemeIcon({ isDark }: { isDark: boolean }) {
  return (
    <AnimatePresence mode="wait">
      {isDark ? (
        <motion.span key="moon" initial={{ rotate: -30, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 30, opacity: 0 }} transition={{ duration: 0.2 }}>
          <Sun size={14} />
        </motion.span>
      ) : (
        <motion.span key="sun" initial={{ rotate: 30, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -30, opacity: 0 }} transition={{ duration: 0.2 }}>
          <Moon size={14} />
        </motion.span>
      )}
    </AnimatePresence>
  )
}