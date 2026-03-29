import { create } from 'zustand'
import type { ChatMessage } from '../brain/types'
import { streamChat, fetchPetMessages } from '../api/chatApi'
import { usePetStore } from './petStore'
import { client } from '../api/client'

const PET_SESSION_KEY = 'chenpet_session_id'

interface ChatStore {
  messages: ChatMessage[]
  isStreaming: boolean
  currentText: string
  isOpen: boolean
  sessionId: string
  initialized: boolean

  initSession: () => Promise<void>
  openChat: () => void
  closeChat: () => void
  sendMessage: (content: string) => Promise<void>
  loadHistory: () => Promise<void>
  clearMessages: () => void
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isStreaming: false,
  currentText: '',
  isOpen: false,
  sessionId: '',
  initialized: false,

  /** 初始化桌宠专属 session（首次创建，之后复用） */
  initSession: async () => {
    if (get().initialized) return

    // 先从本地存储恢复
    const stored = localStorage.getItem(PET_SESSION_KEY)
    if (stored) {
      set({ sessionId: stored, initialized: true })
      return
    }

    // 创建新 session
    try {
      const result = await client.post<{ id: string }>('/api/sessions', {
        scene_type: 'pet',
        model: 'zenmux/claude-opus-4.6',
        title: 'ClaudePet 桌宠对话',
      })
      if (result?.id) {
        localStorage.setItem(PET_SESSION_KEY, result.id)
        set({ sessionId: result.id, initialized: true })
      }
    } catch (err) {
      console.error('Failed to create pet session:', err)
      // fallback
      set({ sessionId: 'pet-default', initialized: true })
    }
  },

  openChat: () => {
    const { initialized, initSession, loadHistory } = get()
    set({ isOpen: true })
    usePetStore.getState().setBehaviorState('CHATTING')
    if (!initialized) initSession().then(() => loadHistory())
    else if (get().messages.length === 0) loadHistory()
  },

  closeChat: () => {
    set({ isOpen: false })
    const pet = usePetStore.getState()
    pet.setBehaviorState('IDLE')
    pet.setMood('happy')
    setTimeout(() => {
      if (usePetStore.getState().mood === 'happy') {
        usePetStore.getState().setMood('idle')
      }
    }, 5000)
  },

  /** 加载历史消息 */
  loadHistory: async () => {
    const { sessionId } = get()
    if (!sessionId) return
    try {
      const msgs = await fetchPetMessages(sessionId)
      if (msgs.length > 0) {
        set({ messages: msgs })
      }
    } catch (err) {
      console.error('Failed to load history:', err)
    }
  },

  sendMessage: async (content: string) => {
    const state = get()
    // 确保 session 已初始化
    if (!state.initialized) await state.initSession()
    const { sessionId, messages } = get()
    const pet = usePetStore.getState()

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }
    set({ messages: [...messages, userMsg], isStreaming: true, currentText: '' })

    pet.setAnimation('thinking')

    try {
      let fullText = ''
      let startedTyping = false
      const abortController = new AbortController()

      for await (const chunk of streamChat(sessionId, content, abortController.signal)) {
        if (chunk.type === 'text') {
          fullText += chunk.content
          set({ currentText: fullText })
          if (!startedTyping) {
            pet.setAnimation('typing')
            startedTyping = true
          }
        }
      }

      pet.setAnimation('happy')
      setTimeout(() => {
        if (usePetStore.getState().animation === 'happy') {
          pet.setAnimation('idle_stand')
        }
      }, 3000)

      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: fullText,
        createdAt: new Date().toISOString(),
      }
      set((state) => ({
        messages: [...state.messages, aiMsg],
        isStreaming: false,
        currentText: '',
      }))
    } catch (err) {
      console.error('Chat error:', err)
      pet.setAnimation('error')
      setTimeout(() => pet.setAnimation('idle_stand'), 3000)
      set({ isStreaming: false, currentText: '' })
    }
  },

  clearMessages: () => set({ messages: [] }),
}))
