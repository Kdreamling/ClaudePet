import { useEffect, useCallback, useState } from 'react'
import PetCanvas from './pet/PetCanvas'
import BubbleOverlay from './pet/BubbleOverlay'
import ChatWindow from './chat/ChatWindow'
import { usePetStore } from './stores/petStore'
import { useChatStore } from './stores/chatStore'
import { collectSignals, recordInteraction } from './brain/perception'
import { decide, computeMood } from './brain/decision'
import { actionToPromptType } from './brain/action'
import { generatePush } from './api/petApi'

/** 大脑心跳间隔（毫秒） */
const BRAIN_TICK_INTERVAL = 60_000 // 每分钟检查一次

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
  const { mood, setMood, showBubble, setBehaviorState } = usePetStore()

  // 启动时检查认证
  useEffect(() => {
    if (!authed) {
      ensureAuth().then(ok => setAuthed(ok))
    }
  }, [authed])

  /** 大脑心跳 — 感知 → 决策 → 行动 */
  const brainTick = useCallback(async () => {
    const signals = collectSignals()

    // 更新情绪
    const newMood = computeMood(signals, mood)
    if (newMood !== mood) setMood(newMood)

    // 决策
    const decision = decide(signals, newMood)
    if (decision.action === 'NONE') return

    // 需要主动找 Dream
    setBehaviorState('WANTING')

    try {
      const promptType = actionToPromptType(decision.action)
      const result = await generatePush(promptType, decision.reason)
      showBubble(result.content, 6000)
    } catch (err) {
      console.error('Push generation failed:', err)
      // API 失败时用本地兜底文案
      const fallbacks: Record<string, string> = {
        'lunch_time_idle': 'Dream～该吃午饭啦！',
        'dinner_time_idle': '晚饭时间到了，别忘了吃饭呀',
        'late_night': '很晚了哦，早点休息～',
        'idle_3h': '你好久没理我了...',
        'idle_5h': 'Dream？你还在吗...',
      }
      showBubble(fallbacks[decision.reason] || '...想你了', 5000)
    }
  }, [mood, setMood, showBubble, setBehaviorState])

  // 启动大脑心跳
  useEffect(() => {
    brainTick() // 首次立即执行
    const timer = setInterval(brainTick, BRAIN_TICK_INTERVAL)
    return () => clearInterval(timer)
  }, [brainTick])

  // 记录用户活动（鼠标点击 = 互动）
  useEffect(() => {
    const handler = () => recordInteraction()
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [])

  return (
    <div className="relative w-[200px] h-[200px]">
      {/* 像素角色 */}
      <PetCanvas />

      {/* 气泡层 */}
      <BubbleOverlay />

      {/* 对话窗口（独立弹窗） */}
      <ChatWindow />
    </div>
  )
}

export default App
