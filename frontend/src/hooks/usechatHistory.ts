

import { useState, useEffect, useCallback } from 'react'
import type { ChatMessage } from '../types'

const STORAGE_KEY  = 'o2c-chat-history'
const MAX_SESSIONS = 20

export interface ChatSession {
  id:        string
  title:     string          // First user message (truncated)
  messages:  ChatMessage[]
  createdAt: string
}

function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const sessions = JSON.parse(raw) as ChatSession[]
    // Rehydrate Date objects
    return sessions.map(s => ({
      ...s,
      messages: s.messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) })),
    }))
  } catch {
    return []
  }
}

function saveSessions(sessions: ChatSession[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS)))
}

export function useChatHistory() {
  const [sessions,        setSessions]        = useState<ChatSession[]>(loadSessions)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)

  // Persist whenever sessions change
  useEffect(() => {
    saveSessions(sessions)
  }, [sessions])

  const createSession = useCallback((firstMessage: ChatMessage): string => {
    const id = `session-${Date.now()}`
    const title = firstMessage.content.slice(0, 50)
    const session: ChatSession = {
      id,
      title,
      messages:  [firstMessage],
      createdAt: new Date().toISOString(),
    }
    setSessions(prev => [session, ...prev])
    setActiveSessionId(id)
    return id
  }, [])

  const appendMessage = useCallback((sessionId: string, message: ChatMessage) => {
    setSessions(prev =>
      prev.map(s =>
        s.id === sessionId
          ? { ...s, messages: [...s.messages, message] }
          : s
      )
    )
  }, [])

  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId))
    setActiveSessionId(prev => prev === sessionId ? null : prev)
  }, [])

  const clearAll = useCallback(() => {
    setSessions([])
    setActiveSessionId(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const getSession = useCallback((id: string) =>
    sessions.find(s => s.id === id) ?? null,
  [sessions])

  return {
    sessions,
    activeSessionId,
    setActiveSessionId,
    createSession,
    appendMessage,
    deleteSession,
    clearAll,
    getSession,
  }
}