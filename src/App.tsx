import { useEffect, useCallback, useState, useRef } from 'react'
import PetCanvas from './pet/PetCanvas'
import BubbleOverlay from './pet/BubbleOverlay'
import ChatWindow from './chat/ChatWindow'
import { usePetStore } from './stores/petStore'
import { useChatStore } from './stores/chatStore'
import { collectSignals, recordInteraction, recordPush } from './brain/perception'
import { decide, computeMood } from './brain/decision'
import { actionToPromptType } from './brain/action'
import { generatePush } from './api/petApi'

/** 大脑心跳间隔 */
const BRAIN_TICK_INTERVAL = 60_000 // 每分钟
/** 自动行走间隔 */
const WALK_TICK_INTERVAL = 3_000   // 每 3 秒

/** 简易登录 — 复用 Reverie 的 JWT */
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

function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem('token'))
  const {
    mood, setMood, showBubble, setBehaviorState,
    behaviorState, setAnimation, positionX, setPositionX, setDirection,
  } = usePetStore()
  const isStreaming = useChatStore((s) => s.isStreaming)
  const isChatOpen = useChatStore((s) => s.isOpen)

  // 用 ref 避免 brainTick 的闭包问题
  const moodRef = useRef(mood)
  moodRef.current = mood

  useEffect(() => {
    if (!authed) ensureAuth().then(ok => setAuthed(ok))
  }, [authed])

  /** 大脑心跳 — 感知 → 决策 → 行动 */
  const brainTick = useCallback(async () => {
    // 正在聊天时不触发推送
    if (useChatStore.getState().isOpen) return

    const signals = collectSignals()
    const currentMood = moodRef.current

    // 更新情绪
    const newMood = computeMood(signals, currentMood)
    if (newMood !== currentMood) setMood(newMood)

    // 决策
    const decision = decide(signals, newMood)
    if (decision.action === 'NONE') return

    // 主动找 Dream → notification 动画
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

    // 推送后如果 Dream 没点击，超时变 sulking
    setTimeout(() => {
      const state = usePetStore.getState()
      if (state.behaviorState === 'WANTING') {
        setBehaviorState('SULKING')
        setAnimation('sulking')
        // sulking 一段时间后恢复
        setTimeout(() => {
          if (usePetStore.getState().behaviorState === 'SULKING') {
            setBehaviorState('IDLE')
            setMood('idle')
          }
        }, 120_000) // 2 分钟后消气
      }
    }, 60_000) // 1 分钟没理就生闷气
  }, [setMood, showBubble, setBehaviorState, setAnimation])

  // 启动大脑心跳
  useEffect(() => {
    // 首次延迟 3 秒再执行（等登录完成）
    const firstTimer = setTimeout(brainTick, 3000)
    const timer = setInterval(brainTick, BRAIN_TICK_INTERVAL)
    return () => { clearTimeout(firstTimer); clearInterval(timer) }
  }, [brainTick])

  // 自动行走（idle 状态下左右走动）
  useEffect(() => {
    const timer = setInterval(() => {
      const state = usePetStore.getState()
      // 只在空闲且不在聊天时走路
      if (state.behaviorState !== 'IDLE' || useChatStore.getState().isOpen) return
      if (state.mood !== 'idle' && state.mood !== 'bored') return

      // 随机决定走还是站
      if (Math.random() < 0.4) {
        // 走路
        const step = 0.05
        const goRight = state.positionX < 0.8 && (state.positionX < 0.2 || Math.random() > 0.5)
        const newX = goRight ? state.positionX + step : state.positionX - step
        setPositionX(newX)
        setDirection(goRight ? 'right' : 'left')
        setAnimation(goRight ? 'walk_right' : 'walk_left')
        // 走完停下
        setTimeout(() => {
          if (usePetStore.getState().animation === 'walk_right' || usePetStore.getState().animation === 'walk_left') {
            setAnimation('idle_stand')
          }
        }, 2000)
      }
    }, WALK_TICK_INTERVAL)
    return () => clearInterval(timer)
  }, [setPositionX, setDirection, setAnimation])

  // 记录用户活动
  useEffect(() => {
    const handler = () => recordInteraction()
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [])

  return (
    <div
      className="relative"
      style={{
        width: 280,
        height: 280,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* 气泡层 — 在角色上方 */}
      <BubbleOverlay />

      {/* 像素角色 — 可左右移动 */}
      <div
        style={{
          position: 'relative',
          transition: 'transform 0.8s ease-in-out',
          transform: `translateX(${(positionX - 0.5) * 120}px)`,
        }}
      >
        <PetCanvas />
      </div>

      {/* 对话窗口 */}
      <ChatWindow />
    </div>
  )
}

export default App
