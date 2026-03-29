import { useEffect, useRef } from 'react'
import { usePetStore } from '../stores/petStore'
import type { AnimationName } from '../brain/types'
import { SPRITE_FRAMES, PALETTE } from './sprites'

/**
 * 像素角色渲染层
 * 从 sprites.ts 读取像素数据，逐像素绘制到 Canvas
 * imageRendering: pixelated 保证像素锐利不模糊
 */

const SPRITE_SIZE = 32   // sprite 原始尺寸
const SCALE = 4          // 放大倍数（32 * 4 = 128px 显示尺寸）
const CANVAS_W = 200
const CANVAS_H = 200
const ANIM_SPEED = 40    // 每 N 帧切换一次动画帧（越大越慢）

export default function PetCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { animation, direction, onPetClicked } = usePetStore()
  const tickRef = useRef(0)
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

      // 获取当前动画帧序列
      const frames = SPRITE_FRAMES[animation] || SPRITE_FRAMES.idle_stand
      const frameIndex = Math.floor(tickRef.current / ANIM_SPEED) % frames.length
      const pixelData = frames[frameIndex]

      // 呼吸动画：y 轴微微上下浮动
      const breathOffset = Math.sin(tickRef.current * 0.04) * 1.5

      // 居中绘制
      const drawSize = SPRITE_SIZE * SCALE
      const offsetX = (CANVAS_W - drawSize) / 2
      const offsetY = CANVAS_H - drawSize - 8 + breathOffset

      // 逐像素绘制
      const flipH = direction === 'left'
      for (let y = 0; y < SPRITE_SIZE; y++) {
        const row = pixelData[y]
        if (!row) continue
        for (let x = 0; x < SPRITE_SIZE; x++) {
          const colorIdx = row[flipH ? (SPRITE_SIZE - 1 - x) : x]
          if (!colorIdx) continue // 跳过透明

          const color = PALETTE[colorIdx]
          if (!color || color === 'transparent') continue

          ctx.fillStyle = color
          ctx.fillRect(
            Math.floor(offsetX + x * SCALE),
            Math.floor(offsetY + y * SCALE),
            SCALE,
            SCALE,
          )
        }
      }

      // 特效层
      if (animation === 'happy') {
        // 爱心飘起
        const heartY = offsetY - 12 - Math.sin(tickRef.current * 0.08) * 6
        ctx.fillStyle = '#E91E63'
        ctx.font = `${16}px serif`
        ctx.fillText('♥', offsetX + drawSize / 2 - 6, heartY)
      }

      if (animation === 'sleep') {
        // ZZZ 浮动
        const zCount = (Math.floor(tickRef.current / 30) % 3) + 1
        ctx.fillStyle = '#8D6E63'
        ctx.font = '14px monospace'
        ctx.fillText('z'.repeat(zCount), offsetX + drawSize + 4, offsetY + 10)
      }

      if (animation === 'knock') {
        // 感叹号闪烁
        if (Math.floor(tickRef.current / 20) % 2 === 0) {
          ctx.fillStyle = '#FF5722'
          ctx.font = 'bold 18px monospace'
          ctx.fillText('!', offsetX + drawSize / 2 - 4, offsetY - 8)
        }
      }

      if (animation === 'bored') {
        // 叹气省略号
        ctx.fillStyle = '#8D6E63'
        ctx.font = '12px monospace'
        ctx.fillText('...', offsetX + drawSize + 2, offsetY + drawSize / 2)
      }

      tickRef.current++
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
