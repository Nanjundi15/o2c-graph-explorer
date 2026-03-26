// /**
//  * AnalyticsPanel.tsx
//  * ------------------
//  * Pre-built analytics views for the 3 required example queries.
//  * Loaded once, shown in the graph pane when Analytics tab is active.
//  */
//
// import { useEffect, useState } from 'react'
// import { motion } from 'framer-motion'
// import { TrendingUp, AlertCircle, GitBranch, RefreshCw } from 'lucide-react'
// import { fetchTopProducts, fetchBrokenFlows } from '../api'
// import type { EntityRecord } from '../types'
//
// interface BrokenFlows {
//   delivered_not_billed: EntityRecord[]
//   ordered_not_delivered: EntityRecord[]
//   billed_not_posted: EntityRecord[]
//   summary: Record<string, number>
// }
//
// export default function AnalyticsPanel() {
//   const [topProducts, setTopProducts] = useState<EntityRecord[]>([])
//   const [brokenFlows, setBrokenFlows] = useState<BrokenFlows | null>(null)
//   const [loading, setLoading] = useState(true)
//   const [activeTab, setActiveTab] = useState<'products' | 'broken'>('products')
//
//   useEffect(() => {
//     Promise.all([fetchTopProducts(), fetchBrokenFlows()]).then(([p, b]) => {
//       setTopProducts(p.results)
//       setBrokenFlows(b)
//       setLoading(false)
//     })
//   }, [])
//
//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-full">
//         <div className="flex flex-col items-center gap-3">
//           <RefreshCw size={20} className="text-cyan-400 animate-spin" />
//           <p className="text-sm font-mono text-slate-500">Loading analytics…</p>
//         </div>
//       </div>
//     )
//   }
//
//   return (
//     <div className="h-full overflow-y-auto p-5">
//       {/* Tab bar */}
//       <div className="flex gap-2 mb-5">
//         {[
//           { id: 'products' as const, label: 'Top Products', icon: TrendingUp },
//           { id: 'broken'   as const, label: 'Broken Flows', icon: AlertCircle },
//         ].map(({ id, label, icon: Icon }) => (
//           <button key={id} onClick={() => setActiveTab(id)}
//             className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono transition-all ${
//               activeTab === id
//                 ? 'bg-cyan-400/10 border border-cyan-400/30 text-cyan-400'
//                 : 'bg-navy-800/40 border border-slate-800 text-slate-400 hover:text-slate-200'
//             }`}>
//             <Icon size={12} />
//             {label}
//           </button>
//         ))}
//       </div>
//
//       {/* Top Products by Billing */}
//       {activeTab === 'products' && (
//         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
//           <div className="mb-4">
//             <h3 className="text-sm font-display font-semibold text-slate-100 mb-1">Products by Billing Volume</h3>
//             <p className="text-xs font-mono text-slate-500">Number of distinct billing documents per product</p>
//           </div>
//           <div className="space-y-2">
//             {topProducts.slice(0, 15).map((p, i) => {
//               const count = Number(p.billing_document_count)
//               const max = Number(topProducts[0]?.billing_document_count ?? 1)
//               const pct = (count / max) * 100
//               return (
//                 <motion.div key={i}
//                   initial={{ opacity: 0, x: -16 }}
//                   animate={{ opacity: 1, x: 0 }}
//                   transition={{ delay: i * 0.04 }}
//                   className="p-3 rounded-xl border border-slate-800/60 bg-navy-800/40 hover:border-cyan-400/20 hover:bg-cyan-400/5 transition-all"
//                 >
//                   <div className="flex justify-between items-start mb-2">
//                     <div className="flex items-center gap-2">
//                       <span className="text-xs font-mono text-slate-600 w-4">{i + 1}</span>
//                       <div>
//                         <p className="text-xs font-mono text-slate-200 leading-tight">
//                           {String(p.product_name ?? p.product_id).slice(0, 30)}
//                         </p>
//                         <p className="text-xs font-mono text-slate-600">{p.product_id}</p>
//                       </div>
//                     </div>
//                     <div className="text-right">
//                       <p className="text-sm font-mono font-semibold text-cyan-400">{count}</p>
//                       <p className="text-xs font-mono text-slate-500">docs</p>
//                     </div>
//                   </div>
//                   {/* Bar */}
//                   <div className="h-1 rounded-full bg-slate-800/60 overflow-hidden">
//                     <motion.div
//                       initial={{ width: 0 }} animate={{ width: `${pct}%` }}
//                       transition={{ duration: 0.6, delay: i * 0.04 + 0.2 }}
//                       className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-300"
//                     />
//                   </div>
//                   <div className="flex justify-between mt-1">
//                     <span className="text-xs font-mono text-slate-600">
//                       ₹{Number(p.total_billed_amount ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
//                     </span>
//                     <span className="text-xs font-mono text-slate-600">{p.currency}</span>
//                   </div>
//                 </motion.div>
//               )
//             })}
//           </div>
//         </motion.div>
//       )}
//
//       {/* Broken Flows */}
//       {activeTab === 'broken' && brokenFlows && (
//         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
//           {/* Summary cards */}
//           <div className="grid grid-cols-3 gap-3">
//             {[
//               { label: 'Delivered, Not Billed',   count: brokenFlows.summary.delivered_not_billed_count,  color: 'amber' },
//               { label: 'Ordered, No Delivery',     count: brokenFlows.summary.ordered_not_delivered_count, color: 'rose' },
//               { label: 'Billed, No Journal Entry', count: brokenFlows.summary.billed_not_posted_count,     color: 'purple' },
//             ].map(({ label, count, color }) => (
//               <div key={label} className={`p-3 rounded-xl border ${
//                 color === 'amber'  ? 'border-amber-400/20 bg-amber-400/5'
//                 : color === 'rose' ? 'border-rose-400/20 bg-rose-400/5'
//                 : 'border-purple-400/20 bg-purple-400/5'
//               }`}>
//                 <p className={`text-2xl font-display font-bold ${
//                   color === 'amber' ? 'text-amber-400'
//                   : color === 'rose' ? 'text-rose-400'
//                   : 'text-purple-400'
//                 }`}>{count}</p>
//                 <p className="text-xs font-mono text-slate-500 leading-tight mt-1">{label}</p>
//               </div>
//             ))}
//           </div>
//
//           {/* Detail tables */}
//           <BrokenSection
//             title="Delivered — Not Billed"
//             icon={<GitBranch size={12} className="text-amber-400" />}
//             color="amber"
//             records={brokenFlows.delivered_not_billed}
//             keys={['sales_order', 'delivery_document', 'total_net_amount', 'issue']}
//           />
//           <BrokenSection
//             title="Ordered — No Delivery"
//             icon={<AlertCircle size={12} className="text-rose-400" />}
//             color="rose"
//             records={brokenFlows.ordered_not_delivered}
//             keys={['sales_order', 'sold_to_party', 'total_net_amount', 'issue']}
//           />
//         </motion.div>
//       )}
//     </div>
//   )
// }
//
// function BrokenSection({
//   title, icon, color, records, keys,
// }: {
//   title: string
//   icon: React.ReactNode
//   color: 'amber' | 'rose' | 'purple'
//   records: EntityRecord[]
//   keys: string[]
// }) {
//   const colorMap = {
//     amber:  { border: 'border-amber-400/20',  text: 'text-amber-400'  },
//     rose:   { border: 'border-rose-400/20',   text: 'text-rose-400'   },
//     purple: { border: 'border-purple-400/20', text: 'text-purple-400' },
//   }
//   const c = colorMap[color]
//
//   return (
//     <div>
//       <div className={`flex items-center gap-2 mb-2 pb-2 border-b ${c.border}`}>
//         {icon}
//         <h4 className={`text-xs font-display font-semibold ${c.text}`}>{title}</h4>
//         <span className="text-xs font-mono text-slate-600">({records.length})</span>
//       </div>
//       {records.length === 0 ? (
//         <p className="text-xs font-mono text-slate-600">No records found.</p>
//       ) : (
//         <div className="overflow-x-auto rounded-lg border border-slate-800/60">
//           <table className="w-full text-xs font-mono">
//             <thead>
//               <tr className="bg-navy-950/80">
//                 {keys.map(k => (
//                   <th key={k} className="px-3 py-2 text-left text-slate-500 border-b border-slate-800/60 whitespace-nowrap">
//                     {k.replace(/_/g, ' ')}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {records.slice(0, 10).map((r, i) => (
//                 <tr key={i} className="border-b border-slate-800/40 hover:bg-cyan-400/5 transition-colors">
//                   {keys.map(k => (
//                     <td key={k} className="px-3 py-1.5 text-slate-300 whitespace-nowrap">
//                       {r[k] === null ? '—' : String(r[k])}
//                     </td>
//                   ))}
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   )
// }
/**
 * AnalyticsPanel.tsx
 * Pre-built analytics — top products + broken flows.
 * Uses CSS variables for full dark/light theme support.
 */

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, AlertCircle, GitBranch, RefreshCw } from 'lucide-react'
import { fetchTopProducts, fetchBrokenFlows } from '../api'
import type { EntityRecord } from '../types'

interface BrokenFlows {
  delivered_not_billed: EntityRecord[]
  ordered_not_delivered: EntityRecord[]
  billed_not_posted: EntityRecord[]
  summary: Record<string, number>
}

export default function AnalyticsPanel() {
  const [topProducts, setTopProducts] = useState<EntityRecord[]>([])
  const [brokenFlows, setBrokenFlows] = useState<BrokenFlows | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [activeTab,   setActiveTab]   = useState<'products' | 'broken'>('products')

  useEffect(() => {
    Promise.all([fetchTopProducts(), fetchBrokenFlows()]).then(([p, b]) => {
      setTopProducts(p.results)
      setBrokenFlows(b as BrokenFlows)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full gap-3"
        style={{ background: 'var(--bg-base)' }}>
        <RefreshCw size={18} className="animate-spin" style={{ color: 'var(--cyan)' }} />
        <p className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>Loading analytics…</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-5" style={{ background: 'var(--bg-base)' }}>
      {/* Tab bar */}
      <div className="flex gap-2 mb-5">
        {[
          { id: 'products' as const, label: 'Top Products', icon: TrendingUp  },
          { id: 'broken'   as const, label: 'Broken Flows', icon: AlertCircle },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono transition-all"
            style={activeTab === id ? {
              background: 'color-mix(in srgb, var(--cyan) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--cyan) 30%, transparent)',
              color: 'var(--cyan)',
            } : {
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}>
            <Icon size={12} /> {label}
          </button>
        ))}
      </div>

      {/* Top Products */}
      {activeTab === 'products' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="mb-4">
            <h3 className="text-sm font-display font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Products by Billing Volume
            </h3>
            <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
              Number of distinct billing documents per product
            </p>
          </div>
          <div className="space-y-2">
            {topProducts.slice(0, 15).map((p, i) => {
              const count = Number(p.billing_document_count)
              const max   = Number(topProducts[0]?.billing_document_count ?? 1)
              const pct   = (count / max) * 100
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="p-3 rounded-xl transition-all"
                  style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono w-4" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
                      <div>
                        <p className="text-xs font-mono leading-tight" style={{ color: 'var(--text-primary)' }}>
                          {String(p.product_name ?? p.product_id).slice(0, 30)}
                        </p>
                        <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{p.product_id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono font-semibold" style={{ color: 'var(--cyan)' }}>{count}</p>
                      <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>docs</p>
                    </div>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: i * 0.04 + 0.2 }}
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, var(--cyan), #67e8f9)' }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                      ₹{Number(p.total_billed_amount ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{p.currency}</span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Broken Flows */}
      {activeTab === 'broken' && brokenFlows && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Delivered, Not Billed',   count: brokenFlows.summary.delivered_not_billed_count,  color: 'var(--amber)' },
              { label: 'Ordered, No Delivery',     count: brokenFlows.summary.ordered_not_delivered_count, color: 'var(--rose)'  },
              { label: 'Billed, No Journal Entry', count: brokenFlows.summary.billed_not_posted_count,     color: '#a855f7'      },
            ].map(({ label, count, color }) => (
              <div key={label} className="p-3 rounded-xl"
                style={{ border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`, background: `color-mix(in srgb, ${color} 6%, transparent)` }}>
                <p className="text-2xl font-display font-bold" style={{ color }}>{count}</p>
                <p className="text-xs font-mono leading-tight mt-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
              </div>
            ))}
          </div>

          <BrokenSection
            title="Delivered — Not Billed"
            icon={<GitBranch size={12} style={{ color: 'var(--amber)' }} />}
            color="var(--amber)"
            records={brokenFlows.delivered_not_billed}
            keys={['sales_order', 'delivery_document', 'total_net_amount', 'issue']}
          />
          <BrokenSection
            title="Ordered — No Delivery"
            icon={<AlertCircle size={12} style={{ color: 'var(--rose)' }} />}
            color="var(--rose)"
            records={brokenFlows.ordered_not_delivered}
            keys={['sales_order', 'sold_to_party', 'total_net_amount', 'issue']}
          />
        </motion.div>
      )}
    </div>
  )
}

function BrokenSection({ title, icon, color, records, keys }: {
  title: string
  icon: React.ReactNode
  color: string
  records: EntityRecord[]
  keys: string[]
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 pb-2"
        style={{ borderBottom: `1px solid color-mix(in srgb, ${color} 20%, transparent)` }}>
        {icon}
        <h4 className="text-xs font-display font-semibold" style={{ color }}>{title}</h4>
        <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>({records.length})</span>
      </div>
      {records.length === 0 ? (
        <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>No records found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-xs font-mono">
            <thead>
              <tr style={{ background: 'var(--bg-elevated)' }}>
                {keys.map(k => (
                  <th key={k} className="px-3 py-2 text-left whitespace-nowrap"
                    style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                    {k.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.slice(0, 10).map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-surface)' }}>
                  {keys.map(k => (
                    <td key={k} className="px-3 py-1.5 whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                      {r[k] === null ? '—' : String(r[k])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}