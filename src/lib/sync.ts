import type { AppData } from '../types'

const STORAGE_KEY = 'lubimaya-life-os-v1'
const SYNC_META_KEY = 'lubimaya-sync-meta'

export type SyncMeta = {
  code: string
  blobId?: string
  lastSyncAt?: string
  deviceId: string
}

function deviceId() {
  const key = 'lubimaya-device-id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}

export function loadLocal(): AppData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AppData
  } catch {
    return null
  }
}

export function saveLocal(data: AppData) {
  const next = { ...data, updatedAt: new Date().toISOString() }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

export function getSyncMeta(): SyncMeta | null {
  try {
    const raw = localStorage.getItem(SYNC_META_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SyncMeta
  } catch {
    return null
  }
}

export function setSyncMeta(meta: SyncMeta) {
  localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta))
}

export function createSyncCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  for (const b of bytes) code += alphabet[b % alphabet.length]
  return `${code.slice(0, 4)}-${code.slice(4)}`
}

/** Cloud sync via JSONBlob (free, CORS). Same sync code + blob id on all devices. */
export async function pushCloud(data: AppData, meta: SyncMeta): Promise<SyncMeta> {
  const payload = {
    code: meta.code,
    deviceId: meta.deviceId || deviceId(),
    updatedAt: data.updatedAt,
    data,
  }

  if (meta.blobId) {
    const res = await fetch(`https://jsonblob.com/api/jsonBlob/${meta.blobId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('Не удалось сохранить в облако')
    const next = { ...meta, lastSyncAt: new Date().toISOString(), deviceId: payload.deviceId }
    setSyncMeta(next)
    return next
  }

  const res = await fetch('https://jsonblob.com/api/jsonBlob', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Не удалось создать облачную синхронизацию')
  const location = res.headers.get('Location') || ''
  const blobId = location.split('/').pop()
  if (!blobId) throw new Error('Облако не вернуло идентификатор')
  const next = {
    ...meta,
    blobId,
    lastSyncAt: new Date().toISOString(),
    deviceId: payload.deviceId,
  }
  setSyncMeta(next)
  return next
}

export async function pullCloud(blobId: string): Promise<{ data: AppData; code: string } | null> {
  const res = await fetch(`https://jsonblob.com/api/jsonBlob/${blobId}`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) return null
  const payload = await res.json()
  if (!payload?.data) return null
  return { data: payload.data as AppData, code: payload.code as string }
}

export function exportJson(data: AppData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `lubimaya-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importJsonFile(file: File): Promise<AppData> {
  const text = await file.text()
  return JSON.parse(text) as AppData
}

export function mergeData(local: AppData, remote: AppData): AppData {
  if (new Date(remote.updatedAt).getTime() >= new Date(local.updatedAt).getTime()) {
    return remote
  }
  return local
}

export { deviceId }
