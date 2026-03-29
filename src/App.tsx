import { useEffect, useCallback, useState, useRef } from 'react'
import PetCanvas from './pet/PetCanvas'
import BubbleOverlay from './pet/BubbleOverlay'
import ChatWindow from './chat/ChatWindow'
import NoteOverlay from './pet/NoteOverlay'
import { usePetStore } from './stores/petStore'
import { useChatStore } from './stores/chatStore'
import { collectSignals, recordInteraction, recordPush } from './brain/perception'
import { decide, computeMood } from './brain/decision'
import { actionToPromptType } from './brain/action'
import { generatePush } from './api/petApi'

const IS_TAURI = !!(window as any).__TAURI_INTERNALS__
/** URL 参数判断：?mode=chat 时渲染聊天窗口 */
const IS_CHAT_MODE = new URLSearchParams(window.location.search).get('mode') === 'chat'

const BRAIN_TICK_INTERVAL = 60_000
const WALK_TICK_INTERVAL = 3_000

async function ensureAuth() {
  if (localStorage.getItem('token')) return true
  const password = prompt('输入密码~')
  if (!password) return false
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (!res.ok) { alert('密码不对哦'); return false }
    const data = await res.json()
    localStorage.setItem('token', data.token)
    return true
  } catch { alert('连接失败'); return false }
}

/** 聊天模式 — 独立窗口里只渲染聊天界面 */
function ChatApp() {
  const [authed, setAuthed] = useState(!!localStorage.getItem('token'))
  const { isOpen, openChat, initSession, loadHistory } = useChatStore()

  useEffect(() => {
    if (!authed) ensureAuth().then(ok => setAuthed(ok))
  }, [authed])

  // 聊天窗口自动打开并加载历史
  useEffect(() => {
    if (authed && !isOpen) {
      openChat()
      initSession().then(() => loadHistory())
    }
  }, [authed])

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'var(--color-chat-bg)',
        borderRadius: IS_TAURI ? '12px' : '0',
        overflow: 'hidden',
      }}
    >
      <ChatWindow />
    </div>
  )
}

/** 角色模式 — 主窗口只渲染角色 */
function PetApp() {
  const [authed, setAuthed] = useState(!!localStorage.getItem('token'))
  const {
    mood, setMood, showBubble, setBehaviorState,
    setAnimation, positionX, setPositionX, setDirection,
  } = usePetStore()

  const moodRef = useRef(mood)
  moodRef.current = mood

  useEffect(() => {
    if (!authed) ensureAuth().then(ok => setAuthed(ok))
  }, [authed])

  const brainTick = useCallback(async () => {
    if (useChatStore.getState().isOpen) return
    const signals = collectSignals()
    const currentMood = moodRef.current

    const newMood = computeMood(signals, currentMood)
    if (newMood !== currentMood) setMood(newMood)

    const decision = decide(signals, newMood)
    if (decision.action === 'NONE') return

    setBehaviorState('WANTING')
    setAnimation('notification')

    try {
      const promptType = actionToPromptType(decision.action)
      const result = await generatePush(promptType, decision.reason)
      showBubble(result.content, 8000)
      recordPush()
    } catch (err) {
      console.error('Push generation failed:', err)
      const fallbacks: Record<string, string> = {
        'lunch_time_idle': 'Dream～该吃午饭啦！',
        'dinner_time_idle': '晚饭时间到了，别忘了吃饭呀',
        'late_night': '很晚了哦，早点休息～',
        'idle_3h': '你好久没理我了...',
        'idle_5h': 'Dream？你还在吗...',
        'first_boot_morning': '早安 Dream~',
        'hydration_reminder': '记得喝水呀~',
      }
      showBubble(fallbacks[decision.reason] || '...想你了', 5000)
    }

    setTimeout(() => {
      const state = usePetStore.getState()
      if (state.behaviorState === 'WANTING') {
        setBehaviorState('SULKING')
        setAnimation('sulking')
        setTimeout(() => {
          if (usePetStore.getState().behaviorState === 'SULKING') {
            setBehaviorState('IDLE')
            setMood('idle')
          }
        }, 120_000)
      }
    }, 60_000)
  }, [setMood, showBubble, setBehaviorState, setAnimation])

  useEffect(() => {
    const firstTimer = setTimeout(brainTick, 3000)
    const timer = setInterval(brainTick, BRAIN_TICK_INTERVAL)
    return () => { clearTimeout(firstTimer); clearInterval(timer) }
  }, [brainTick])

  useEffect(() => {
    const timer = setInterval(() => {
      const state = usePetStore.getState()
      if (state.behaviorState !== 'IDLE' || useChatStore.getState().isOpen) return
      if (state.mood !== 'idle' && state.mood !== 'bored') return

      if (Math.random() < 0.4) {
        const step = 0.05
        const goRight = state.positionX < 0.8 && (state.positionX < 0.2 || Math.random() > 0.5)
        const newX = goRight ? state.positionX + step : state.positionX - step
        setPositionX(newX)
        setDirection(goRight ? 'right' : 'left')
        setAnimation(goRight ? 'walk_right' : 'walk_left')
        setTimeout(() => {
          const a = usePetStore.getState().animation
          if (a === 'walk_right' || a === 'walk_left') setAnimation('idle_stand')
        }, 2000)
      }
    }, WALK_TICK_INTERVAL)
    return () => clearInterval(timer)
  }, [setPositionX, setDirection, setAnimation])

  useEffect(() => {
    const handler = () => recordInteraction()
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [])

  return (
    <div
      data-tauri-drag-region
      style={{
        width: 200,
        height: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
      }}
    >
      <BubbleOverlay />
      <PetCanvas />
      <NoteOverlay />

      {/* 浏览器模式下保留 overlay 聊天 */}
      {!IS_TAURI && <ChatWindow />}
    </div>
  )
}

export default function App() {
  return IS_CHAT_MODE ? <ChatApp /> : <PetApp />
}
