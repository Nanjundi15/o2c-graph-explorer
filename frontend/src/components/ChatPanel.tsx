// // // /**
// // //  * ChatPanel.tsx
// // //  * -------------
// // //  * Conversational query interface. Sends questions to the LLM endpoint,
// // //  * displays data-backed answers with optional SQL preview and data table.
// // //  * Off-topic queries are shown with a distinct visual treatment.
// // //  */
// // //
// // // import { useState, useRef, useEffect, useCallback } from 'react'
// // // import { motion, AnimatePresence } from 'framer-motion'
// // // import { Send, Code2, Table, AlertTriangle, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
// // // import { sendChatMessage } from '../api'
// // // import type { ChatMessage, EntityRecord } from '../types'
// // //
// // // const SUGGESTED_QUERIES = [
// // //   'Which products have the most billing documents?',
// // //   'Show me orders that were delivered but not billed',
// // //   'Trace the flow for billing document 90504248',
// // //   'Which customers have the highest total order value?',
// // //   'Find all cancelled billing documents',
// // // ]
// // //
// // // interface Props {
// // //   onDataReceived?: (records: EntityRecord[]) => void
// // // }
// // //
// // // export default function ChatPanel({ onDataReceived }: Props) {
// // //   const [messages, setMessages] = useState<ChatMessage[]>([
// // //     {
// // //       id: 'welcome',
// // //       role: 'assistant',
// // //       content: 'Hello. I can answer questions about the SAP Order-to-Cash dataset — sales orders, deliveries, billing documents, payments, and more. What would you like to explore?',
// // //       timestamp: new Date(),
// // //     },
// // //   ])
// // //   const [input, setInput] = useState('')
// // //   const [loading, setLoading] = useState(false)
// // //   const messagesEndRef = useRef<HTMLDivElement>(null)
// // //   const inputRef = useRef<HTMLTextAreaElement>(null)
// // //
// // //   useEffect(() => {
// // //     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
// // //   }, [messages])
// // //
// // //   const sendMessage = useCallback(async (text: string) => {
// // //     const question = text.trim()
// // //     if (!question || loading) return
// // //
// // //     const userMsg: ChatMessage = {
// // //       id: `user-${Date.now()}`,
// // //       role: 'user',
// // //       content: question,
// // //       timestamp: new Date(),
// // //     }
// // //
// // //     setMessages(prev => [...prev, userMsg])
// // //     setInput('')
// // //     setLoading(true)
// // //
// // //     try {
// // //       const res = await sendChatMessage(question)
// // //
// // //       const assistantMsg: ChatMessage = {
// // //         id: `assistant-${Date.now()}`,
// // //         role: 'assistant',
// // //         content: res.answer,
// // //         sql: res.sql ?? undefined,
// // //         data: res.data,
// // //         rowCount: res.row_count,
// // //         isOffTopic: res.is_off_topic,
// // //         timestamp: new Date(),
// // //       }
// // //
// // //       setMessages(prev => [...prev, assistantMsg])
// // //
// // //       if (res.data?.length && onDataReceived) {
// // //         onDataReceived(res.data)
// // //       }
// // //     } catch (err: unknown) {
// // //       const msg = err instanceof Error ? err.message : 'Unknown error'
// // //       setMessages(prev => [...prev, {
// // //         id: `error-${Date.now()}`,
// // //         role: 'error',
// // //         content: `Request failed: ${msg}`,
// // //         timestamp: new Date(),
// // //       }])
// // //     } finally {
// // //       setLoading(false)
// // //     }
// // //   }, [loading, onDataReceived])
// // //
// // //   const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
// // //     if (e.key === 'Enter' && !e.shiftKey) {
// // //       e.preventDefault()
// // //       sendMessage(input)
// // //     }
// // //   }
// // //
// // //   return (
// // //     <div className="flex flex-col h-full">
// // //       {/* Header */}
// // //       <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800/60">
// // //         <div className="w-7 h-7 rounded-lg bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center">
// // //           <Sparkles size={14} className="text-cyan-400" />
// // //         </div>
// // //         <div>
// // //           <h2 className="text-sm font-display font-semibold text-slate-100">Query Assistant</h2>
// // //           <p className="text-xs text-slate-500 font-mono">O2C Dataset · Groq · Llama 3.3</p>
// // //         </div>
// // //         <div className="ml-auto flex items-center gap-1.5">
// // //           <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-slow" />
// // //           <span className="text-xs font-mono text-slate-500">live</span>
// // //         </div>
// // //       </div>
// // //
// // //       {/* Messages */}
// // //       <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
// // //         <AnimatePresence initial={false}>
// // //           {messages.map(msg => (
// // //             <MessageBubble key={msg.id} message={msg} />
// // //           ))}
// // //         </AnimatePresence>
// // //
// // //         {/* Loading indicator */}
// // //         <AnimatePresence>
// // //           {loading && (
// // //             <motion.div
// // //               initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
// // //               className="flex items-start gap-3"
// // //             >
// // //               <div className="w-6 h-6 rounded-md bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center flex-shrink-0 mt-0.5">
// // //                 <Sparkles size={11} className="text-cyan-400" />
// // //               </div>
// // //               <div className="px-4 py-3 rounded-xl rounded-tl-sm bg-navy-800/60 border border-slate-800/60">
// // //                 <div className="flex gap-1 items-center h-4">
// // //                   {[0, 1, 2].map(i => (
// // //                     <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400/60"
// // //                       animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
// // //                       transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
// // //                   ))}
// // //                 </div>
// // //               </div>
// // //             </motion.div>
// // //           )}
// // //         </AnimatePresence>
// // //
// // //         <div ref={messagesEndRef} />
// // //       </div>
// // //
// // //       {/* Suggested queries */}
// // //       {messages.length <= 1 && (
// // //         <div className="px-4 pb-3">
// // //           <p className="text-xs font-mono text-slate-500 mb-2 px-1">Suggested</p>
// // //           <div className="flex flex-col gap-1.5">
// // //             {SUGGESTED_QUERIES.map(q => (
// // //               <button key={q} onClick={() => sendMessage(q)}
// // //                 className="text-left text-xs px-3 py-2 rounded-lg border border-slate-800 bg-navy-800/40 text-slate-400 hover:text-cyan-400 hover:border-cyan-400/30 hover:bg-cyan-400/5 transition-all font-mono truncate">
// // //                 {q}
// // //               </button>
// // //             ))}
// // //           </div>
// // //         </div>
// // //       )}
// // //
// // //       {/* Input */}
// // //       <div className="px-4 pb-4 pt-2 border-t border-slate-800/60">
// // //         <div className="relative flex items-end gap-2">
// // //           <textarea
// // //             ref={inputRef}
// // //             value={input}
// // //             onChange={e => setInput(e.target.value)}
// // //             onKeyDown={handleKeyDown}
// // //             placeholder="Ask about orders, deliveries, billing…"
// // //             rows={1}
// // //             disabled={loading}
// // //             className="flex-1 bg-navy-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-sm font-mono text-slate-200 placeholder:text-slate-600 resize-none focus:outline-none focus:border-cyan-400/50 focus:bg-navy-800/80 transition-all disabled:opacity-50"
// // //             style={{ minHeight: '44px', maxHeight: '120px' }}
// // //           />
// // //           <motion.button
// // //             onClick={() => sendMessage(input)}
// // //             disabled={loading || !input.trim()}
// // //             whileTap={{ scale: 0.92 }}
// // //             className="flex-shrink-0 w-10 h-10 rounded-xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 hover:bg-cyan-400/20 hover:border-cyan-400/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
// // //           >
// // //             <Send size={15} />
// // //           </motion.button>
// // //         </div>
// // //         <p className="text-xs font-mono text-slate-600 mt-1.5 px-1">Enter to send · Shift+Enter for newline</p>
// // //       </div>
// // //     </div>
// // //   )
// // // }
// // //
// // // // ── Message Bubble ─────────────────────────────────────────────────────────────
// // //
// // // function MessageBubble({ message }: { message: ChatMessage }) {
// // //   const [showSql, setShowSql] = useState(false)
// // //   const [showData, setShowData] = useState(false)
// // //   const isUser = message.role === 'user'
// // //   const isError = message.role === 'error'
// // //
// // //   return (
// // //     <motion.div
// // //       initial={{ opacity: 0, y: 10 }}
// // //       animate={{ opacity: 1, y: 0 }}
// // //       transition={{ duration: 0.25, ease: 'easeOut' }}
// // //       className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
// // //     >
// // //       {/* Avatar */}
// // //       {!isUser && (
// // //         <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${
// // //           isError ? 'bg-rose-400/10 border border-rose-400/30' : 'bg-cyan-400/10 border border-cyan-400/30'
// // //         }`}>
// // //           {isError
// // //             ? <AlertTriangle size={11} className="text-rose-400" />
// // //             : <Sparkles size={11} className="text-cyan-400" />
// // //           }
// // //         </div>
// // //       )}
// // //
// // //       <div className={`flex flex-col gap-2 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
// // //         {/* Main bubble */}
// // //         <div className={`px-4 py-3 rounded-xl text-sm leading-relaxed ${
// // //           isUser
// // //             ? 'bg-cyan-400/10 border border-cyan-400/20 text-cyan-100 rounded-tr-sm font-mono'
// // //             : isError
// // //               ? 'bg-rose-400/10 border border-rose-400/20 text-rose-300 rounded-tl-sm font-mono'
// // //               : message.isOffTopic
// // //                 ? 'bg-amber-400/5 border border-amber-400/20 text-amber-200 rounded-tl-sm'
// // //                 : 'bg-navy-800/60 border border-slate-800/60 text-slate-200 rounded-tl-sm'
// // //         }`}>
// // //           {message.isOffTopic && (
// // //             <div className="flex items-center gap-2 mb-2 pb-2 border-b border-amber-400/20">
// // //               <AlertTriangle size={12} className="text-amber-400" />
// // //               <span className="text-xs font-mono text-amber-400 font-semibold">Off-topic query</span>
// // //             </div>
// // //           )}
// // //           <p className="whitespace-pre-wrap">{message.content}</p>
// // //         </div>
// // //
// // //         {/* SQL toggle */}
// // //         {message.sql && (
// // //           <div className="w-full">
// // //             <button onClick={() => setShowSql(v => !v)}
// // //               className="flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-cyan-400 transition-colors">
// // //               <Code2 size={11} />
// // //               {showSql ? 'Hide' : 'Show'} SQL
// // //               {showSql ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
// // //             </button>
// // //             <AnimatePresence>
// // //               {showSql && (
// // //                 <motion.pre
// // //                   initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
// // //                   className="mt-2 p-3 rounded-lg bg-navy-950/80 border border-slate-800/60 text-xs font-mono text-emerald-300 overflow-x-auto"
// // //                 >
// // //                   {message.sql}
// // //                 </motion.pre>
// // //               )}
// // //             </AnimatePresence>
// // //           </div>
// // //         )}
// // //
// // //         {/* Data table toggle */}
// // //         {message.data && message.data.length > 0 && (
// // //           <div className="w-full">
// // //             <button onClick={() => setShowData(v => !v)}
// // //               className="flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-cyan-400 transition-colors">
// // //               <Table size={11} />
// // //               {showData ? 'Hide' : 'View'} {message.rowCount ?? message.data.length} rows
// // //               {showData ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
// // //             </button>
// // //             <AnimatePresence>
// // //               {showData && (
// // //                 <motion.div
// // //                   initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
// // //                   className="mt-2 overflow-hidden rounded-lg border border-slate-800/60"
// // //                 >
// // //                   <DataTable records={message.data.slice(0, 20)} />
// // //                 </motion.div>
// // //               )}
// // //             </AnimatePresence>
// // //           </div>
// // //         )}
// // //
// // //         {/* Timestamp */}
// // //         <span className="text-xs font-mono text-slate-600 px-1">
// // //           {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
// // //         </span>
// // //       </div>
// // //     </motion.div>
// // //   )
// // // }
// // //
// // // // ── Data Table ─────────────────────────────────────────────────────────────────
// // //
// // // function DataTable({ records }: { records: EntityRecord[] }) {
// // //   if (!records.length) return null
// // //   const columns = Object.keys(records[0]).slice(0, 6) // Show max 6 cols
// // //
// // //   return (
// // //     <div className="overflow-x-auto">
// // //       <table className="w-full text-xs font-mono">
// // //         <thead>
// // //           <tr className="bg-navy-950/80">
// // //             {columns.map(col => (
// // //               <th key={col} className="px-3 py-2 text-left text-slate-500 border-b border-slate-800/60 whitespace-nowrap font-medium">
// // //                 {col.replace(/_/g, ' ')}
// // //               </th>
// // //             ))}
// // //           </tr>
// // //         </thead>
// // //         <tbody>
// // //           {records.map((row, i) => (
// // //             <tr key={i} className={`border-b border-slate-800/40 ${i % 2 === 0 ? 'bg-navy-900/40' : 'bg-navy-800/20'} hover:bg-cyan-400/5 transition-colors`}>
// // //               {columns.map(col => (
// // //                 <td key={col} className="px-3 py-1.5 text-slate-300 whitespace-nowrap max-w-[120px] overflow-hidden text-ellipsis">
// // //                   {row[col] === null ? <span className="text-slate-600">—</span> : String(row[col])}
// // //                 </td>
// // //               ))}
// // //             </tr>
// // //           ))}
// // //         </tbody>
// // //       </table>
// // //     </div>
// // //   )
// // // }
// // /**
// //  * ChatPanel.tsx
// //  * -------------
// //  * Chat interface with persistent history sidebar.
// //  * History stored in localStorage via useChatHistory hook.
// //  */
// //
// // import { useState, useRef, useEffect, useCallback } from 'react'
// // import { motion, AnimatePresence } from 'framer-motion'
// // import {
// //   Send, Code2, Table, AlertTriangle, Sparkles,
// //   ChevronDown, ChevronUp, History, Trash2, Plus, X,
// // } from 'lucide-react'
// // import { sendChatMessage } from '../api'
// // import { useChatHistory } from '../hooks/useChatHistory'
// // import type { ChatMessage, EntityRecord } from '../types'
// //
// // const WELCOME: ChatMessage = {
// //   id: 'welcome',
// //   role: 'assistant',
// //   content: 'Hello. I can answer questions about the SAP Order-to-Cash dataset — sales orders, deliveries, billing documents, payments, and more. What would you like to explore?',
// //   timestamp: new Date(),
// // }
// //
// // const SUGGESTED = [
// //   'Which products have the most billing documents?',
// //   'Show orders delivered but not billed',
// //   'Trace billing document 90504248',
// //   'Which customers have the highest order value?',
// //   'Find all cancelled billing documents',
// // ]
// //
// // interface Props {
// //   onDataReceived?: (records: EntityRecord[]) => void
// // }
// //
// // export default function ChatPanel({ onDataReceived }: Props) {
// //   const {
// //     sessions, activeSessionId, setActiveSessionId,
// //     createSession, appendMessage, deleteSession, clearAll,
// //   } = useChatHistory()
// //
// //   const [messages,     setMessages]     = useState<ChatMessage[]>([WELCOME])
// //   const [input,        setInput]        = useState('')
// //   const [loading,      setLoading]      = useState(false)
// //   const [showHistory,  setShowHistory]  = useState(false)
// //   const messagesEndRef = useRef<HTMLDivElement>(null)
// //
// //   useEffect(() => {
// //     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
// //   }, [messages])
// //
// //   // Load a previous session
// //   const loadSession = useCallback((sessionId: string) => {
// //     const s = sessions.find(x => x.id === sessionId)
// //     if (!s) return
// //     setMessages([WELCOME, ...s.messages])
// //     setActiveSessionId(sessionId)
// //     setShowHistory(false)
// //   }, [sessions, setActiveSessionId])
// //
// //   // Start a fresh conversation
// //   const newChat = useCallback(() => {
// //     setMessages([WELCOME])
// //     setActiveSessionId(null)
// //     setInput('')
// //     setShowHistory(false)
// //   }, [setActiveSessionId])
// //
// //   const sendMessage = useCallback(async (text: string) => {
// //     const question = text.trim()
// //     if (!question || loading) return
// //
// //     const userMsg: ChatMessage = {
// //       id: `user-${Date.now()}`,
// //       role: 'user',
// //       content: question,
// //       timestamp: new Date(),
// //     }
// //
// //     setMessages(prev => [...prev, userMsg])
// //     setInput('')
// //     setLoading(true)
// //
// //     // Persist user message to history
// //     let sessionId = activeSessionId
// //     if (!sessionId) {
// //       sessionId = createSession(userMsg)
// //     } else {
// //       appendMessage(sessionId, userMsg)
// //     }
// //
// //     try {
// //       const res = await sendChatMessage(question)
// //
// //       const assistantMsg: ChatMessage = {
// //         id: `assistant-${Date.now()}`,
// //         role: 'assistant',
// //         content: res.answer,
// //         sql: res.sql ?? undefined,
// //         data: res.data,
// //         rowCount: res.row_count,
// //         isOffTopic: res.is_off_topic,
// //         timestamp: new Date(),
// //       }
// //
// //       setMessages(prev => [...prev, assistantMsg])
// //       appendMessage(sessionId!, assistantMsg)
// //
// //       if (res.data?.length && onDataReceived) onDataReceived(res.data)
// //
// //     } catch (err: unknown) {
// //       const errMsg: ChatMessage = {
// //         id: `error-${Date.now()}`,
// //         role: 'error',
// //         content: `Request failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
// //         timestamp: new Date(),
// //       }
// //       setMessages(prev => [...prev, errMsg])
// //       appendMessage(sessionId!, errMsg)
// //     } finally {
// //       setLoading(false)
// //     }
// //   }, [loading, activeSessionId, createSession, appendMessage, onDataReceived])
// //
// //   const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
// //     if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
// //   }
// //
// //   return (
// //     <div className="flex flex-col h-full relative" style={{ background: 'var(--bg-surface)' }}>
// //
// //       {/* ── Header ─────────────────────────────────────────────────────── */}
// //       <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
// //         style={{ borderBottom: '1px solid var(--border)' }}>
// //         <div className="w-7 h-7 rounded-lg flex items-center justify-center"
// //           style={{ background: 'color-mix(in srgb, var(--cyan) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--cyan) 30%, transparent)' }}>
// //           <Sparkles size={14} style={{ color: 'var(--cyan)' }} />
// //         </div>
// //         <div className="flex-1 min-w-0">
// //           <h2 className="text-sm font-display font-semibold" style={{ color: 'var(--text-primary)' }}>Query Assistant</h2>
// //           <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>O2C Dataset · Groq · Llama 3.3</p>
// //         </div>
// //         <div className="flex items-center gap-2">
// //           <div className="flex items-center gap-1">
// //             <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--emerald)' }} />
// //             <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>live</span>
// //           </div>
// //           {/* History toggle */}
// //           <button onClick={() => setShowHistory(v => !v)}
// //             title="Chat history"
// //             className="relative w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
// //             style={{
// //               background: showHistory ? 'color-mix(in srgb, var(--cyan) 12%, transparent)' : 'transparent',
// //               border: `1px solid ${showHistory ? 'color-mix(in srgb, var(--cyan) 30%, transparent)' : 'var(--border)'}`,
// //               color: showHistory ? 'var(--cyan)' : 'var(--text-secondary)',
// //             }}>
// //             <History size={13} />
// //             {sessions.length > 0 && (
// //               <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-center text-[9px] font-mono leading-3.5"
// //                 style={{ background: 'var(--cyan)', color: 'var(--bg-base)' }}>
// //                 {sessions.length > 9 ? '9+' : sessions.length}
// //               </span>
// //             )}
// //           </button>
// //           {/* New chat */}
// //           <button onClick={newChat} title="New conversation"
// //             className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
// //             style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
// //             <Plus size={13} />
// //           </button>
// //         </div>
// //       </div>
// //
// //       {/* ── History Sidebar ─────────────────────────────────────────────── */}
// //       <AnimatePresence>
// //         {showHistory && (
// //           <motion.div
// //             initial={{ opacity: 0, x: 300 }} animate={{ opacity: 1, x: 0 }}
// //             exit={{ opacity: 0, x: 300 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
// //             className="absolute inset-0 z-30 flex flex-col"
// //             style={{ background: 'var(--bg-surface)' }}>
// //             {/* History header */}
// //             <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
// //               style={{ borderBottom: '1px solid var(--border)' }}>
// //               <div className="flex items-center gap-2">
// //                 <History size={14} style={{ color: 'var(--cyan)' }} />
// //                 <span className="text-sm font-display font-semibold" style={{ color: 'var(--text-primary)' }}>
// //                   History ({sessions.length})
// //                 </span>
// //               </div>
// //               <div className="flex items-center gap-2">
// //                 {sessions.length > 0 && (
// //                   <button onClick={clearAll}
// //                     className="text-xs font-mono px-2 py-1 rounded-md transition-colors"
// //                     style={{ color: 'var(--rose)', border: '1px solid color-mix(in srgb, var(--rose) 30%, transparent)' }}>
// //                     Clear all
// //                   </button>
// //                 )}
// //                 <button onClick={() => setShowHistory(false)}
// //                   className="w-6 h-6 rounded-md flex items-center justify-center"
// //                   style={{ color: 'var(--text-muted)' }}>
// //                   <X size={13} />
// //                 </button>
// //               </div>
// //             </div>
// //
// //             {/* Session list */}
// //             <div className="flex-1 overflow-y-auto p-3 space-y-2">
// //               {sessions.length === 0 ? (
// //                 <div className="flex flex-col items-center justify-center h-40 gap-2">
// //                   <History size={24} style={{ color: 'var(--text-muted)' }} />
// //                   <p className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>No history yet</p>
// //                 </div>
// //               ) : (
// //                 sessions.map((session, i) => (
// //                   <motion.div key={session.id}
// //                     initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
// //                     transition={{ delay: i * 0.04 }}
// //                     onClick={() => loadSession(session.id)}
// //                     className="group flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all"
// //                     style={{
// //                       background: activeSessionId === session.id
// //                         ? 'color-mix(in srgb, var(--cyan) 8%, transparent)'
// //                         : 'var(--bg-elevated)',
// //                       border: `1px solid ${activeSessionId === session.id
// //                         ? 'color-mix(in srgb, var(--cyan) 25%, transparent)'
// //                         : 'var(--border)'}`,
// //                     }}>
// //                     <Sparkles size={12} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--cyan)' }} />
// //                     <div className="flex-1 min-w-0">
// //                       <p className="text-xs font-mono truncate" style={{ color: 'var(--text-primary)' }}>
// //                         {session.title}
// //                       </p>
// //                       <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
// //                         {new Date(session.createdAt).toLocaleDateString()} ·{' '}
// //                         {session.messages.filter(m => m.role === 'user').length} queries
// //                       </p>
// //                     </div>
// //                     <button
// //                       onClick={e => { e.stopPropagation(); deleteSession(session.id) }}
// //                       className="opacity-0 group-hover:opacity-100 transition-opacity"
// //                       style={{ color: 'var(--text-muted)' }}>
// //                       <Trash2 size={12} />
// //                     </button>
// //                   </motion.div>
// //                 ))
// //               )}
// //             </div>
// //           </motion.div>
// //         )}
// //       </AnimatePresence>
// //
// //       {/* ── Messages ────────────────────────────────────────────────────── */}
// //       <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
// //         <AnimatePresence initial={false}>
// //           {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
// //         </AnimatePresence>
// //
// //         {/* Loading dots */}
// //         <AnimatePresence>
// //           {loading && (
// //             <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
// //               className="flex items-start gap-3">
// //               <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
// //                 style={{ background: 'color-mix(in srgb, var(--cyan) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--cyan) 30%, transparent)' }}>
// //                 <Sparkles size={11} style={{ color: 'var(--cyan)' }} />
// //               </div>
// //               <div className="px-4 py-3 rounded-xl rounded-tl-sm"
// //                 style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
// //                 <div className="flex gap-1 items-center h-4">
// //                   {[0,1,2].map(i => (
// //                     <motion.div key={i} className="w-1.5 h-1.5 rounded-full"
// //                       style={{ background: 'color-mix(in srgb, var(--cyan) 60%, transparent)' }}
// //                       animate={{ scale:[1,1.5,1], opacity:[0.4,1,0.4] }}
// //                       transition={{ duration:1, repeat:Infinity, delay:i*0.2 }} />
// //                   ))}
// //                 </div>
// //               </div>
// //             </motion.div>
// //           )}
// //         </AnimatePresence>
// //         <div ref={messagesEndRef} />
// //       </div>
// //
// //       {/* ── Suggested queries ────────────────────────────────────────────── */}
// //       {messages.length <= 1 && (
// //         <div className="px-4 pb-3 flex-shrink-0">
// //           <p className="text-xs font-mono px-1 mb-2" style={{ color: 'var(--text-muted)' }}>Suggested</p>
// //           <div className="flex flex-col gap-1.5">
// //             {SUGGESTED.map(q => (
// //               <button key={q} onClick={() => sendMessage(q)}
// //                 className="text-left text-xs px-3 py-2 rounded-lg font-mono truncate transition-all"
// //                 style={{
// //                   background: 'var(--bg-elevated)',
// //                   border: '1px solid var(--border)',
// //                   color: 'var(--text-secondary)',
// //                 }}
// //                 onMouseEnter={e => {
// //                   e.currentTarget.style.color = 'var(--cyan)'
// //                   e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--cyan) 30%, transparent)'
// //                 }}
// //                 onMouseLeave={e => {
// //                   e.currentTarget.style.color = 'var(--text-secondary)'
// //                   e.currentTarget.style.borderColor = 'var(--border)'
// //                 }}>
// //                 {q}
// //               </button>
// //             ))}
// //           </div>
// //         </div>
// //       )}
// //
// //       {/* ── Input ────────────────────────────────────────────────────────── */}
// //       <div className="px-4 pb-4 pt-2 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
// //         <div className="flex items-end gap-2">
// //           <textarea
// //             value={input}
// //             onChange={e => setInput(e.target.value)}
// //             onKeyDown={handleKeyDown}
// //             placeholder="Ask about orders, deliveries, billing…"
// //             rows={1} disabled={loading}
// //             className="flex-1 rounded-xl px-4 py-3 text-sm font-mono resize-none focus:outline-none transition-all disabled:opacity-50"
// //             style={{
// //               background: 'var(--bg-elevated)',
// //               border: '1px solid var(--border)',
// //               color: 'var(--text-primary)',
// //               minHeight: '44px', maxHeight: '120px',
// //             }}
// //             onFocus={e => e.target.style.borderColor = 'color-mix(in srgb, var(--cyan) 50%, transparent)'}
// //             onBlur={e => e.target.style.borderColor = 'var(--border)'}
// //           />
// //           <motion.button onClick={() => sendMessage(input)}
// //             disabled={loading || !input.trim()} whileTap={{ scale: 0.92 }}
// //             className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
// //             style={{
// //               background: 'color-mix(in srgb, var(--cyan) 12%, transparent)',
// //               border: '1px solid color-mix(in srgb, var(--cyan) 30%, transparent)',
// //               color: 'var(--cyan)',
// //             }}>
// //             <Send size={15} />
// //           </motion.button>
// //         </div>
// //         <p className="text-xs font-mono mt-1.5 px-1" style={{ color: 'var(--text-muted)' }}>
// //           Enter to send · Shift+Enter for newline
// //         </p>
// //       </div>
// //     </div>
// //   )
// // }
// //
// // // ── Message Bubble ─────────────────────────────────────────────────────────────
// //
// // function MessageBubble({ message }: { message: ChatMessage }) {
// //   const [showSql,  setShowSql]  = useState(false)
// //   const [showData, setShowData] = useState(false)
// //   const isUser  = message.role === 'user'
// //   const isError = message.role === 'error'
// //
// //   return (
// //     <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
// //       transition={{ duration:0.25, ease:'easeOut' }}
// //       className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
// //
// //       {!isUser && (
// //         <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
// //           style={isError
// //             ? { background:'color-mix(in srgb,var(--rose) 10%,transparent)', border:'1px solid color-mix(in srgb,var(--rose) 30%,transparent)' }
// //             : { background:'color-mix(in srgb,var(--cyan) 10%,transparent)', border:'1px solid color-mix(in srgb,var(--cyan) 30%,transparent)' }}>
// //           {isError
// //             ? <AlertTriangle size={11} style={{ color:'var(--rose)' }} />
// //             : <Sparkles      size={11} style={{ color:'var(--cyan)' }} />}
// //         </div>
// //       )}
// //
// //       <div className={`flex flex-col gap-2 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
// //         {/* Bubble */}
// //         <div className="px-4 py-3 rounded-xl text-sm leading-relaxed"
// //           style={isUser
// //             ? { background:'color-mix(in srgb,var(--cyan) 10%,transparent)', border:'1px solid color-mix(in srgb,var(--cyan) 20%,transparent)', color:'var(--text-primary)', borderRadius:'12px 4px 12px 12px' }
// //             : isError
// //               ? { background:'color-mix(in srgb,var(--rose) 8%,transparent)', border:'1px solid color-mix(in srgb,var(--rose) 25%,transparent)', color:'var(--rose)', borderRadius:'4px 12px 12px 12px' }
// //               : message.isOffTopic
// //                 ? { background:'color-mix(in srgb,var(--amber) 6%,transparent)', border:'1px solid color-mix(in srgb,var(--amber) 25%,transparent)', color:'var(--text-primary)', borderRadius:'4px 12px 12px 12px' }
// //                 : { background:'var(--bg-elevated)', border:'1px solid var(--border)', color:'var(--text-primary)', borderRadius:'4px 12px 12px 12px' }}>
// //           {message.isOffTopic && (
// //             <div className="flex items-center gap-2 mb-2 pb-2" style={{ borderBottom:'1px solid color-mix(in srgb,var(--amber) 25%,transparent)' }}>
// //               <AlertTriangle size={12} style={{ color:'var(--amber)' }} />
// //               <span className="text-xs font-mono font-semibold" style={{ color:'var(--amber)' }}>Off-topic query</span>
// //             </div>
// //           )}
// //           <p className={`whitespace-pre-wrap ${isUser ? 'font-mono text-xs' : 'text-sm'}`}>{message.content}</p>
// //         </div>
// //
// //         {/* SQL toggle */}
// //         {message.sql && (
// //           <div className="w-full">
// //             <button onClick={() => setShowSql(v=>!v)}
// //               className="flex items-center gap-1.5 text-xs font-mono transition-colors"
// //               style={{ color:'var(--text-muted)' }}
// //               onMouseEnter={e => e.currentTarget.style.color='var(--cyan)'}
// //               onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}>
// //               <Code2 size={11}/> {showSql?'Hide':'Show'} SQL {showSql?<ChevronUp size={10}/>:<ChevronDown size={10}/>}
// //             </button>
// //             <AnimatePresence>
// //               {showSql && (
// //                 <motion.pre initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
// //                   className="mt-2 p-3 rounded-lg text-xs font-mono overflow-x-auto"
// //                   style={{ background:'var(--bg-base)', border:'1px solid var(--border)', color:'var(--emerald)' }}>
// //                   {message.sql}
// //                 </motion.pre>
// //               )}
// //             </AnimatePresence>
// //           </div>
// //         )}
// //
// //         {/* Data table toggle */}
// //         {message.data && message.data.length > 0 && (
// //           <div className="w-full">
// //             <button onClick={() => setShowData(v=>!v)}
// //               className="flex items-center gap-1.5 text-xs font-mono transition-colors"
// //               style={{ color:'var(--text-muted)' }}
// //               onMouseEnter={e => e.currentTarget.style.color='var(--cyan)'}
// //               onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}>
// //               <Table size={11}/> {showData?'Hide':'View'} {message.rowCount??message.data.length} rows
// //               {showData?<ChevronUp size={10}/>:<ChevronDown size={10}/>}
// //             </button>
// //             <AnimatePresence>
// //               {showData && (
// //                 <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
// //                   className="mt-2 overflow-hidden rounded-lg" style={{ border:'1px solid var(--border)' }}>
// //                   <DataTable records={message.data.slice(0,20)} />
// //                 </motion.div>
// //               )}
// //             </AnimatePresence>
// //           </div>
// //         )}
// //
// //         <span className="text-xs font-mono px-1" style={{ color:'var(--text-muted)' }}>
// //           {message.timestamp.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
// //         </span>
// //       </div>
// //     </motion.div>
// //   )
// // }
// //
// // function DataTable({ records }: { records: EntityRecord[] }) {
// //   if (!records.length) return null
// //   const columns = Object.keys(records[0]).slice(0,6)
// //   return (
// //     <div className="overflow-x-auto">
// //       <table className="w-full text-xs font-mono">
// //         <thead>
// //           <tr style={{ background:'var(--bg-base)' }}>
// //             {columns.map(col => (
// //               <th key={col} className="px-3 py-2 text-left whitespace-nowrap font-medium"
// //                 style={{ color:'var(--text-muted)', borderBottom:'1px solid var(--border)' }}>
// //                 {col.replace(/_/g,' ')}
// //               </th>
// //             ))}
// //           </tr>
// //         </thead>
// //         <tbody>
// //           {records.map((row,i) => (
// //             <tr key={i} style={{ background: i%2===0 ? 'var(--bg-elevated)' : 'var(--bg-surface)', borderBottom:'1px solid var(--border)' }}>
// //               {columns.map(col => (
// //                 <td key={col} className="px-3 py-1.5 whitespace-nowrap max-w-[120px] overflow-hidden text-ellipsis"
// //                   style={{ color:'var(--text-primary)' }}>
// //                   {row[col]===null ? <span style={{color:'var(--text-muted)'}}>—</span> : String(row[col])}
// //                 </td>
// //               ))}
// //             </tr>
// //           ))}
// //         </tbody>
// //       </table>
// //     </div>
// //   )
// // }
// //
// // type EntityRecord = import('../types').EntityRecord
// /**
//  * ChatPanel.tsx
//  * -------------
//  * Chat interface with persistent history sidebar.
//  * History stored in localStorage via useChatHistory hook.
//  */
//
// import { useState, useRef, useEffect, useCallback } from 'react'
// import { motion, AnimatePresence } from 'framer-motion'
// import {
//   Send, Code2, Table, AlertTriangle, Sparkles,
//   ChevronDown, ChevronUp, History, Trash2, Plus, X,
// } from 'lucide-react'
// import { sendChatMessage } from '../api'
// import { useChatHistory } from '../hooks/useChatHistory'
// import type { ChatMessage, EntityRecord } from '../types'
//
// const WELCOME: ChatMessage = {
//   id: 'welcome',
//   role: 'assistant',
//   content: 'Hello. I can answer questions about the SAP Order-to-Cash dataset — sales orders, deliveries, billing documents, payments, and more. What would you like to explore?',
//   timestamp: new Date(),
// }
//
// const SUGGESTED = [
//   'Which products have the most billing documents?',
//   'Show orders delivered but not billed',
//   'Trace billing document 90504248',
//   'Which customers have the highest order value?',
//   'Find all cancelled billing documents',
// ]
//
// interface Props {
//   onDataReceived?: (records: EntityRecord[]) => void
// }
//
// export default function ChatPanel({ onDataReceived }: Props) {
//   const {
//     sessions, activeSessionId, setActiveSessionId,
//     createSession, appendMessage, deleteSession, clearAll,
//   } = useChatHistory()
//
//   const [messages,     setMessages]     = useState<ChatMessage[]>([WELCOME])
//   const [input,        setInput]        = useState('')
//   const [loading,      setLoading]      = useState(false)
//   const [showHistory,  setShowHistory]  = useState(false)
//   const messagesEndRef = useRef<HTMLDivElement>(null)
//
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
//   }, [messages])
//
//   // Load a previous session
//   const loadSession = useCallback((sessionId: string) => {
//     const s = sessions.find(x => x.id === sessionId)
//     if (!s) return
//     setMessages([WELCOME, ...s.messages])
//     setActiveSessionId(sessionId)
//     setShowHistory(false)
//   }, [sessions, setActiveSessionId])
//
//   // Start a fresh conversation
//   const newChat = useCallback(() => {
//     setMessages([WELCOME])
//     setActiveSessionId(null)
//     setInput('')
//     setShowHistory(false)
//   }, [setActiveSessionId])
//
//   const sendMessage = useCallback(async (text: string) => {
//     const question = text.trim()
//     if (!question || loading) return
//
//     const userMsg: ChatMessage = {
//       id: `user-${Date.now()}`,
//       role: 'user',
//       content: question,
//       timestamp: new Date(),
//     }
//
//     setMessages(prev => [...prev, userMsg])
//     setInput('')
//     setLoading(true)
//
//     // Persist user message to history
//     let sessionId = activeSessionId
//     if (!sessionId) {
//       sessionId = createSession(userMsg)
//     } else {
//       appendMessage(sessionId, userMsg)
//     }
//
//     try {
//       const res = await sendChatMessage(question)
//
//       const assistantMsg: ChatMessage = {
//         id: `assistant-${Date.now()}`,
//         role: 'assistant',
//         content: res.answer,
//         sql: res.sql ?? undefined,
//         data: res.data,
//         rowCount: res.row_count,
//         isOffTopic: res.is_off_topic,
//         timestamp: new Date(),
//       }
//
//       setMessages(prev => [...prev, assistantMsg])
//       appendMessage(sessionId!, assistantMsg)
//
//       if (res.data?.length && onDataReceived) onDataReceived(res.data)
//
//     } catch (err: unknown) {
//       const errMsg: ChatMessage = {
//         id: `error-${Date.now()}`,
//         role: 'error',
//         content: `Request failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
//         timestamp: new Date(),
//       }
//       setMessages(prev => [...prev, errMsg])
//       appendMessage(sessionId!, errMsg)
//     } finally {
//       setLoading(false)
//     }
//   }, [loading, activeSessionId, createSession, appendMessage, onDataReceived])
//
//   const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
//     if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
//   }
//
//   return (
//     <div className="flex flex-col h-full relative" style={{ background: 'var(--bg-surface)' }}>
//
//       {/* ── Header ─────────────────────────────────────────────────────── */}
//       <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
//         style={{ borderBottom: '1px solid var(--border)' }}>
//         <div className="w-7 h-7 rounded-lg flex items-center justify-center"
//           style={{ background: 'color-mix(in srgb, var(--cyan) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--cyan) 30%, transparent)' }}>
//           <Sparkles size={14} style={{ color: 'var(--cyan)' }} />
//         </div>
//         <div className="flex-1 min-w-0">
//           <h2 className="text-sm font-display font-semibold" style={{ color: 'var(--text-primary)' }}>Query Assistant</h2>
//           <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>O2C Dataset · Groq · Llama 3.3</p>
//         </div>
//         <div className="flex items-center gap-2">
//           <div className="flex items-center gap-1">
//             <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--emerald)' }} />
//             <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>live</span>
//           </div>
//           {/* History toggle */}
//           <button onClick={() => setShowHistory(v => !v)}
//             title="Chat history"
//             className="relative w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
//             style={{
//               background: showHistory ? 'color-mix(in srgb, var(--cyan) 12%, transparent)' : 'transparent',
//               border: `1px solid ${showHistory ? 'color-mix(in srgb, var(--cyan) 30%, transparent)' : 'var(--border)'}`,
//               color: showHistory ? 'var(--cyan)' : 'var(--text-secondary)',
//             }}>
//             <History size={13} />
//             {sessions.length > 0 && (
//               <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-center text-[9px] font-mono leading-3.5"
//                 style={{ background: 'var(--cyan)', color: 'var(--bg-base)' }}>
//                 {sessions.length > 9 ? '9+' : sessions.length}
//               </span>
//             )}
//           </button>
//           {/* New chat */}
//           <button onClick={newChat} title="New conversation"
//             className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
//             style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
//             <Plus size={13} />
//           </button>
//         </div>
//       </div>
//
//       {/* ── History Sidebar ─────────────────────────────────────────────── */}
//       <AnimatePresence>
//         {showHistory && (
//           <motion.div
//             initial={{ opacity: 0, x: 300 }} animate={{ opacity: 1, x: 0 }}
//             exit={{ opacity: 0, x: 300 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
//             className="absolute inset-0 z-30 flex flex-col"
//             style={{ background: 'var(--bg-surface)' }}>
//             {/* History header */}
//             <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
//               style={{ borderBottom: '1px solid var(--border)' }}>
//               <div className="flex items-center gap-2">
//                 <History size={14} style={{ color: 'var(--cyan)' }} />
//                 <span className="text-sm font-display font-semibold" style={{ color: 'var(--text-primary)' }}>
//                   History ({sessions.length})
//                 </span>
//               </div>
//               <div className="flex items-center gap-2">
//                 {sessions.length > 0 && (
//                   <button onClick={clearAll}
//                     className="text-xs font-mono px-2 py-1 rounded-md transition-colors"
//                     style={{ color: 'var(--rose)', border: '1px solid color-mix(in srgb, var(--rose) 30%, transparent)' }}>
//                     Clear all
//                   </button>
//                 )}
//                 <button onClick={() => setShowHistory(false)}
//                   className="w-6 h-6 rounded-md flex items-center justify-center"
//                   style={{ color: 'var(--text-muted)' }}>
//                   <X size={13} />
//                 </button>
//               </div>
//             </div>
//
//             {/* Session list */}
//             <div className="flex-1 overflow-y-auto p-3 space-y-2">
//               {sessions.length === 0 ? (
//                 <div className="flex flex-col items-center justify-center h-40 gap-2">
//                   <History size={24} style={{ color: 'var(--text-muted)' }} />
//                   <p className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>No history yet</p>
//                 </div>
//               ) : (
//                 sessions.map((session, i) => (
//                   <motion.div key={session.id}
//                     initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
//                     transition={{ delay: i * 0.04 }}
//                     onClick={() => loadSession(session.id)}
//                     className="group flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all"
//                     style={{
//                       background: activeSessionId === session.id
//                         ? 'color-mix(in srgb, var(--cyan) 8%, transparent)'
//                         : 'var(--bg-elevated)',
//                       border: `1px solid ${activeSessionId === session.id
//                         ? 'color-mix(in srgb, var(--cyan) 25%, transparent)'
//                         : 'var(--border)'}`,
//                     }}>
//                     <Sparkles size={12} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--cyan)' }} />
//                     <div className="flex-1 min-w-0">
//                       <p className="text-xs font-mono truncate" style={{ color: 'var(--text-primary)' }}>
//                         {session.title}
//                       </p>
//                       <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
//                         {new Date(session.createdAt).toLocaleDateString()} ·{' '}
//                         {session.messages.filter(m => m.role === 'user').length} queries
//                       </p>
//                     </div>
//                     <button
//                       onClick={e => { e.stopPropagation(); deleteSession(session.id) }}
//                       className="opacity-0 group-hover:opacity-100 transition-opacity"
//                       style={{ color: 'var(--text-muted)' }}>
//                       <Trash2 size={12} />
//                     </button>
//                   </motion.div>
//                 ))
//               )}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//
//       {/* ── Messages ────────────────────────────────────────────────────── */}
//       <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
//         <AnimatePresence initial={false}>
//           {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
//         </AnimatePresence>
//
//         {/* Loading dots */}
//         <AnimatePresence>
//           {loading && (
//             <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
//               className="flex items-start gap-3">
//               <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
//                 style={{ background: 'color-mix(in srgb, var(--cyan) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--cyan) 30%, transparent)' }}>
//                 <Sparkles size={11} style={{ color: 'var(--cyan)' }} />
//               </div>
//               <div className="px-4 py-3 rounded-xl rounded-tl-sm"
//                 style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
//                 <div className="flex gap-1 items-center h-4">
//                   {[0,1,2].map(i => (
//                     <motion.div key={i} className="w-1.5 h-1.5 rounded-full"
//                       style={{ background: 'color-mix(in srgb, var(--cyan) 60%, transparent)' }}
//                       animate={{ scale:[1,1.5,1], opacity:[0.4,1,0.4] }}
//                       transition={{ duration:1, repeat:Infinity, delay:i*0.2 }} />
//                   ))}
//                 </div>
//               </div>
//             </motion.div>
//           )}
//         </AnimatePresence>
//         <div ref={messagesEndRef} />
//       </div>
//
//       {/* ── Suggested queries ────────────────────────────────────────────── */}
//       {messages.length <= 1 && (
//         <div className="px-4 pb-3 flex-shrink-0">
//           <p className="text-xs font-mono px-1 mb-2" style={{ color: 'var(--text-muted)' }}>Suggested</p>
//           <div className="flex flex-col gap-1.5">
//             {SUGGESTED.map(q => (
//               <button key={q} onClick={() => sendMessage(q)}
//                 className="text-left text-xs px-3 py-2 rounded-lg font-mono truncate transition-all"
//                 style={{
//                   background: 'var(--bg-elevated)',
//                   border: '1px solid var(--border)',
//                   color: 'var(--text-secondary)',
//                 }}
//                 onMouseEnter={e => {
//                   e.currentTarget.style.color = 'var(--cyan)'
//                   e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--cyan) 30%, transparent)'
//                 }}
//                 onMouseLeave={e => {
//                   e.currentTarget.style.color = 'var(--text-secondary)'
//                   e.currentTarget.style.borderColor = 'var(--border)'
//                 }}>
//                 {q}
//               </button>
//             ))}
//           </div>
//         </div>
//       )}
//
//       {/* ── Input ────────────────────────────────────────────────────────── */}
//       <div className="px-4 pb-4 pt-2 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
//         <div className="flex items-end gap-2">
//           <textarea
//             value={input}
//             onChange={e => setInput(e.target.value)}
//             onKeyDown={handleKeyDown}
//             placeholder="Ask about orders, deliveries, billing…"
//             rows={1} disabled={loading}
//             className="flex-1 rounded-xl px-4 py-3 text-sm font-mono resize-none focus:outline-none transition-all disabled:opacity-50"
//             style={{
//               background: 'var(--bg-elevated)',
//               border: '1px solid var(--border)',
//               color: 'var(--text-primary)',
//               minHeight: '44px', maxHeight: '120px',
//             }}
//             onFocus={e => e.target.style.borderColor = 'color-mix(in srgb, var(--cyan) 50%, transparent)'}
//             onBlur={e => e.target.style.borderColor = 'var(--border)'}
//           />
//           <motion.button onClick={() => sendMessage(input)}
//             disabled={loading || !input.trim()} whileTap={{ scale: 0.92 }}
//             className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
//             style={{
//               background: 'color-mix(in srgb, var(--cyan) 12%, transparent)',
//               border: '1px solid color-mix(in srgb, var(--cyan) 30%, transparent)',
//               color: 'var(--cyan)',
//             }}>
//             <Send size={15} />
//           </motion.button>
//         </div>
//         <p className="text-xs font-mono mt-1.5 px-1" style={{ color: 'var(--text-muted)' }}>
//           Enter to send · Shift+Enter for newline
//         </p>
//       </div>
//     </div>
//   )
// }
//
// // ── Message Bubble ─────────────────────────────────────────────────────────────
//
// function MessageBubble({ message }: { message: ChatMessage }) {
//   const [showSql,  setShowSql]  = useState(false)
//   const [showData, setShowData] = useState(false)
//   const isUser  = message.role === 'user'
//   const isError = message.role === 'error'
//
//   return (
//     <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
//       transition={{ duration:0.25, ease:'easeOut' }}
//       className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
//
//       {!isUser && (
//         <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
//           style={isError
//             ? { background:'color-mix(in srgb,var(--rose) 10%,transparent)', border:'1px solid color-mix(in srgb,var(--rose) 30%,transparent)' }
//             : { background:'color-mix(in srgb,var(--cyan) 10%,transparent)', border:'1px solid color-mix(in srgb,var(--cyan) 30%,transparent)' }}>
//           {isError
//             ? <AlertTriangle size={11} style={{ color:'var(--rose)' }} />
//             : <Sparkles      size={11} style={{ color:'var(--cyan)' }} />}
//         </div>
//       )}
//
//       <div className={`flex flex-col gap-2 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
//         {/* Bubble */}
//         <div className="px-4 py-3 rounded-xl text-sm leading-relaxed"
//           style={isUser
//             ? { background:'color-mix(in srgb,var(--cyan) 10%,transparent)', border:'1px solid color-mix(in srgb,var(--cyan) 20%,transparent)', color:'var(--text-primary)', borderRadius:'12px 4px 12px 12px' }
//             : isError
//               ? { background:'color-mix(in srgb,var(--rose) 8%,transparent)', border:'1px solid color-mix(in srgb,var(--rose) 25%,transparent)', color:'var(--rose)', borderRadius:'4px 12px 12px 12px' }
//               : message.isOffTopic
//                 ? { background:'color-mix(in srgb,var(--amber) 6%,transparent)', border:'1px solid color-mix(in srgb,var(--amber) 25%,transparent)', color:'var(--text-primary)', borderRadius:'4px 12px 12px 12px' }
//                 : { background:'var(--bg-elevated)', border:'1px solid var(--border)', color:'var(--text-primary)', borderRadius:'4px 12px 12px 12px' }}>
//           {message.isOffTopic && (
//             <div className="flex items-center gap-2 mb-2 pb-2" style={{ borderBottom:'1px solid color-mix(in srgb,var(--amber) 25%,transparent)' }}>
//               <AlertTriangle size={12} style={{ color:'var(--amber)' }} />
//               <span className="text-xs font-mono font-semibold" style={{ color:'var(--amber)' }}>Off-topic query</span>
//             </div>
//           )}
//           <p className={`whitespace-pre-wrap ${isUser ? 'font-mono text-xs' : 'text-sm'}`}>{message.content}</p>
//         </div>
//
//         {/* SQL toggle */}
//         {message.sql && (
//           <div className="w-full">
//             <button onClick={() => setShowSql(v=>!v)}
//               className="flex items-center gap-1.5 text-xs font-mono transition-colors"
//               style={{ color:'var(--text-muted)' }}
//               onMouseEnter={e => e.currentTarget.style.color='var(--cyan)'}
//               onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}>
//               <Code2 size={11}/> {showSql?'Hide':'Show'} SQL {showSql?<ChevronUp size={10}/>:<ChevronDown size={10}/>}
//             </button>
//             <AnimatePresence>
//               {showSql && (
//                 <motion.pre initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
//                   className="mt-2 p-3 rounded-lg text-xs font-mono overflow-x-auto"
//                   style={{ background:'var(--bg-base)', border:'1px solid var(--border)', color:'var(--emerald)' }}>
//                   {message.sql}
//                 </motion.pre>
//               )}
//             </AnimatePresence>
//           </div>
//         )}
//
//         {/* Data table toggle */}
//         {message.data && message.data.length > 0 && (
//           <div className="w-full">
//             <button onClick={() => setShowData(v=>!v)}
//               className="flex items-center gap-1.5 text-xs font-mono transition-colors"
//               style={{ color:'var(--text-muted)' }}
//               onMouseEnter={e => e.currentTarget.style.color='var(--cyan)'}
//               onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}>
//               <Table size={11}/> {showData?'Hide':'View'} {message.rowCount??message.data.length} rows
//               {showData?<ChevronUp size={10}/>:<ChevronDown size={10}/>}
//             </button>
//             <AnimatePresence>
//               {showData && (
//                 <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
//                   className="mt-2 overflow-hidden rounded-lg" style={{ border:'1px solid var(--border)' }}>
//                   <DataTable records={message.data.slice(0,20)} />
//                 </motion.div>
//               )}
//             </AnimatePresence>
//           </div>
//         )}
//
//         <span className="text-xs font-mono px-1" style={{ color:'var(--text-muted)' }}>
//           {message.timestamp.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
//         </span>
//       </div>
//     </motion.div>
//   )
// }
//
// function DataTable({ records }: { records: EntityRecord[] }) {
//   if (!records.length) return null
//   const columns = Object.keys(records[0]).slice(0,6)
//   return (
//     <div className="overflow-x-auto">
//       <table className="w-full text-xs font-mono">
//         <thead>
//           <tr style={{ background:'var(--bg-base)' }}>
//             {columns.map(col => (
//               <th key={col} className="px-3 py-2 text-left whitespace-nowrap font-medium"
//                 style={{ color:'var(--text-muted)', borderBottom:'1px solid var(--border)' }}>
//                 {col.replace(/_/g,' ')}
//               </th>
//             ))}
//           </tr>
//         </thead>
//         <tbody>
//           {records.map((row,i) => (
//             <tr key={i} style={{ background: i%2===0 ? 'var(--bg-elevated)' : 'var(--bg-surface)', borderBottom:'1px solid var(--border)' }}>
//               {columns.map(col => (
//                 <td key={col} className="px-3 py-1.5 whitespace-nowrap max-w-[120px] overflow-hidden text-ellipsis"
//                   style={{ color:'var(--text-primary)' }}>
//                   {row[col]===null ? <span style={{color:'var(--text-muted)'}}>—</span> : String(row[col])}
//                 </td>
//               ))}
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   )
// }
/**
 * ChatPanel.tsx
 * -------------
 * Chat interface with persistent history sidebar.
 * History stored in localStorage via useChatHistory hook.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Code2, Table, AlertTriangle, Sparkles,
  ChevronDown, ChevronUp, History, Trash2, Plus, X,
} from 'lucide-react'
import { sendChatMessage } from '../api'
import { useChatHistory } from '../hooks/useChatHistory'
import type { ChatMessage, EntityRecord } from '../types'

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: 'Hello. I can answer questions about the SAP Order-to-Cash dataset — sales orders, deliveries, billing documents, payments, and more. What would you like to explore?',
  timestamp: new Date(),
}

const SUGGESTED = [
  'Which products have the most billing documents?',
  'Show orders delivered but not billed',
  'Trace billing document 90504248',
  'Which customers have the highest order value?',
  'Find all cancelled billing documents',
]

interface Props {
  onDataReceived?: (records: EntityRecord[]) => void
}

export default function ChatPanel({ onDataReceived }: Props) {
  const {
    sessions, activeSessionId, setActiveSessionId,
    createSession, appendMessage, deleteSession, clearAll,
  } = useChatHistory()

  const [messages,     setMessages]     = useState<ChatMessage[]>([WELCOME])
  const [input,        setInput]        = useState('')
  const [loading,      setLoading]      = useState(false)
  const [showHistory,  setShowHistory]  = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load a previous session
  const loadSession = useCallback((sessionId: string) => {
    const s = sessions.find((x: any) => x.id === sessionId)
    if (!s) return
    setMessages([WELCOME, ...s.messages])
    setActiveSessionId(sessionId)
    setShowHistory(false)
  }, [sessions, setActiveSessionId])

  // Start a fresh conversation
  const newChat = useCallback(() => {
    setMessages([WELCOME])
    setActiveSessionId(null)
    setInput('')
    setShowHistory(false)
  }, [setActiveSessionId])

  const sendMessage = useCallback(async (text: string) => {
    const question = text.trim()
    if (!question || loading) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    // Persist user message to history
    let sessionId = activeSessionId
    if (!sessionId) {
      sessionId = createSession(userMsg)
    } else {
      appendMessage(sessionId, userMsg)
    }

    try {
      const res = await sendChatMessage(question)

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: res.answer,
        sql: res.sql ?? undefined,
        data: res.data,
        rowCount: res.row_count,
        isOffTopic: res.is_off_topic,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMsg])
      appendMessage(sessionId!, assistantMsg)

      if (res.data?.length && onDataReceived) onDataReceived(res.data)

    } catch (err: unknown) {
      const errMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'error',
        content: `Request failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errMsg])
      appendMessage(sessionId!, errMsg)
    } finally {
      setLoading(false)
    }
  }, [loading, activeSessionId, createSession, appendMessage, onDataReceived])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  return (
    <div className="flex flex-col h-full relative" style={{ background: 'var(--bg-surface)' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'color-mix(in srgb, var(--cyan) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--cyan) 30%, transparent)' }}>
          <Sparkles size={14} style={{ color: 'var(--cyan)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-display font-semibold" style={{ color: 'var(--text-primary)' }}>Query Assistant</h2>
          <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>O2C Dataset · Groq · Llama 3.3</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--emerald)' }} />
            <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>live</span>
          </div>
          {/* History toggle */}
          <button onClick={() => setShowHistory(v => !v)}
            title="Chat history"
            className="relative w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{
              background: showHistory ? 'color-mix(in srgb, var(--cyan) 12%, transparent)' : 'transparent',
              border: `1px solid ${showHistory ? 'color-mix(in srgb, var(--cyan) 30%, transparent)' : 'var(--border)'}`,
              color: showHistory ? 'var(--cyan)' : 'var(--text-secondary)',
            }}>
            <History size={13} />
            {sessions.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-center text-[9px] font-mono leading-3.5"
                style={{ background: 'var(--cyan)', color: 'var(--bg-base)' }}>
                {sessions.length > 9 ? '9+' : sessions.length}
              </span>
            )}
          </button>
          {/* New chat */}
          <button onClick={newChat} title="New conversation"
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            <Plus size={13} />
          </button>
        </div>
      </div>

      {/* ── History Sidebar ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, x: 300 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute inset-0 z-30 flex flex-col"
            style={{ background: 'var(--bg-surface)' }}>
            {/* History header */}
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2">
                <History size={14} style={{ color: 'var(--cyan)' }} />
                <span className="text-sm font-display font-semibold" style={{ color: 'var(--text-primary)' }}>
                  History ({sessions.length})
                </span>
              </div>
              <div className="flex items-center gap-2">
                {sessions.length > 0 && (
                  <button onClick={clearAll}
                    className="text-xs font-mono px-2 py-1 rounded-md transition-colors"
                    style={{ color: 'var(--rose)', border: '1px solid color-mix(in srgb, var(--rose) 30%, transparent)' }}>
                    Clear all
                  </button>
                )}
                <button onClick={() => setShowHistory(false)}
                  className="w-6 h-6 rounded-md flex items-center justify-center"
                  style={{ color: 'var(--text-muted)' }}>
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Session list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2">
                  <History size={24} style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>No history yet</p>
                </div>
              ) : (
                sessions.map((session: any, i: number) => (
                  <motion.div key={session.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => loadSession(session.id)}
                    className="group flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all"
                    style={{
                      background: activeSessionId === session.id
                        ? 'color-mix(in srgb, var(--cyan) 8%, transparent)'
                        : 'var(--bg-elevated)',
                      border: `1px solid ${activeSessionId === session.id
                        ? 'color-mix(in srgb, var(--cyan) 25%, transparent)'
                        : 'var(--border)'}`,
                    }}>
                    <Sparkles size={12} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--cyan)' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono truncate" style={{ color: 'var(--text-primary)' }}>
                        {session.title}
                      </p>
                      <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {new Date(session.createdAt).toLocaleDateString()} ·{' '}
                        {session.messages.filter((m: any) => m.role === 'user').length} queries
                      </p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); deleteSession(session.id) }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: 'var(--text-muted)' }}>
                      <Trash2 size={12} />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Messages ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
        </AnimatePresence>

        {/* Loading dots */}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'color-mix(in srgb, var(--cyan) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--cyan) 30%, transparent)' }}>
                <Sparkles size={11} style={{ color: 'var(--cyan)' }} />
              </div>
              <div className="px-4 py-3 rounded-xl rounded-tl-sm"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <div className="flex gap-1 items-center h-4">
                  {[0,1,2].map(i => (
                    <motion.div key={i} className="w-1.5 h-1.5 rounded-full"
                      style={{ background: 'color-mix(in srgb, var(--cyan) 60%, transparent)' }}
                      animate={{ scale:[1,1.5,1], opacity:[0.4,1,0.4] }}
                      transition={{ duration:1, repeat:Infinity, delay:i*0.2 }} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* ── Suggested queries ────────────────────────────────────────────── */}
      {messages.length <= 1 && (
        <div className="px-4 pb-3 flex-shrink-0">
          <p className="text-xs font-mono px-1 mb-2" style={{ color: 'var(--text-muted)' }}>Suggested</p>
          <div className="flex flex-col gap-1.5">
            {SUGGESTED.map(q => (
              <button key={q} onClick={() => sendMessage(q)}
                className="text-left text-xs px-3 py-2 rounded-lg font-mono truncate transition-all"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = 'var(--cyan)'
                  e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--cyan) 30%, transparent)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'var(--text-secondary)'
                  e.currentTarget.style.borderColor = 'var(--border)'
                }}>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input ────────────────────────────────────────────────────────── */}
      <div className="px-4 pb-4 pt-2 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about orders, deliveries, billing…"
            rows={1} disabled={loading}
            className="flex-1 rounded-xl px-4 py-3 text-sm font-mono resize-none focus:outline-none transition-all disabled:opacity-50"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              minHeight: '44px', maxHeight: '120px',
            }}
            onFocus={e => e.target.style.borderColor = 'color-mix(in srgb, var(--cyan) 50%, transparent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          <motion.button onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()} whileTap={{ scale: 0.92 }}
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: 'color-mix(in srgb, var(--cyan) 12%, transparent)',
              border: '1px solid color-mix(in srgb, var(--cyan) 30%, transparent)',
              color: 'var(--cyan)',
            }}>
            <Send size={15} />
          </motion.button>
        </div>
        <p className="text-xs font-mono mt-1.5 px-1" style={{ color: 'var(--text-muted)' }}>
          Enter to send · Shift+Enter for newline
        </p>
      </div>
    </div>
  )
}

// ── Message Bubble ─────────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const [showSql,  setShowSql]  = useState(false)
  const [showData, setShowData] = useState(false)
  const isUser  = message.role === 'user'
  const isError = message.role === 'error'

  return (
    <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
      transition={{ duration:0.25, ease:'easeOut' }}
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>

      {!isUser && (
        <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
          style={isError
            ? { background:'color-mix(in srgb,var(--rose) 10%,transparent)', border:'1px solid color-mix(in srgb,var(--rose) 30%,transparent)' }
            : { background:'color-mix(in srgb,var(--cyan) 10%,transparent)', border:'1px solid color-mix(in srgb,var(--cyan) 30%,transparent)' }}>
          {isError
            ? <AlertTriangle size={11} style={{ color:'var(--rose)' }} />
            : <Sparkles      size={11} style={{ color:'var(--cyan)' }} />}
        </div>
      )}

      <div className={`flex flex-col gap-2 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Bubble */}
        <div className="px-4 py-3 rounded-xl text-sm leading-relaxed"
          style={isUser
            ? { background:'color-mix(in srgb,var(--cyan) 10%,transparent)', border:'1px solid color-mix(in srgb,var(--cyan) 20%,transparent)', color:'var(--text-primary)', borderRadius:'12px 4px 12px 12px' }
            : isError
              ? { background:'color-mix(in srgb,var(--rose) 8%,transparent)', border:'1px solid color-mix(in srgb,var(--rose) 25%,transparent)', color:'var(--rose)', borderRadius:'4px 12px 12px 12px' }
              : message.isOffTopic
                ? { background:'color-mix(in srgb,var(--amber) 6%,transparent)', border:'1px solid color-mix(in srgb,var(--amber) 25%,transparent)', color:'var(--text-primary)', borderRadius:'4px 12px 12px 12px' }
                : { background:'var(--bg-elevated)', border:'1px solid var(--border)', color:'var(--text-primary)', borderRadius:'4px 12px 12px 12px' }}>
          {message.isOffTopic && (
            <div className="flex items-center gap-2 mb-2 pb-2" style={{ borderBottom:'1px solid color-mix(in srgb,var(--amber) 25%,transparent)' }}>
              <AlertTriangle size={12} style={{ color:'var(--amber)' }} />
              <span className="text-xs font-mono font-semibold" style={{ color:'var(--amber)' }}>Off-topic query</span>
            </div>
          )}
          <p className={`whitespace-pre-wrap ${isUser ? 'font-mono text-xs' : 'text-sm'}`}>{message.content}</p>
        </div>

        {/* SQL toggle */}
        {message.sql && (
          <div className="w-full">
            <button onClick={() => setShowSql(v=>!v)}
              className="flex items-center gap-1.5 text-xs font-mono transition-colors"
              style={{ color:'var(--text-muted)' }}
              onMouseEnter={e => e.currentTarget.style.color='var(--cyan)'}
              onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}>
              <Code2 size={11}/> {showSql?'Hide':'Show'} SQL {showSql?<ChevronUp size={10}/>:<ChevronDown size={10}/>}
            </button>
            <AnimatePresence>
              {showSql && (
                <motion.pre initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
                  className="mt-2 p-3 rounded-lg text-xs font-mono overflow-x-auto"
                  style={{ background:'var(--bg-base)', border:'1px solid var(--border)', color:'var(--emerald)' }}>
                  {message.sql}
                </motion.pre>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Data table toggle */}
        {message.data && message.data.length > 0 && (
          <div className="w-full">
            <button onClick={() => setShowData(v=>!v)}
              className="flex items-center gap-1.5 text-xs font-mono transition-colors"
              style={{ color:'var(--text-muted)' }}
              onMouseEnter={e => e.currentTarget.style.color='var(--cyan)'}
              onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}>
              <Table size={11}/> {showData?'Hide':'View'} {message.rowCount??message.data.length} rows
              {showData?<ChevronUp size={10}/>:<ChevronDown size={10}/>}
            </button>
            <AnimatePresence>
              {showData && (
                <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
                  className="mt-2 overflow-hidden rounded-lg" style={{ border:'1px solid var(--border)' }}>
                  <DataTable records={message.data.slice(0,20)} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <span className="text-xs font-mono px-1" style={{ color:'var(--text-muted)' }}>
          {message.timestamp.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
        </span>
      </div>
    </motion.div>
  )
}

function DataTable({ records }: { records: EntityRecord[] }) {
  if (!records.length) return null
  const columns = Object.keys(records[0]).slice(0,6)
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr style={{ background:'var(--bg-base)' }}>
            {columns.map(col => (
              <th key={col} className="px-3 py-2 text-left whitespace-nowrap font-medium"
                style={{ color:'var(--text-muted)', borderBottom:'1px solid var(--border)' }}>
                {col.replace(/_/g,' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((row,i) => (
            <tr key={i} style={{ background: i%2===0 ? 'var(--bg-elevated)' : 'var(--bg-surface)', borderBottom:'1px solid var(--border)' }}>
              {columns.map(col => (
                <td key={col} className="px-3 py-1.5 whitespace-nowrap max-w-[120px] overflow-hidden text-ellipsis"
                  style={{ color:'var(--text-primary)' }}>
                  {row[col]===null ? <span style={{color:'var(--text-muted)'}}>—</span> : String(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}