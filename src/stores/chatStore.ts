import { create } from 'zustand'
import type { ChatMessage } from '../brain/types'
import { streamChat } from '../api/chatApi'

interface ChatStore {
  messages: ChatMessage[]
  isStreaming: boolean
  currentText: string
  isOpen: boolean
  sessionId: string

  // 动作
  openChat: () => void
  closeChat: () => void
  sendMessage: (content: string) => Promise<void>
  clearMessages: () => void
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isStreaming: false,
  currentText: '',
  isOpen: false,
  sessionId: 'pet-default', // 桌宠使用固定 session

  openChat: () => set({ isOpen: true }),

  closeChat: () => set({ isOpen: false }),

  sendMessage: async (content: string) => {
    const { sessionId, messages } = get()

    // 添加用户消息
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }
    set({ messages: [...messages, userMsg], isStreaming: true, currentText: '' })

    try {
      let fullText = ''
      const abortController = new AbortController()

      for await (const chunk of streamChat(sessionId, content, abortController.signal)) {
        if (chunk.type === 'text') {
          fullText += chunk.content
          set({ currentText: fullText })
        }
      }

      // 流式结束，添加完整的 AI 消息
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
      set({ isStreaming: false, currentText: '' })
    }
  },

  clearMessages: () => set({ messages: [] }),
}))
