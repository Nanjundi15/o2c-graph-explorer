// /**
//  * EntityDrawer.tsx
//  * ----------------
//  * Slide-in drawer showing entity records and metadata
//  * when a node is tapped in the graph.
//  */
//
// import { motion, AnimatePresence } from 'framer-motion'
// import { X, Database } from 'lucide-react'
// import type { EntityRecord } from '../types'
//
// const ENTITY_LABELS: Record<string, string> = {
//   business_partners:           'Customers',
//   sales_order_headers:         'Sales Orders',
//   sales_order_items:           'Order Items',
//   outbound_delivery_headers:   'Deliveries',
//   outbound_delivery_items:     'Delivery Items',
//   billing_document_headers:    'Billing Documents',
//   billing_document_items:      'Billing Items',
//   billing_document_cancellations: 'Cancellations',
//   journal_entry_items:         'Journal Entries',
//   payments:                    'Payments',
//   products:                    'Products',
//   plants:                      'Plants',
// }
//
// interface Props {
//   entity: string | null
//   records: EntityRecord[]
//   onClose: () => void
// }
//
// export default function EntityDrawer({ entity, records, onClose }: Props) {
//   const label = entity ? ENTITY_LABELS[entity] ?? entity : ''
//   const columns = records.length ? Object.keys(records[0]).slice(0, 5) : []
//
//   return (
//     <AnimatePresence>
//       {entity && (
//         <motion.div
//           initial={{ opacity: 0, x: 40 }}
//           animate={{ opacity: 1, x: 0 }}
//           exit={{ opacity: 0, x: 40 }}
//           transition={{ type: 'spring', stiffness: 300, damping: 30 }}
//           className="absolute top-4 right-14 z-20 w-72 rounded-2xl border border-slate-800/80 bg-navy-900/95 backdrop-blur shadow-2xl overflow-hidden"
//           style={{ boxShadow: '0 0 40px #00000066, 0 0 80px #22d3ee11' }}
//         >
//           {/* Header */}
//           <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800/60">
//             <div className="w-6 h-6 rounded-md bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center flex-shrink-0">
//               <Database size={11} className="text-cyan-400" />
//             </div>
//             <div className="flex-1 min-w-0">
//               <h3 className="text-sm font-display font-semibold text-slate-100 truncate">{label}</h3>
//               <p className="text-xs font-mono text-slate-500">{records.length} records</p>
//             </div>
//             <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
//               <X size={14} />
//             </button>
//           </div>
//
//           {/* Records */}
//           <div className="overflow-y-auto max-h-80 p-3 space-y-2">
//             {records.slice(0, 15).map((rec, i) => (
//               <motion.div
//                 key={i}
//                 initial={{ opacity: 0, y: 8 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ delay: i * 0.03 }}
//                 className="p-3 rounded-lg border border-slate-800/60 bg-navy-800/40 hover:border-cyan-400/20 hover:bg-cyan-400/5 transition-all"
//               >
//                 {columns.map(col => (
//                   <div key={col} className="flex justify-between gap-2 text-xs">
//                     <span className="font-mono text-slate-500 truncate">{col.replace(/_/g, ' ')}</span>
//                     <span className="font-mono text-slate-300 truncate max-w-[120px]">
//                       {rec[col] === null ? '—' : String(rec[col])}
//                     </span>
//                   </div>
//                 ))}
//               </motion.div>
//             ))}
//           </div>
//         </motion.div>
//       )}
//     </AnimatePresence>
//   )
// }
/**
 * EntityDrawer.tsx
 * Slide-in drawer showing entity records when a graph node is expanded.
 * Fully theme-aware via CSS variables.
 */

import { motion, AnimatePresence } from 'framer-motion'
import { X, Database } from 'lucide-react'
import type { EntityRecord } from '../types'

const ENTITY_LABELS: Record<string, string> = {
  business_partners:              'Customers',
  sales_order_headers:            'Sales Orders',
  sales_order_items:              'Order Items',
  outbound_delivery_headers:      'Deliveries',
  outbound_delivery_items:        'Delivery Items',
  billing_document_headers:       'Billing Documents',
  billing_document_items:         'Billing Items',
  billing_document_cancellations: 'Cancellations',
  journal_entry_items:            'Journal Entries',
  payments:                       'Payments',
  products:                       'Products',
  plants:                         'Plants',
}

interface Props {
  entity: string | null
  records: EntityRecord[]
  onClose: () => void
}

export default function EntityDrawer({ entity, records, onClose }: Props) {
  const label   = entity ? (ENTITY_LABELS[entity] ?? entity) : ''
  const columns = records.length ? Object.keys(records[0]).slice(0, 5) : []

  return (
    <AnimatePresence>
      {entity && (
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="absolute top-4 right-14 z-20 w-72 rounded-2xl overflow-hidden"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            boxShadow: '0 8px 40px var(--shadow)',
          }}>

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3"
            style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
              style={{
                background: 'color-mix(in srgb, var(--cyan) 10%, transparent)',
                border: '1px solid color-mix(in srgb, var(--cyan) 30%, transparent)',
              }}>
              <Database size={11} style={{ color: 'var(--cyan)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-display font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {label}
              </h3>
              <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                {records.length} records
              </p>
            </div>
            <button onClick={onClose} style={{ color: 'var(--text-muted)' }}
              className="hover:opacity-70 transition-opacity">
              <X size={14} />
            </button>
          </div>

          {/* Records */}
          <div className="overflow-y-auto max-h-80 p-3 space-y-2">
            {records.slice(0, 15).map((rec, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="p-3 rounded-lg transition-all"
                style={{ border: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                {columns.map(col => (
                  <div key={col} className="flex justify-between gap-2 text-xs">
                    <span className="font-mono truncate" style={{ color: 'var(--text-muted)' }}>
                      {col.replace(/_/g, ' ')}
                    </span>
                    <span className="font-mono truncate max-w-[120px]" style={{ color: 'var(--text-primary)' }}>
                      {rec[col] === null ? '—' : String(rec[col])}
                    </span>
                  </div>
                ))}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}