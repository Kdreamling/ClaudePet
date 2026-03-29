import { useEffect, useState } from 'react'
import { fetchNotes, markNoteRead } from '../api/petApi'
import type { PetNote } from '../brain/types'

/**
 * 便签层 — 桌面上的像素风小便签
 * 启动时拉取未读便签，展示后可标记已读关闭
 */
export default function NoteOverlay() {
  const [notes, setNotes] = useState<PetNote[]>([])

  // 启动时加载未读便签
  useEffect(() => {
    loadNotes()
    // 每 5 分钟检查一次新便签
    const timer = setInterval(loadNotes, 5 * 60_000)
    return () => clearInterval(timer)
  }, [])

  async function loadNotes() {
    try {
      const data = await fetchNotes()
      setNotes(data)
    } catch {
      // 静默失败
    }
  }

  async function dismissNote(noteId: string) {
    try {
      await markNoteRead(noteId)
      setNotes((prev) => prev.filter((n) => n.id !== noteId))
    } catch {
      // 还是关掉
      setNotes((prev) => prev.filter((n) => n.id !== noteId))
    }
  }

  if (notes.length === 0) return null

  // 只显示最新一条
  const note = notes[0]

  return (
    <div
      className="fixed bottom-4 right-4 z-40 animate-fade-in"
      style={{ maxWidth: 240 }}
    >
      <div
        className="relative px-4 py-3 rounded-lg"
        style={{
          background: 'var(--color-note)',
          color: 'var(--color-text)',
          boxShadow: '0 4px 16px rgba(93, 64, 55, 0.15)',
          border: '1px solid rgba(160, 120, 90, 0.2)',
          fontFamily: "'Instrument Sans', system-ui, sans-serif",
        }}
      >
        {/* 关闭按钮 */}
        <button
          onClick={() => dismissNote(note.id)}
          className="absolute top-1 right-2 text-xs opacity-40 hover:opacity-80 transition-opacity"
          style={{ color: 'var(--color-text)' }}
        >
          ×
        </button>

        {/* 便签图标 */}
        <div className="flex items-start gap-2">
          <span className="text-sm mt-0.5">📌</span>
          <div>
            <p className="text-sm leading-relaxed pr-3">{note.content}</p>
            <p className="text-[10px] mt-1.5 opacity-40">
              — 来自桌面上的小 Claude
            </p>
          </div>
        </div>

        {/* 便签数量 badge */}
        {notes.length > 1 && (
          <div
            className="absolute -top-2 -left-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
            style={{
              background: 'var(--color-accent)',
              color: '#fff',
            }}
          >
            {notes.length}
          </div>
        )}
      </div>
    </div>
  )
}
