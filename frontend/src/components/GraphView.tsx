// // /**
// //  * GraphView.tsx
// //  * -------------
// //  * Interactive graph visualization using Cytoscape.js with fCoSE layout.
// //  * Nodes are colored by entity type, glow on hover/select.
// //  * Clicking a node expands it to show individual records.
// //  */
// //
// // import { useEffect, useRef, useState, useCallback } from 'react'
// // import cytoscape from 'cytoscape'
// // // @ts-ignore — fcose has no TS types
// // import fcose from 'cytoscape-fcose'
// // import { motion, AnimatePresence } from 'framer-motion'
// // import { ZoomIn, ZoomOut, Maximize2, RefreshCw, ChevronRight } from 'lucide-react'
// // import { fetchGraphOverview, fetchEntityRecords } from '../api'
// // import type { GraphNode, GraphOverview, EntityRecord } from '../types'
// //
// // cytoscape.use(fcose)
// //
// // // ── Node color palette by entity category ────────────────────────────────────
// // const NODE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
// //   business_partners:           { bg: '#1e3a5f', border: '#3b82f6', text: '#93c5fd' },
// //   sales_order_headers:         { bg: '#1a3a2a', border: '#22c55e', text: '#86efac' },
// //   sales_order_items:           { bg: '#1a3a2a', border: '#16a34a', text: '#6ee7b7' },
// //   outbound_delivery_headers:   { bg: '#2d2a1e', border: '#f59e0b', text: '#fcd34d' },
// //   outbound_delivery_items:     { bg: '#2d2a1e', border: '#d97706', text: '#fde68a' },
// //   billing_document_headers:    { bg: '#2a1e3a', border: '#a855f7', text: '#d8b4fe' },
// //   billing_document_items:      { bg: '#2a1e3a', border: '#9333ea', text: '#c4b5fd' },
// //   journal_entry_items:         { bg: '#1e2d3a', border: '#22d3ee', text: '#67e8f9' },
// //   payments:                    { bg: '#3a1e1e', border: '#fb7185', text: '#fda4af' },
// //   products:                    { bg: '#2a2a1e', border: '#84cc16', text: '#bef264' },
// //   plants:                      { bg: '#1e2a2a', border: '#2dd4bf', text: '#99f6e4' },
// // }
// //
// // const DEFAULT_COLOR = { bg: '#1e2235', border: '#475569', text: '#94a3b8' }
// //
// // interface Props {
// //   onNodeSelect: (entity: string, records: EntityRecord[]) => void
// //   highlightedNodes?: string[]
// // }
// //
// // export default function GraphView({ onNodeSelect, highlightedNodes = [] }: Props) {
// //   const containerRef = useRef<HTMLDivElement>(null)
// //   const cyRef = useRef<cytoscape.Core | null>(null)
// //   const [overview, setOverview] = useState<GraphOverview | null>(null)
// //   const [loading, setLoading] = useState(true)
// //   const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
// //   const [tooltip, setTooltip] = useState<{ label: string; count: number; x: number; y: number } | null>(null)
// //
// //   // ── Load overview graph ────────────────────────────────────────────────────
// //   useEffect(() => {
// //     fetchGraphOverview().then(data => {
// //       setOverview(data)
// //       setLoading(false)
// //     })
// //   }, [])
// //
// //   // ── Initialize / re-init Cytoscape when data arrives ──────────────────────
// //   useEffect(() => {
// //     if (!overview || !containerRef.current) return
// //
// //     const elements = buildElements(overview)
// //
// //     if (cyRef.current) cyRef.current.destroy()
// //
// //     const cy = cytoscape({
// //       container: containerRef.current,
// //       elements,
// //       style: cytoscapeStyles(),
// //       layout: {
// //         name: 'fcose',
// //         animate: true,
// //         animationDuration: 800,
// //         animationEasing: 'ease-out',
// //         idealEdgeLength: 180,
// //         nodeRepulsion: 8000,
// //         gravity: 0.25,
// //         numIter: 2500,
// //       } as cytoscape.LayoutOptions,
// //       wheelSensitivity: 0.3,
// //     })
// //
// //     cyRef.current = cy
// //
// //     // Hover tooltip
// //     cy.on('mouseover', 'node', (e) => {
// //       const node = e.target
// //       const pos = node.renderedPosition()
// //       setTooltip({
// //         label: node.data('label'),
// //         count: node.data('count'),
// //         x: pos.x,
// //         y: pos.y,
// //       })
// //       node.style('border-width', 3)
// //     })
// //
// //     cy.on('mouseout', 'node', (e) => {
// //       setTooltip(null)
// //       e.target.style('border-width', 2)
// //     })
// //
// //     // Click — expand node to show records
// //     cy.on('tap', 'node', async (e) => {
// //       const nodeId: string = e.target.data('id')
// //       const nodeType: string = e.target.data('type')
// //
// //       if (nodeType === 'record') return // already an individual record node
// //
// //       // Visual feedback — pulse
// //       e.target.animate({ style: { 'border-width': 5 } } as cytoscape.AnimationOptions, { duration: 150 })
// //       e.target.animate({ style: { 'border-width': 2 } } as cytoscape.AnimationOptions, { duration: 150 })
// //
// //       if (!expandedNodes.has(nodeId)) {
// //         setExpandedNodes(prev => new Set([...prev, nodeId]))
// //         await expandEntity(cy, nodeId, onNodeSelect)
// //       } else {
// //         // Second click — collapse
// //         cy.remove(`[parent = "${nodeId}"]`)
// //         cy.remove(`node[type = "record"][entityType = "${nodeId}"]`)
// //         cy.remove(`edge[type = "record-edge"][entityType = "${nodeId}"]`)
// //         setExpandedNodes(prev => { const s = new Set(prev); s.delete(nodeId); return s })
// //       }
// //     })
// //
// //     return () => cy.destroy()
// //   }, [overview]) // eslint-disable-line
// //
// //   // ── Highlight nodes mentioned in chat responses ────────────────────────────
// //   useEffect(() => {
// //     const cy = cyRef.current
// //     if (!cy) return
// //     cy.nodes().style({ 'border-color': (ele: cytoscape.NodeSingular) => {
// //       const c = NODE_COLORS[ele.data('type')] ?? DEFAULT_COLOR
// //       return c.border
// //     }})
// //     highlightedNodes.forEach(id => {
// //       const node = cy.$(`#${id}`)
// //       if (node.length) {
// //         node.style({ 'border-color': '#fbbf24', 'border-width': 4 })
// //         cy.animate({ fit: { eles: node, padding: 80 } } as cytoscape.AnimateOptions, { duration: 600 })
// //       }
// //     })
// //   }, [highlightedNodes])
// //
// //   // ── Controls ──────────────────────────────────────────────────────────────
// //   const zoomIn  = () => cyRef.current?.zoom({ level: (cyRef.current.zoom() * 1.3), renderedPosition: { x: 400, y: 300 } })
// //   const zoomOut = () => cyRef.current?.zoom({ level: (cyRef.current.zoom() * 0.75), renderedPosition: { x: 400, y: 300 } })
// //   const fit     = () => cyRef.current?.fit(undefined, 40)
// //   const reset   = () => { setExpandedNodes(new Set()); if (overview) setOverview({ ...overview }) }
// //
// //   return (
// //     <div className="relative w-full h-full scan-lines">
// //       {/* Background grid */}
// //       <div className="absolute inset-0 opacity-5"
// //         style={{ backgroundImage: 'linear-gradient(#22d3ee 1px, transparent 1px), linear-gradient(90deg, #22d3ee 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
// //
// //       {/* Loading */}
// //       <AnimatePresence>
// //         {loading && (
// //           <motion.div
// //             initial={{ opacity: 1 }} exit={{ opacity: 0 }}
// //             className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4"
// //           >
// //             <div className="flex gap-2">
// //               {[0,1,2,3].map(i => (
// //                 <motion.div key={i} className="w-2 h-2 rounded-full bg-cyan-400"
// //                   animate={{ y: [0, -12, 0] }}
// //                   transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
// //               ))}
// //             </div>
// //             <p className="font-mono text-sm text-cyan-400/60">Constructing graph…</p>
// //           </motion.div>
// //         )}
// //       </AnimatePresence>
// //
// //       {/* Cytoscape container */}
// //       <div ref={containerRef} id="cy" className="w-full h-full" />
// //
// //       {/* Tooltip */}
// //       <AnimatePresence>
// //         {tooltip && (
// //           <motion.div
// //             initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
// //             className="absolute pointer-events-none z-20 px-3 py-2 rounded-lg border text-xs font-mono"
// //             style={{
// //               left: tooltip.x + 16, top: tooltip.y - 40,
// //               background: 'rgba(10,15,30,0.95)',
// //               borderColor: '#22d3ee44',
// //               color: '#22d3ee',
// //             }}
// //           >
// //             <div className="font-semibold">{tooltip.label}</div>
// //             <div className="text-slate-400">{tooltip.count.toLocaleString()} records</div>
// //           </motion.div>
// //         )}
// //       </AnimatePresence>
// //
// //       {/* Controls */}
// //       <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
// //         {[
// //           { icon: ZoomIn,    fn: zoomIn,  title: 'Zoom in' },
// //           { icon: ZoomOut,   fn: zoomOut, title: 'Zoom out' },
// //           { icon: Maximize2, fn: fit,     title: 'Fit view' },
// //           { icon: RefreshCw, fn: reset,   title: 'Reset' },
// //         ].map(({ icon: Icon, fn, title }) => (
// //           <button key={title} onClick={fn} title={title}
// //             className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-700 bg-navy-900/80 text-slate-400 hover:text-cyan-400 hover:border-cyan-400/50 transition-colors backdrop-blur">
// //             <Icon size={14} />
// //           </button>
// //         ))}
// //       </div>
// //
// //       {/* Legend */}
// //       <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 p-3 rounded-xl border border-slate-800/60 bg-navy-900/80 backdrop-blur">
// //         <p className="text-xs font-display font-semibold text-slate-500 mb-1 uppercase tracking-widest">O2C Flow</p>
// //         {[
// //           { label: 'Customer',  color: '#3b82f6' },
// //           { label: 'Sales Order', color: '#22c55e' },
// //           { label: 'Delivery',  color: '#f59e0b' },
// //           { label: 'Billing',   color: '#a855f7' },
// //           { label: 'Accounting',color: '#22d3ee' },
// //           { label: 'Payment',   color: '#fb7185' },
// //           { label: 'Product',   color: '#84cc16' },
// //           { label: 'Plant',     color: '#2dd4bf' },
// //         ].map(({ label, color }) => (
// //           <div key={label} className="flex items-center gap-2">
// //             <div className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}88` }} />
// //             <span className="text-xs font-mono text-slate-400">{label}</span>
// //           </div>
// //         ))}
// //         <div className="mt-2 pt-2 border-t border-slate-800 flex items-center gap-1 text-xs text-slate-500 font-mono">
// //           <ChevronRight size={10} />
// //           Click node to expand
// //         </div>
// //       </div>
// //     </div>
// //   )
// // }
// //
// // // ── Helpers ───────────────────────────────────────────────────────────────────
// //
// // function buildElements(overview: GraphOverview): cytoscape.ElementDefinition[] {
// //   const nodes: cytoscape.ElementDefinition[] = overview.nodes.map(n => ({
// //     data: {
// //       id: n.id,
// //       label: n.label.replace(' Headers', '').replace(' Items', ' Items'),
// //       count: n.count,
// //       type: n.type,
// //     },
// //   }))
// //
// //   const edges: cytoscape.ElementDefinition[] = overview.edges.map((e, i) => ({
// //     data: {
// //       id: `edge-${i}`,
// //       source: e.source,
// //       target: e.target,
// //       label: e.label,
// //     },
// //   }))
// //
// //   return [...nodes, ...edges]
// // }
// //
// // async function expandEntity(
// //   cy: cytoscape.Core,
// //   entityId: string,
// //   onNodeSelect: (entity: string, records: EntityRecord[]) => void
// // ) {
// //   try {
// //     const { records } = await fetchEntityRecords(entityId, 12)
// //     onNodeSelect(entityId, records)
// //
// //     const color = NODE_COLORS[entityId] ?? DEFAULT_COLOR
// //
// //     // Determine primary key field
// //     const pkField = getPrimaryKey(entityId)
// //
// //     records.slice(0, 12).forEach((rec, i) => {
// //       const recId = `${entityId}-rec-${i}`
// //       const label = String(rec[pkField] ?? `#${i + 1}`).slice(0, 16)
// //
// //       cy.add({
// //         data: {
// //           id: recId,
// //           label,
// //           type: 'record',
// //           entityType: entityId,
// //           fullRecord: rec,
// //         },
// //       })
// //
// //       cy.add({
// //         data: {
// //           id: `edge-rec-${entityId}-${i}`,
// //           source: entityId,
// //           target: recId,
// //           type: 'record-edge',
// //           entityType: entityId,
// //         },
// //       })
// //
// //       // Style record nodes
// //       cy.$(`#${recId}`).style({
// //         'background-color': color.bg,
// //         'border-color': color.border,
// //         'border-width': 1,
// //         'border-opacity': 0.6,
// //         'color': color.text,
// //         width: 80,
// //         height: 30,
// //         shape: 'roundrectangle',
// //         'font-size': '9px',
// //         'text-valign': 'center',
// //         'text-halign': 'center',
// //       })
// //     })
// //
// //     cy.layout({
// //       name: 'fcose',
// //       animate: true,
// //       animationDuration: 600,
// //       fit: false,
// //     } as cytoscape.LayoutOptions).run()
// //
// //   } catch (err) {
// //     console.error('Failed to expand entity', entityId, err)
// //   }
// // }
// //
// // function getPrimaryKey(entity: string): string {
// //   const PKS: Record<string, string> = {
// //     business_partners:          'business_partner',
// //     sales_order_headers:        'sales_order',
// //     sales_order_items:          'sales_order',
// //     outbound_delivery_headers:  'delivery_document',
// //     outbound_delivery_items:    'delivery_document',
// //     billing_document_headers:   'billing_document',
// //     billing_document_items:     'billing_document',
// //     journal_entry_items:        'accounting_document',
// //     payments:                   'accounting_document',
// //     products:                   'product',
// //     plants:                     'plant',
// //   }
// //   return PKS[entity] ?? 'id'
// // }
// //
// // function cytoscapeStyles(): cytoscape.Stylesheet[] {
// //   return [
// //     {
// //       selector: 'node[type != "record"]',
// //       style: {
// //         'background-color': (ele: cytoscape.NodeSingular) => (NODE_COLORS[ele.data('type')] ?? DEFAULT_COLOR).bg,
// //         'border-color':      (ele: cytoscape.NodeSingular) => (NODE_COLORS[ele.data('type')] ?? DEFAULT_COLOR).border,
// //         'border-width': 2,
// //         'border-style': 'solid',
// //         'color':        (ele: cytoscape.NodeSingular) => (NODE_COLORS[ele.data('type')] ?? DEFAULT_COLOR).text,
// //         'label': 'data(label)',
// //         'text-valign': 'center',
// //         'text-halign': 'center',
// //         'font-family': '"JetBrains Mono", monospace',
// //         'font-size': '11px',
// //         'font-weight': 500,
// //         'text-wrap': 'wrap',
// //         'text-max-width': '100px',
// //         width: 110,
// //         height: 50,
// //         shape: 'roundrectangle',
// //         'background-opacity': 0.9,
// //         'shadow-blur': 20,
// //         'shadow-color': (ele: cytoscape.NodeSingular) => (NODE_COLORS[ele.data('type')] ?? DEFAULT_COLOR).border,
// //         'shadow-opacity': 0.4,
// //         'shadow-offset-x': 0,
// //         'shadow-offset-y': 0,
// //         'transition-property': 'border-color, border-width, shadow-blur',
// //         'transition-duration': 200,
// //       } as cytoscape.Css.Node,
// //     },
// //     {
// //       selector: 'node:selected',
// //       style: {
// //         'border-width': 3,
// //         'shadow-blur': 30,
// //         'shadow-opacity': 0.8,
// //       } as cytoscape.Css.Node,
// //     },
// //     {
// //       selector: 'edge',
// //       style: {
// //         'line-color': '#1e293b',
// //         'target-arrow-color': '#334155',
// //         'target-arrow-shape': 'triangle',
// //         'curve-style': 'bezier',
// //         width: 1.5,
// //         'arrow-scale': 0.8,
// //         opacity: 0.7,
// //         'font-family': '"JetBrains Mono", monospace',
// //         'font-size': '9px',
// //         color: '#475569',
// //       } as cytoscape.Css.Edge,
// //     },
// //     {
// //       selector: 'edge[type = "record-edge"]',
// //       style: {
// //         'line-color': '#1e293b',
// //         'line-style': 'dashed',
// //         'line-dash-pattern': [4, 3],
// //         width: 1,
// //         opacity: 0.4,
// //         'target-arrow-shape': 'none',
// //       } as cytoscape.Css.Edge,
// //     },
// //   ]
// // }
// /**
//  * GraphView.tsx
//  * -------------
//  * Interactive Cytoscape.js graph. Node colors read from CSS variables
//  * so they automatically adapt to dark/light theme.
//  */
//
// // import { useEffect, useRef, useState, useCallback } from 'react'
// // import cytoscape from 'cytoscape'
// // // @ts-ignore
// // import fcose from 'cytoscape-fcose'
// // import { motion, AnimatePresence } from 'framer-motion'
// // import { ZoomIn, ZoomOut, Maximize2, RefreshCw, ChevronRight } from 'lucide-react'
// // import { fetchGraphOverview, fetchEntityRecords } from '../api'
// // import type { GraphOverview, EntityRecord } from '../types'
// // import type { Theme } from '../hooks/useTheme'
// //
// // cytoscape.use(fcose)
// //
// // // Map entity → CSS variable names defined in index.css
// // const ENTITY_CSS: Record<string, { bg: string; border: string }> = {
// //   business_partners:           { bg: '--node-customer-bg',   border: '--node-customer-border'   },
// //   sales_order_headers:         { bg: '--node-order-bg',      border: '--node-order-border'      },
// //   sales_order_items:           { bg: '--node-order-bg',      border: '--node-order-border'      },
// //   outbound_delivery_headers:   { bg: '--node-delivery-bg',   border: '--node-delivery-border'   },
// //   outbound_delivery_items:     { bg: '--node-delivery-bg',   border: '--node-delivery-border'   },
// //   billing_document_headers:    { bg: '--node-billing-bg',    border: '--node-billing-border'    },
// //   billing_document_items:      { bg: '--node-billing-bg',    border: '--node-billing-border'    },
// //   billing_document_cancellations: { bg: '--node-billing-bg', border: '--node-billing-border'   },
// //   journal_entry_items:         { bg: '--node-accounting-bg', border: '--node-accounting-border' },
// //   payments:                    { bg: '--node-payment-bg',    border: '--node-payment-border'    },
// //   products:                    { bg: '--node-product-bg',    border: '--node-product-border'    },
// //   plants:                      { bg: '--node-plant-bg',      border: '--node-plant-border'      },
// // }
// //
// // // Legend config — static colors that work on both themes
// // const LEGEND = [
// //   { label: 'Customer',   varName: '--node-customer-border'   },
// //   { label: 'Sales Order',varName: '--node-order-border'      },
// //   { label: 'Delivery',   varName: '--node-delivery-border'   },
// //   { label: 'Billing',    varName: '--node-billing-border'    },
// //   { label: 'Accounting', varName: '--node-accounting-border' },
// //   { label: 'Payment',    varName: '--node-payment-border'    },
// //   { label: 'Product',    varName: '--node-product-border'    },
// //   { label: 'Plant',      varName: '--node-plant-border'      },
// // ]
// //
// // function getCssVar(name: string): string {
// //   return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
// // }
// //
// // function getNodeColors(entityType: string) {
// //   const css = ENTITY_CSS[entityType]
// //   if (!css) return { bg: getCssVar('--bg-card'), border: getCssVar('--border') }
// //   return { bg: getCssVar(css.bg), border: getCssVar(css.border) }
// // }
// //
// // interface Props {
// //   theme: Theme
// //   onNodeSelect: (entity: string, records: EntityRecord[]) => void
// //   highlightedNodes?: string[]
// // }
// //
// // export default function GraphView({ theme, onNodeSelect, highlightedNodes = [] }: Props) {
// //   const containerRef   = useRef<HTMLDivElement>(null)
// //   const cyRef          = useRef<cytoscape.Core | null>(null)
// //   const [overview,     setOverview]     = useState<GraphOverview | null>(null)
// //   const [loading,      setLoading]      = useState(true)
// //   const [expandedNodes,setExpandedNodes]= useState<Set<string>>(new Set())
// //   const [tooltip,      setTooltip]      = useState<{ label: string; count: number; x: number; y: number } | null>(null)
// //
// //   // Load overview once
// //   useEffect(() => {
// //     fetchGraphOverview().then(d => { setOverview(d); setLoading(false) })
// //   }, [])
// //
// //   // Re-init Cytoscape when data or theme changes (colors need refresh)
// //   useEffect(() => {
// //     if (!overview || !containerRef.current) return
// //     if (cyRef.current) cyRef.current.destroy()
// //
// //     const cy = cytoscape({
// //       container: containerRef.current,
// //       elements:  buildElements(overview),
// //       style:     buildStyles(),
// //       layout: {
// //         name: 'fcose', animate: true, animationDuration: 800,
// //         animationEasing: 'ease-out', idealEdgeLength: 180,
// //         nodeRepulsion: 8000, gravity: 0.25, numIter: 2500,
// //       } as cytoscape.LayoutOptions,
// //       wheelSensitivity: 0.3,
// //     })
// //
// //     cyRef.current = cy
// //
// //     cy.on('mouseover', 'node', (e) => {
// //       const pos = e.target.renderedPosition()
// //       setTooltip({ label: e.target.data('label'), count: e.target.data('count'), x: pos.x, y: pos.y })
// //       e.target.style('border-width', 3)
// //     })
// //     cy.on('mouseout', 'node', (e) => {
// //       setTooltip(null)
// //       e.target.style('border-width', 2)
// //     })
// //     cy.on('tap', 'node', async (e) => {
// //       const nodeId: string = e.target.data('id')
// //       if (e.target.data('type') === 'record') return
// //
// //       e.target.animate({ style: { 'border-width': 5 } } as cytoscape.AnimationOptions, { duration: 120 })
// //       e.target.animate({ style: { 'border-width': 2 } } as cytoscape.AnimationOptions, { duration: 120 })
// //
// //       if (!expandedNodes.has(nodeId)) {
// //         setExpandedNodes(prev => new Set([...prev, nodeId]))
// //         await expandEntity(cy, nodeId, onNodeSelect)
// //       } else {
// //         cy.remove(`node[type = "record"][entityType = "${nodeId}"]`)
// //         cy.remove(`edge[type = "record-edge"][entityType = "${nodeId}"]`)
// //         setExpandedNodes(prev => { const s = new Set(prev); s.delete(nodeId); return s })
// //       }
// //     })
// //
// //     return () => cy.destroy()
// //   }, [overview, theme]) // Re-init on theme change
// //
// //   // Highlight nodes from chat
// //   useEffect(() => {
// //     const cy = cyRef.current
// //     if (!cy) return
// //     cy.nodes().forEach((node: cytoscape.NodeSingular) => {
// //       const { border } = getNodeColors(node.data('type'))
// //       node.style('border-color', border)
// //     })
// //     highlightedNodes.forEach(id => {
// //       const node = cy.$(`#${id}`)
// //       if (node.length) {
// //         node.style({ 'border-color': getCssVar('--amber'), 'border-width': 4 })
// //         cy.animate({ fit: { eles: node, padding: 80 } } as cytoscape.AnimateOptions, { duration: 600 })
// //       }
// //     })
// //   }, [highlightedNodes])
// //
// //   const zoomIn  = () => cyRef.current?.zoom({ level: cyRef.current.zoom() * 1.3, renderedPosition: { x: 400, y: 300 } })
// //   const zoomOut = () => cyRef.current?.zoom({ level: cyRef.current.zoom() * 0.75, renderedPosition: { x: 400, y: 300 } })
// //   const fit     = () => cyRef.current?.fit(undefined, 40)
// //   const reset   = () => { setExpandedNodes(new Set()); if (overview) setOverview({ ...overview }) }
// //
// //   const isDark = theme === 'dark'
// //
// //   return (
// //     <div className="relative w-full h-full scan-lines">
// //       {/* Grid background */}
// //       <div className="absolute inset-0 opacity-5 pointer-events-none"
// //         style={{
// //           backgroundImage: `linear-gradient(${getCssVar('--graph-grid')} 1px, transparent 1px), linear-gradient(90deg, ${getCssVar('--graph-grid')} 1px, transparent 1px)`,
// //           backgroundSize: '48px 48px',
// //         }} />
// //
// //       {/* Loading */}
// //       <AnimatePresence>
// //         {loading && (
// //           <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }}
// //             className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4">
// //             <div className="flex gap-2">
// //               {[0,1,2,3].map(i => (
// //                 <motion.div key={i} className="w-2 h-2 rounded-full" style={{ background: getCssVar('--cyan') }}
// //                   animate={{ y: [0,-12,0] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
// //               ))}
// //             </div>
// //             <p className="font-mono text-sm" style={{ color: getCssVar('--cyan') }}>Constructing graph…</p>
// //           </motion.div>
// //         )}
// //       </AnimatePresence>
// //
// //       <div ref={containerRef} id="cy" className="w-full h-full" />
// //
// //       {/* Tooltip */}
// //       <AnimatePresence>
// //         {tooltip && (
// //           <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
// //             className="absolute pointer-events-none z-20 px-3 py-2 rounded-lg border text-xs font-mono"
// //             style={{
// //               left: tooltip.x + 16, top: tooltip.y - 40,
// //               background: getCssVar('--bg-surface'),
// //               borderColor: getCssVar('--border'),
// //               color: getCssVar('--cyan'),
// //               boxShadow: `0 4px 20px ${getCssVar('--shadow')}`,
// //             }}>
// //             <div className="font-semibold">{tooltip.label}</div>
// //             <div style={{ color: getCssVar('--text-secondary') }}>{tooltip.count.toLocaleString()} records</div>
// //           </motion.div>
// //         )}
// //       </AnimatePresence>
// //
// //       {/* Controls */}
// //       <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
// //         {[
// //           { icon: ZoomIn,    fn: zoomIn,  title: 'Zoom in' },
// //           { icon: ZoomOut,   fn: zoomOut, title: 'Zoom out' },
// //           { icon: Maximize2, fn: fit,     title: 'Fit view' },
// //           { icon: RefreshCw, fn: reset,   title: 'Reset' },
// //         ].map(({ icon: Icon, fn, title }) => (
// //           <button key={title} onClick={fn} title={title}
// //             className="w-8 h-8 flex items-center justify-center rounded-lg backdrop-blur transition-colors"
// //             style={{
// //               background: getCssVar('--bg-surface'),
// //               border: `1px solid ${getCssVar('--border')}`,
// //               color: getCssVar('--text-secondary'),
// //             }}
// //             onMouseEnter={e => (e.currentTarget.style.color = getCssVar('--cyan'))}
// //             onMouseLeave={e => (e.currentTarget.style.color = getCssVar('--text-secondary'))}>
// //             <Icon size={14} />
// //           </button>
// //         ))}
// //       </div>
// //
// //       {/* Legend */}
// //       <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 p-3 rounded-xl backdrop-blur"
// //         style={{ background: `${getCssVar('--bg-surface')}cc`, border: `1px solid ${getCssVar('--border')}` }}>
// //         <p className="text-xs font-display font-semibold uppercase tracking-widest mb-1"
// //           style={{ color: getCssVar('--text-muted') }}>O2C Flow</p>
// //         {LEGEND.map(({ label, varName }) => (
// //           <div key={label} className="flex items-center gap-2">
// //             <div className="w-2 h-2 rounded-full flex-shrink-0"
// //               style={{ background: getCssVar(varName), boxShadow: isDark ? `0 0 6px ${getCssVar(varName)}88` : 'none' }} />
// //             <span className="text-xs font-mono" style={{ color: getCssVar('--text-secondary') }}>{label}</span>
// //           </div>
// //         ))}
// //         <div className="mt-2 pt-2 flex items-center gap-1 text-xs font-mono"
// //           style={{ borderTop: `1px solid ${getCssVar('--border')}`, color: getCssVar('--text-muted') }}>
// //           <ChevronRight size={10} />
// //           Click node to expand
// //         </div>
// //       </div>
// //     </div>
// //   )
// // }
// //
// // // ── Helpers ───────────────────────────────────────────────────────────────────
// //
// // function buildElements(overview: GraphOverview): cytoscape.ElementDefinition[] {
// //   return [
// //     ...overview.nodes.map(n => ({
// //       data: { id: n.id, label: n.label.replace(' Headers','').replace(' Items',' Items'), count: n.count, type: n.type },
// //     })),
// //     ...overview.edges.map((e, i) => ({
// //       data: { id: `edge-${i}`, source: e.source, target: e.target, label: e.label },
// //     })),
// //   ]
// // }
// //
// // function buildStyles(): cytoscape.Stylesheet[] {
// //   return [
// //     {
// //       selector: 'node[type != "record"]',
// //       style: {
// //         'background-color': (ele: cytoscape.NodeSingular) => getNodeColors(ele.data('type')).bg,
// //         'border-color':     (ele: cytoscape.NodeSingular) => getNodeColors(ele.data('type')).border,
// //         'border-width': 2,
// //         'color':  getCssVar('--text-primary'),
// //         'label':  'data(label)',
// //         'text-valign': 'center', 'text-halign': 'center',
// //         'font-family': '"JetBrains Mono", monospace',
// //         'font-size': '11px', 'font-weight': 500,
// //         'text-wrap': 'wrap', 'text-max-width': '100px',
// //         width: 110, height: 50, shape: 'roundrectangle',
// //         'shadow-blur': 16,
// //         'shadow-color': (ele: cytoscape.NodeSingular) => getNodeColors(ele.data('type')).border,
// //         'shadow-opacity': 0.35, 'shadow-offset-x': 0, 'shadow-offset-y': 0,
// //       } as cytoscape.Css.Node,
// //     },
// //     {
// //       selector: 'node:selected',
// //       style: { 'border-width': 3, 'shadow-blur': 28, 'shadow-opacity': 0.7 } as cytoscape.Css.Node,
// //     },
// //     {
// //       selector: 'edge',
// //       style: {
// //         'line-color': getCssVar('--node-edge'),
// //         'target-arrow-color': getCssVar('--node-edge'),
// //         'target-arrow-shape': 'triangle', 'curve-style': 'bezier',
// //         width: 1.5, 'arrow-scale': 0.8, opacity: 0.7,
// //         'font-family': '"JetBrains Mono", monospace', 'font-size': '9px',
// //         color: getCssVar('--text-muted'),
// //       } as cytoscape.Css.Edge,
// //     },
// //     {
// //       selector: 'edge[type = "record-edge"]',
// //       style: {
// //         'line-color': getCssVar('--node-edge'), 'line-style': 'dashed',
// //         'line-dash-pattern': [4,3], width: 1, opacity: 0.4, 'target-arrow-shape': 'none',
// //       } as cytoscape.Css.Edge,
// //     },
// //   ]
// // }
// //
// // async function expandEntity(cy: cytoscape.Core, entityId: string, onNodeSelect: (e: string, r: EntityRecord[]) => void) {
// //   try {
// //     const { records } = await fetchEntityRecords(entityId, 12)
// //     onNodeSelect(entityId, records)
// //     const { bg, border } = getNodeColors(entityId)
// //     const pkField = ({ business_partners:'business_partner', sales_order_headers:'sales_order',
// //       sales_order_items:'sales_order', outbound_delivery_headers:'delivery_document',
// //       outbound_delivery_items:'delivery_document', billing_document_headers:'billing_document',
// //       billing_document_items:'billing_document', journal_entry_items:'accounting_document',
// //       payments:'accounting_document', products:'product', plants:'plant' } as Record<string,string>)[entityId] ?? 'id'
// //
// //     records.slice(0,12).forEach((rec, i) => {
// //       const recId = `${entityId}-rec-${i}`
// //       cy.add({ data: { id: recId, label: String(rec[pkField]??`#${i+1}`).slice(0,16), type:'record', entityType: entityId } })
// //       cy.add({ data: { id:`edge-rec-${entityId}-${i}`, source: entityId, target: recId, type:'record-edge', entityType: entityId } })
// //       cy.$(`#${recId}`).style({ 'background-color': bg, 'border-color': border, 'border-width':1, 'border-opacity':0.7,
// //         'color': getCssVar('--text-primary'), width:80, height:28, shape:'roundrectangle', 'font-size':'9px',
// //         'text-valign':'center', 'text-halign':'center' })
// //     })
// //     cy.layout({ name:'fcose', animate:true, animationDuration:600, fit:false } as cytoscape.LayoutOptions).run()
// //   } catch (err) {
// //     console.error('Expand failed', entityId, err)
// //   }
// // }
// //
// // type GraphOverview = import('../types').GraphOverview
// /**
//  * GraphView.tsx
//  * -------------
//  * Interactive Cytoscape.js graph. Node colors read from CSS variables
//  * so they automatically adapt to dark/light theme.
//  */
//
// import { useEffect, useRef, useState, useCallback } from 'react'
// import cytoscape from 'cytoscape'
// // @ts-ignore
// import fcose from 'cytoscape-fcose'
// import { motion, AnimatePresence } from 'framer-motion'
// import { ZoomIn, ZoomOut, Maximize2, RefreshCw, ChevronRight } from 'lucide-react'
// import { fetchGraphOverview, fetchEntityRecords } from '../api'
// import type { GraphOverview, EntityRecord } from '../types'
// import type { Theme } from '../hooks/useTheme'
//
// cytoscape.use(fcose)
//
// // Map entity → CSS variable names defined in index.css
// const ENTITY_CSS: Record<string, { bg: string; border: string }> = {
//   business_partners:           { bg: '--node-customer-bg',   border: '--node-customer-border'   },
//   sales_order_headers:         { bg: '--node-order-bg',      border: '--node-order-border'      },
//   sales_order_items:           { bg: '--node-order-bg',      border: '--node-order-border'      },
//   outbound_delivery_headers:   { bg: '--node-delivery-bg',   border: '--node-delivery-border'   },
//   outbound_delivery_items:     { bg: '--node-delivery-bg',   border: '--node-delivery-border'   },
//   billing_document_headers:    { bg: '--node-billing-bg',    border: '--node-billing-border'    },
//   billing_document_items:      { bg: '--node-billing-bg',    border: '--node-billing-border'    },
//   billing_document_cancellations: { bg: '--node-billing-bg', border: '--node-billing-border'   },
//   journal_entry_items:         { bg: '--node-accounting-bg', border: '--node-accounting-border' },
//   payments:                    { bg: '--node-payment-bg',    border: '--node-payment-border'    },
//   products:                    { bg: '--node-product-bg',    border: '--node-product-border'    },
//   plants:                      { bg: '--node-plant-bg',      border: '--node-plant-border'      },
// }
//
// // Legend config — static colors that work on both themes
// const LEGEND = [
//   { label: 'Customer',   varName: '--node-customer-border'   },
//   { label: 'Sales Order',varName: '--node-order-border'      },
//   { label: 'Delivery',   varName: '--node-delivery-border'   },
//   { label: 'Billing',    varName: '--node-billing-border'    },
//   { label: 'Accounting', varName: '--node-accounting-border' },
//   { label: 'Payment',    varName: '--node-payment-border'    },
//   { label: 'Product',    varName: '--node-product-border'    },
//   { label: 'Plant',      varName: '--node-plant-border'      },
// ]
//
// function getCssVar(name: string): string {
//   return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
// }
//
// function getNodeColors(entityType: string) {
//   const css = ENTITY_CSS[entityType]
//   if (!css) return { bg: getCssVar('--bg-card'), border: getCssVar('--border') }
//   return { bg: getCssVar(css.bg), border: getCssVar(css.border) }
// }
//
// interface Props {
//   theme: Theme
//   onNodeSelect: (entity: string, records: EntityRecord[]) => void
//   highlightedNodes?: string[]
// }
//
// export default function GraphView({ theme, onNodeSelect, highlightedNodes = [] }: Props) {
//   const containerRef   = useRef<HTMLDivElement>(null)
//   const cyRef          = useRef<cytoscape.Core | null>(null)
//   const [overview,     setOverview]     = useState<GraphOverview | null>(null)
//   const [loading,      setLoading]      = useState(true)
//   const [expandedNodes,setExpandedNodes]= useState<Set<string>>(new Set())
//   const [tooltip,      setTooltip]      = useState<{ label: string; count: number; x: number; y: number } | null>(null)
//
//   // Load overview once
//   useEffect(() => {
//     fetchGraphOverview().then(d => { setOverview(d); setLoading(false) })
//   }, [])
//
//   // Re-init Cytoscape when data or theme changes (colors need refresh)
//   useEffect(() => {
//     if (!overview || !containerRef.current) return
//     if (cyRef.current) cyRef.current.destroy()
//
//     const cy = cytoscape({
//       container: containerRef.current,
//       elements:  buildElements(overview),
//       style:     buildStyles(),
//       layout: {
//         name: 'fcose', animate: true, animationDuration: 800,
//         animationEasing: 'ease-out', idealEdgeLength: 180,
//         nodeRepulsion: 8000, gravity: 0.25, numIter: 2500,
//       } as cytoscape.LayoutOptions,
//       wheelSensitivity: 0.3,
//     })
//
//     cyRef.current = cy
//
//     cy.on('mouseover', 'node', (e) => {
//       const pos = e.target.renderedPosition()
//       setTooltip({ label: e.target.data('label'), count: e.target.data('count'), x: pos.x, y: pos.y })
//       e.target.style('border-width', 3)
//     })
//     cy.on('mouseout', 'node', (e) => {
//       setTooltip(null)
//       e.target.style('border-width', 2)
//     })
//     cy.on('tap', 'node', async (e) => {
//       const nodeId: string = e.target.data('id')
//       if (e.target.data('type') === 'record') return
//
//       e.target.animate({ style: { 'border-width': 5 } } as cytoscape.AnimationOptions, { duration: 120 })
//       e.target.animate({ style: { 'border-width': 2 } } as cytoscape.AnimationOptions, { duration: 120 })
//
//       if (!expandedNodes.has(nodeId)) {
//         setExpandedNodes(prev => new Set([...prev, nodeId]))
//         await expandEntity(cy, nodeId, onNodeSelect)
//       } else {
//         cy.remove(`node[type = "record"][entityType = "${nodeId}"]`)
//         cy.remove(`edge[type = "record-edge"][entityType = "${nodeId}"]`)
//         setExpandedNodes(prev => { const s = new Set(prev); s.delete(nodeId); return s })
//       }
//     })
//
//     return () => cy.destroy()
//   }, [overview, theme]) // Re-init on theme change
//
//   // Highlight nodes from chat
//   useEffect(() => {
//     const cy = cyRef.current
//     if (!cy) return
//     cy.nodes().forEach((node: cytoscape.NodeSingular) => {
//       const { border } = getNodeColors(node.data('type'))
//       node.style('border-color', border)
//     })
//     highlightedNodes.forEach(id => {
//       const node = cy.$(`#${id}`)
//       if (node.length) {
//         node.style({ 'border-color': getCssVar('--amber'), 'border-width': 4 })
//         cy.animate({ fit: { eles: node, padding: 80 } } as cytoscape.AnimateOptions, { duration: 600 })
//       }
//     })
//   }, [highlightedNodes])
//
//   const zoomIn  = () => cyRef.current?.zoom({ level: cyRef.current.zoom() * 1.3, renderedPosition: { x: 400, y: 300 } })
//   const zoomOut = () => cyRef.current?.zoom({ level: cyRef.current.zoom() * 0.75, renderedPosition: { x: 400, y: 300 } })
//   const fit     = () => cyRef.current?.fit(undefined, 40)
//   const reset   = () => { setExpandedNodes(new Set()); if (overview) setOverview({ ...overview }) }
//
//   const isDark = theme === 'dark'
//
//   return (
//     <div className="relative w-full h-full scan-lines">
//       {/* Grid background */}
//       <div className="absolute inset-0 opacity-5 pointer-events-none"
//         style={{
//           backgroundImage: `linear-gradient(${getCssVar('--graph-grid')} 1px, transparent 1px), linear-gradient(90deg, ${getCssVar('--graph-grid')} 1px, transparent 1px)`,
//           backgroundSize: '48px 48px',
//         }} />
//
//       {/* Loading */}
//       <AnimatePresence>
//         {loading && (
//           <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }}
//             className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4">
//             <div className="flex gap-2">
//               {[0,1,2,3].map(i => (
//                 <motion.div key={i} className="w-2 h-2 rounded-full" style={{ background: getCssVar('--cyan') }}
//                   animate={{ y: [0,-12,0] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
//               ))}
//             </div>
//             <p className="font-mono text-sm" style={{ color: getCssVar('--cyan') }}>Constructing graph…</p>
//           </motion.div>
//         )}
//       </AnimatePresence>
//
//       <div ref={containerRef} id="cy" className="w-full h-full" />
//
//       {/* Tooltip */}
//       <AnimatePresence>
//         {tooltip && (
//           <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
//             className="absolute pointer-events-none z-20 px-3 py-2 rounded-lg border text-xs font-mono"
//             style={{
//               left: tooltip.x + 16, top: tooltip.y - 40,
//               background: getCssVar('--bg-surface'),
//               borderColor: getCssVar('--border'),
//               color: getCssVar('--cyan'),
//               boxShadow: `0 4px 20px ${getCssVar('--shadow')}`,
//             }}>
//             <div className="font-semibold">{tooltip.label}</div>
//             <div style={{ color: getCssVar('--text-secondary') }}>{tooltip.count.toLocaleString()} records</div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//
//       {/* Controls */}
//       <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
//         {[
//           { icon: ZoomIn,    fn: zoomIn,  title: 'Zoom in' },
//           { icon: ZoomOut,   fn: zoomOut, title: 'Zoom out' },
//           { icon: Maximize2, fn: fit,     title: 'Fit view' },
//           { icon: RefreshCw, fn: reset,   title: 'Reset' },
//         ].map(({ icon: Icon, fn, title }) => (
//           <button key={title} onClick={fn} title={title}
//             className="w-8 h-8 flex items-center justify-center rounded-lg backdrop-blur transition-colors"
//             style={{
//               background: getCssVar('--bg-surface'),
//               border: `1px solid ${getCssVar('--border')}`,
//               color: getCssVar('--text-secondary'),
//             }}
//             onMouseEnter={e => (e.currentTarget.style.color = getCssVar('--cyan'))}
//             onMouseLeave={e => (e.currentTarget.style.color = getCssVar('--text-secondary'))}>
//             <Icon size={14} />
//           </button>
//         ))}
//       </div>
//
//       {/* Legend */}
//       <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 p-3 rounded-xl backdrop-blur"
//         style={{ background: `${getCssVar('--bg-surface')}cc`, border: `1px solid ${getCssVar('--border')}` }}>
//         <p className="text-xs font-display font-semibold uppercase tracking-widest mb-1"
//           style={{ color: getCssVar('--text-muted') }}>O2C Flow</p>
//         {LEGEND.map(({ label, varName }) => (
//           <div key={label} className="flex items-center gap-2">
//             <div className="w-2 h-2 rounded-full flex-shrink-0"
//               style={{ background: getCssVar(varName), boxShadow: isDark ? `0 0 6px ${getCssVar(varName)}88` : 'none' }} />
//             <span className="text-xs font-mono" style={{ color: getCssVar('--text-secondary') }}>{label}</span>
//           </div>
//         ))}
//         <div className="mt-2 pt-2 flex items-center gap-1 text-xs font-mono"
//           style={{ borderTop: `1px solid ${getCssVar('--border')}`, color: getCssVar('--text-muted') }}>
//           <ChevronRight size={10} />
//           Click node to expand
//         </div>
//       </div>
//     </div>
//   )
// }
//
// // ── Helpers ───────────────────────────────────────────────────────────────────
//
// function buildElements(overview: GraphOverview): cytoscape.ElementDefinition[] {
//   return [
//     ...overview.nodes.map(n => ({
//       data: { id: n.id, label: n.label.replace(' Headers','').replace(' Items',' Items'), count: n.count, type: n.type },
//     })),
//     ...overview.edges.map((e, i) => ({
//       data: { id: `edge-${i}`, source: e.source, target: e.target, label: e.label },
//     })),
//   ]
// }
//
// function buildStyles(): cytoscape.Stylesheet[] {
//   return [
//     {
//       selector: 'node[type != "record"]',
//       style: {
//         'background-color': (ele: cytoscape.NodeSingular) => getNodeColors(ele.data('type')).bg,
//         'border-color':     (ele: cytoscape.NodeSingular) => getNodeColors(ele.data('type')).border,
//         'border-width': 2,
//         'color':  getCssVar('--text-primary'),
//         'label':  'data(label)',
//         'text-valign': 'center', 'text-halign': 'center',
//         'font-family': '"JetBrains Mono", monospace',
//         'font-size': '11px', 'font-weight': 500,
//         'text-wrap': 'wrap', 'text-max-width': '100px',
//         width: 110, height: 50, shape: 'roundrectangle',
//         'shadow-blur': 16,
//         'shadow-color': (ele: cytoscape.NodeSingular) => getNodeColors(ele.data('type')).border,
//         'shadow-opacity': 0.35, 'shadow-offset-x': 0, 'shadow-offset-y': 0,
//       } as cytoscape.Css.Node,
//     },
//     {
//       selector: 'node:selected',
//       style: { 'border-width': 3, 'shadow-blur': 28, 'shadow-opacity': 0.7 } as cytoscape.Css.Node,
//     },
//     {
//       selector: 'edge',
//       style: {
//         'line-color': getCssVar('--node-edge'),
//         'target-arrow-color': getCssVar('--node-edge'),
//         'target-arrow-shape': 'triangle', 'curve-style': 'bezier',
//         width: 1.5, 'arrow-scale': 0.8, opacity: 0.7,
//         'font-family': '"JetBrains Mono", monospace', 'font-size': '9px',
//         color: getCssVar('--text-muted'),
//       } as cytoscape.Css.Edge,
//     },
//     {
//       selector: 'edge[type = "record-edge"]',
//       style: {
//         'line-color': getCssVar('--node-edge'), 'line-style': 'dashed',
//         'line-dash-pattern': [4,3], width: 1, opacity: 0.4, 'target-arrow-shape': 'none',
//       } as cytoscape.Css.Edge,
//     },
//   ]
// }
//
// async function expandEntity(cy: cytoscape.Core, entityId: string, onNodeSelect: (e: string, r: EntityRecord[]) => void) {
//   try {
//     const { records } = await fetchEntityRecords(entityId, 12)
//     onNodeSelect(entityId, records)
//     const { bg, border } = getNodeColors(entityId)
//     const pkField = ({ business_partners:'business_partner', sales_order_headers:'sales_order',
//       sales_order_items:'sales_order', outbound_delivery_headers:'delivery_document',
//       outbound_delivery_items:'delivery_document', billing_document_headers:'billing_document',
//       billing_document_items:'billing_document', journal_entry_items:'accounting_document',
//       payments:'accounting_document', products:'product', plants:'plant' } as Record<string,string>)[entityId] ?? 'id'
//
//     records.slice(0,12).forEach((rec, i) => {
//       const recId = `${entityId}-rec-${i}`
//       cy.add({ data: { id: recId, label: String(rec[pkField]??`#${i+1}`).slice(0,16), type:'record', entityType: entityId } })
//       cy.add({ data: { id:`edge-rec-${entityId}-${i}`, source: entityId, target: recId, type:'record-edge', entityType: entityId } })
//       cy.$(`#${recId}`).style({ 'background-color': bg, 'border-color': border, 'border-width':1, 'border-opacity':0.7,
//         'color': getCssVar('--text-primary'), width:80, height:28, shape:'roundrectangle', 'font-size':'9px',
//         'text-valign':'center', 'text-halign':'center' })
//     })
//     cy.layout({ name:'fcose', animate:true, animationDuration:600, fit:false } as cytoscape.LayoutOptions).run()
//   } catch (err) {
//     console.error('Expand failed', entityId, err)
//   }
// }
/**
 * GraphView.tsx
 * -------------
 * Interactive Cytoscape.js graph. Node colors read from CSS variables
 * so they automatically adapt to dark/light theme.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import cytoscape from 'cytoscape'
// @ts-ignore
import fcose from 'cytoscape-fcose'
import { motion, AnimatePresence } from 'framer-motion'
import { ZoomIn, ZoomOut, Maximize2, RefreshCw, ChevronRight } from 'lucide-react'
import { fetchGraphOverview, fetchEntityRecords } from '../api'
import type { GraphOverview, EntityRecord } from '../types'
import type { Theme } from '../hooks/useTheme'

cytoscape.use(fcose)

// Map entity → CSS variable names defined in index.css
const ENTITY_CSS: Record<string, { bg: string; border: string }> = {
  business_partners:           { bg: '--node-customer-bg',   border: '--node-customer-border'   },
  sales_order_headers:         { bg: '--node-order-bg',      border: '--node-order-border'      },
  sales_order_items:           { bg: '--node-order-bg',      border: '--node-order-border'      },
  outbound_delivery_headers:   { bg: '--node-delivery-bg',   border: '--node-delivery-border'   },
  outbound_delivery_items:     { bg: '--node-delivery-bg',   border: '--node-delivery-border'   },
  billing_document_headers:    { bg: '--node-billing-bg',    border: '--node-billing-border'    },
  billing_document_items:      { bg: '--node-billing-bg',    border: '--node-billing-border'    },
  billing_document_cancellations: { bg: '--node-billing-bg', border: '--node-billing-border'   },
  journal_entry_items:         { bg: '--node-accounting-bg', border: '--node-accounting-border' },
  payments:                    { bg: '--node-payment-bg',    border: '--node-payment-border'    },
  products:                    { bg: '--node-product-bg',    border: '--node-product-border'    },
  plants:                      { bg: '--node-plant-bg',      border: '--node-plant-border'      },
}

// Legend config — static colors that work on both themes
const LEGEND = [
  { label: 'Customer',   varName: '--node-customer-border'   },
  { label: 'Sales Order',varName: '--node-order-border'      },
  { label: 'Delivery',   varName: '--node-delivery-border'   },
  { label: 'Billing',    varName: '--node-billing-border'    },
  { label: 'Accounting', varName: '--node-accounting-border' },
  { label: 'Payment',    varName: '--node-payment-border'    },
  { label: 'Product',    varName: '--node-product-border'    },
  { label: 'Plant',      varName: '--node-plant-border'      },
]

function getCssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function getNodeColors(entityType: string) {
  const css = ENTITY_CSS[entityType]
  if (!css) return { bg: getCssVar('--bg-card'), border: getCssVar('--border') }
  return { bg: getCssVar(css.bg), border: getCssVar(css.border) }
}

interface Props {
  theme: Theme
  onNodeSelect: (entity: string, records: EntityRecord[]) => void
  highlightedNodes?: string[]
}

export default function GraphView({ theme, onNodeSelect, highlightedNodes = [] }: Props) {
  const containerRef   = useRef<HTMLDivElement>(null)
  const cyRef          = useRef<cytoscape.Core | null>(null)
  const [overview,     setOverview]     = useState<GraphOverview | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [expandedNodes,setExpandedNodes]= useState<Set<string>>(new Set())
  const [tooltip,      setTooltip]      = useState<{ label: string; count: number; x: number; y: number } | null>(null)

  // Load overview once
  useEffect(() => {
    fetchGraphOverview().then(d => { setOverview(d); setLoading(false) })
  }, [])

  // Re-init Cytoscape when data or theme changes (colors need refresh)
  useEffect(() => {
    if (!overview || !containerRef.current) return
    if (cyRef.current) cyRef.current.destroy()

    const cy = cytoscape({
      container: containerRef.current,
      elements:  buildElements(overview),
      style:     buildStyles(),
      layout: {
        name: 'fcose', animate: true, animationDuration: 800,
        animationEasing: 'ease-out', idealEdgeLength: 180,
        nodeRepulsion: 8000, gravity: 0.25, numIter: 2500,
      } as cytoscape.LayoutOptions,
      wheelSensitivity: 0.3,
    })

    cyRef.current = cy

    cy.on('mouseover', 'node', (e) => {
      const pos = e.target.renderedPosition()
      setTooltip({ label: e.target.data('label'), count: e.target.data('count'), x: pos.x, y: pos.y })
      e.target.style('border-width', 3)
    })
    cy.on('mouseout', 'node', (e) => {
      setTooltip(null)
      e.target.style('border-width', 2)
    })
    cy.on('tap', 'node', async (e) => {
      const nodeId: string = e.target.data('id')
      if (e.target.data('type') === 'record') return

      e.target.animate({ style: { 'border-width': 5 } } as cytoscape.AnimationOptions, { duration: 120 })
      e.target.animate({ style: { 'border-width': 2 } } as cytoscape.AnimationOptions, { duration: 120 })

      if (!expandedNodes.has(nodeId)) {
        setExpandedNodes(prev => new Set([...prev, nodeId]))
        await expandEntity(cy, nodeId, onNodeSelect)
      } else {
        cy.remove(`node[type = "record"][entityType = "${nodeId}"]`)
        cy.remove(`edge[type = "record-edge"][entityType = "${nodeId}"]`)
        setExpandedNodes(prev => { const s = new Set(prev); s.delete(nodeId); return s })
      }
    })

    return () => cy.destroy()
  }, [overview, theme]) // Re-init on theme change

  // Highlight nodes from chat
  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return
    cy.nodes().forEach((node: cytoscape.NodeSingular) => {
      const { border } = getNodeColors(node.data('type'))
      node.style('border-color', border)
    })
    highlightedNodes.forEach(id => {
      const node = cy.$(`#${id}`)
      if (node.length) {
        node.style({ 'border-color': getCssVar('--amber'), 'border-width': 4 })
        cy.animate({ fit: { eles: node, padding: 80 } } as cytoscape.AnimateOptions, { duration: 600 })
      }
    })
  }, [highlightedNodes])

  const zoomIn  = () => cyRef.current?.zoom({ level: cyRef.current.zoom() * 1.3, renderedPosition: { x: 400, y: 300 } })
  const zoomOut = () => cyRef.current?.zoom({ level: cyRef.current.zoom() * 0.75, renderedPosition: { x: 400, y: 300 } })
  const fit     = () => cyRef.current?.fit(undefined, 40)
  const reset   = () => { setExpandedNodes(new Set()); if (overview) setOverview({ ...overview }) }

  const isDark = theme === 'dark'

  return (
    <div className="relative w-full h-full scan-lines">
      {/* Grid background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(${getCssVar('--graph-grid')} 1px, transparent 1px), linear-gradient(90deg, ${getCssVar('--graph-grid')} 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }} />

      {/* Loading */}
      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4">
            <div className="flex gap-2">
              {[0,1,2,3].map(i => (
                <motion.div key={i} className="w-2 h-2 rounded-full" style={{ background: getCssVar('--cyan') }}
                  animate={{ y: [0,-12,0] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
              ))}
            </div>
            <p className="font-mono text-sm" style={{ color: getCssVar('--cyan') }}>Constructing graph…</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={containerRef} id="cy" className="w-full h-full" />

      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="absolute pointer-events-none z-20 px-3 py-2 rounded-lg border text-xs font-mono"
            style={{
              left: tooltip.x + 16, top: tooltip.y - 40,
              background: getCssVar('--bg-surface'),
              borderColor: getCssVar('--border'),
              color: getCssVar('--cyan'),
              boxShadow: `0 4px 20px ${getCssVar('--shadow')}`,
            }}>
            <div className="font-semibold">{tooltip.label}</div>
            <div style={{ color: getCssVar('--text-secondary') }}>{tooltip.count.toLocaleString()} records</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
        {[
          { icon: ZoomIn,    fn: zoomIn,  title: 'Zoom in' },
          { icon: ZoomOut,   fn: zoomOut, title: 'Zoom out' },
          { icon: Maximize2, fn: fit,     title: 'Fit view' },
          { icon: RefreshCw, fn: reset,   title: 'Reset' },
        ].map(({ icon: Icon, fn, title }) => (
          <button key={title} onClick={fn} title={title}
            className="w-8 h-8 flex items-center justify-center rounded-lg backdrop-blur transition-colors"
            style={{
              background: getCssVar('--bg-surface'),
              border: `1px solid ${getCssVar('--border')}`,
              color: getCssVar('--text-secondary'),
            }}
            onMouseEnter={e => (e.currentTarget.style.color = getCssVar('--cyan'))}
            onMouseLeave={e => (e.currentTarget.style.color = getCssVar('--text-secondary'))}>
            <Icon size={14} />
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 p-3 rounded-xl backdrop-blur"
        style={{ background: `${getCssVar('--bg-surface')}cc`, border: `1px solid ${getCssVar('--border')}` }}>
        <p className="text-xs font-display font-semibold uppercase tracking-widest mb-1"
          style={{ color: getCssVar('--text-muted') }}>O2C Flow</p>
        {LEGEND.map(({ label, varName }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: getCssVar(varName), boxShadow: isDark ? `0 0 6px ${getCssVar(varName)}88` : 'none' }} />
            <span className="text-xs font-mono" style={{ color: getCssVar('--text-secondary') }}>{label}</span>
          </div>
        ))}
        <div className="mt-2 pt-2 flex items-center gap-1 text-xs font-mono"
          style={{ borderTop: `1px solid ${getCssVar('--border')}`, color: getCssVar('--text-muted') }}>
          <ChevronRight size={10} />
          Click node to expand
        </div>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildElements(overview: GraphOverview): cytoscape.ElementDefinition[] {
  return [
    ...overview.nodes.map(n => ({
      data: { id: n.id, label: n.label.replace(' Headers','').replace(' Items',' Items'), count: n.count, type: n.type },
    })),
    ...overview.edges.map((e, i) => ({
      data: { id: `edge-${i}`, source: e.source, target: e.target, label: e.label },
    })),
  ]
}

function buildStyles(): any[] {
  return [
    {
      selector: 'node[type != "record"]',
      style: {
        'background-color': (ele: cytoscape.NodeSingular) => getNodeColors(ele.data('type')).bg,
        'border-color':     (ele: cytoscape.NodeSingular) => getNodeColors(ele.data('type')).border,
        'border-width': 2,
        'color':  getCssVar('--text-primary'),
        'label':  'data(label)',
        'text-valign': 'center', 'text-halign': 'center',
        'font-family': '"JetBrains Mono", monospace',
        'font-size': '11px', 'font-weight': 500,
        'text-wrap': 'wrap', 'text-max-width': '100px',
        width: 110, height: 50, shape: 'roundrectangle',
        'shadow-blur': 16,
        'shadow-color': (ele: cytoscape.NodeSingular) => getNodeColors(ele.data('type')).border,
        'shadow-opacity': 0.35, 'shadow-offset-x': 0, 'shadow-offset-y': 0,
      } as cytoscape.Css.Node,
    },
    {
      selector: 'node:selected',
      style: { 'border-width': 3, 'shadow-blur': 28, 'shadow-opacity': 0.7 } as cytoscape.Css.Node,
    },
    {
      selector: 'edge',
      style: {
        'line-color': getCssVar('--node-edge'),
        'target-arrow-color': getCssVar('--node-edge'),
        'target-arrow-shape': 'triangle', 'curve-style': 'bezier',
        width: 1.5, 'arrow-scale': 0.8, opacity: 0.7,
        'font-family': '"JetBrains Mono", monospace', 'font-size': '9px',
        color: getCssVar('--text-muted'),
      } as cytoscape.Css.Edge,
    },
    {
      selector: 'edge[type = "record-edge"]',
      style: {
        'line-color': getCssVar('--node-edge'), 'line-style': 'dashed',
        'line-dash-pattern': [4,3], width: 1, opacity: 0.4, 'target-arrow-shape': 'none',
      } as cytoscape.Css.Edge,
    },
  ]
}

async function expandEntity(cy: cytoscape.Core, entityId: string, onNodeSelect: (e: string, r: EntityRecord[]) => void) {
  try {
    const { records } = await fetchEntityRecords(entityId, 12)
    onNodeSelect(entityId, records)
    const { bg, border } = getNodeColors(entityId)
    const pkField = ({ business_partners:'business_partner', sales_order_headers:'sales_order',
      sales_order_items:'sales_order', outbound_delivery_headers:'delivery_document',
      outbound_delivery_items:'delivery_document', billing_document_headers:'billing_document',
      billing_document_items:'billing_document', journal_entry_items:'accounting_document',
      payments:'accounting_document', products:'product', plants:'plant' } as Record<string,string>)[entityId] ?? 'id'

    records.slice(0,12).forEach((rec, i) => {
      const recId = `${entityId}-rec-${i}`
      cy.add({ data: { id: recId, label: String(rec[pkField]??`#${i+1}`).slice(0,16), type:'record', entityType: entityId } })
      cy.add({ data: { id:`edge-rec-${entityId}-${i}`, source: entityId, target: recId, type:'record-edge', entityType: entityId } })
      cy.$(`#${recId}`).style({ 'background-color': bg, 'border-color': border, 'border-width':1, 'border-opacity':0.7,
        'color': getCssVar('--text-primary'), width:80, height:28, shape:'roundrectangle', 'font-size':'9px',
        'text-valign':'center', 'text-halign':'center' })
    })
    cy.layout({ name:'fcose', animate:true, animationDuration:600, fit:false } as cytoscape.LayoutOptions).run()
  } catch (err) {
    console.error('Expand failed', entityId, err)
  }
}