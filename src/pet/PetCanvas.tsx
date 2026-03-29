import { useEffect, useRef } from 'react'
import { usePetStore } from '../stores/petStore'
import type { AnimationName } from '../brain/types'

/**
 * 像素角色渲染层
 * MVP 阶段用 Canvas 绘制占位方块 + 简单动画
 * 正式美术接入后替换为 PixiJS sprite sheet
 */

/** 占位色 — 不同状态不同颜色，方便调试 */
const ANIMATION_COLORS: Record<AnimationName, string> = {
  idle_stand: '#A0785A',
  idle_sit:   '#8D6E63',
  walk_left:  '#A0785A',
  walk_right: '#A0785A',
  sleep:      '#BCAAA4',
  happy:      '#FFB74D',
  bored:      '#90A4AE',
  sulking:    '#78909C',
  wave:       '#FFB74D',
  knock:      '#FF8A65',
}

const PET_SIZE = 64
const CANVAS_W = 200
const CANVAS_H = 200

export default function PetCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { animation, direction, onPetClicked } = usePetStore()
  const frameRef = useRef(0)
  const animFrameRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let running = true

    function draw() {
      if (!ctx || !running) return
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

      const color = ANIMATION_COLORS[animation] || '#A0785A'

      // 简单的呼吸动画：y 轴微微上下
      const breathOffset = Math.sin(frameRef.current * 0.05) * 2
      const x = (CANVAS_W - PET_SIZE) / 2
      const y = CANVAS_H - PET_SIZE - 10 + breathOffset

      // 身体
      ctx.fillStyle = color
      ctx.fillRect(x, y, PET_SIZE, PET_SIZE)

      // 眼睛（朝向不同位置不同）
      ctx.fillStyle = '#FFF'
      const eyeOffsetX = direction === 'right' ? 12 : 4
      ctx.fillRect(x + eyeOffsetX, y + 16, 12, 12)
      ctx.fillRect(x + eyeOffsetX + 24, y + 16, 12, 12)

      // 瞳孔
      ctx.fillStyle = '#332A22'
      const pupilShift = direction === 'right' ? 4 : 0
      ctx.fillRect(x + eyeOffsetX + pupilShift + 2, y + 20, 6, 6)
      ctx.fillRect(x + eyeOffsetX + 24 + pupilShift + 2, y + 20, 6, 6)

      // 睡觉状态：画 ZZZ
      if (animation === 'sleep') {
        ctx.fillStyle = '#5D4037'
        ctx.font = '14px monospace'
        const zzz = 'z'.repeat(((frameRef.current >> 5) % 3) + 1)
        ctx.fillText(zzz, x + PET_SIZE + 4, y - 4)
      }

      // 开心状态：画爱心
      if (animation === 'happy') {
        ctx.fillStyle = '#E91E63'
        ctx.font = '16px serif'
        ctx.fillText('♥', x + PET_SIZE / 2 - 6, y - 8)
      }

      // 敲屏幕状态：画感叹号
      if (animation === 'knock') {
        ctx.fillStyle = '#FF5722'
        ctx.font = 'bold 18px monospace'
        ctx.fillText('!', x + PET_SIZE / 2 - 4, y - 8)
      }

      frameRef.current++
      animFrameRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      running = false
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [animation, direction])

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      onClick={onPetClicked}
      className="cursor-pointer"
      style={{ imageRendering: 'pixelated' }}
    />
  )
}
