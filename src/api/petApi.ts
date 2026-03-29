import { client } from './client'
import type { PetState, PetNote } from '../brain/types'

/** 获取宠物状态 */
export function fetchPetState() {
  return client.get<PetState>('/pet/state')
}

/** 上报交互事件（更新 last_interaction_at 等） */
export function updatePetState(data: Partial<PetState>) {
  return client.post<PetState>('/pet/state/update', data)
}

/** 生成主动推送内容 */
export function generatePush(pushType: string, triggerReason: string) {
  return client.post<{ content: string; push_id: string }>('/pet/push/generate', {
    push_type: pushType,
    trigger_reason: triggerReason,
  })
}

/** 上报推送反馈（用户是否看了/回复了） */
export function reportPushResponse(pushId: string, response: 'seen' | 'replied' | 'ignored') {
  return client.post('/pet/push/response', { push_id: pushId, response })
}

/** 获取便签列表 */
export function fetchNotes() {
  return client.get<PetNote[]>('/pet/notes')
}

/** 标记便签已读 */
export function markNoteRead(noteId: string) {
  return client.patch(`/pet/notes/${noteId}`, { is_read: true })
}

/** 删除便签 */
export function deleteNote(noteId: string) {
  return client.delete(`/pet/notes/${noteId}`)
}
