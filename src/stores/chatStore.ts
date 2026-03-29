import { create } from 'zustand'
import type { ChatMessage } from '../brain/types'
import { streamChat } from '../api/chatApi'
import { usePetStore } from './petStore'

interface ChatStore {
  messages: ChatMessage[]
  isStreaming: boolean
  currentText: string
  isOpen: boolean
  sessionId: string

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
  sessionId: 'pet-default',

  openChat: () => {
    set({ isOpen: true })
    // 打开聊天 → 进入聊天状态
    usePetStore.getState().setBehaviorState('CHATTING')
  },

  closeChat: () => {
    set({ isOpen: false })
    // 关闭聊天 → 回到空闲，短暂开心
    const pet = usePetStore.getState()
    pet.setBehaviorState('IDLE')
    pet.setMood('happy')
    // 5 秒后恢复 idle
    setTimeout(() => {
      if (usePetStore.getState().mood === 'happy') {
        usePetStore.getState().setMood('idle')
      }
    }, 5000)
  },

  sendMessage: async (content: string) => {
    const { sessionId, messages } = get()
    const pet = usePetStore.getState()

    // 添加用户消息
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }
    set({ messages: [...messages, userMsg], isStreaming: true, currentText: '' })

    // 发送时 → thinking 动画
    pet.setAnimation('thinking')

    try {
      let fullText = ''
      let startedTyping = false
      const abortController = new AbortController()

      for await (const chunk of streamChat(sessionId, content, abortController.signal)) {
        if (chunk.type === 'text') {
          fullText += chunk.content
          set({ currentText: fullText })
          // 第一个字到达 → 切换到 typing 动画
          if (!startedTyping) {
            pet.setAnimation('typing')
            startedTyping = true
          }
        }
      }

      // 流式结束 → happy 动画
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
      // 出错 → error 动画
      pet.setAnimation('error')
      setTimeout(() => pet.setAnimation('idle_stand'), 3000)
      set({ isStreaming: false, currentText: '' })
    }
  },

  clearMessages: () => set({ messages: [] }),
}))
