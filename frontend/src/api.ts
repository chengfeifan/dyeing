import axios from 'axios'

export const API_BASE = (import.meta as any).env.VITE_API_BASE || 'http://localhost:8000'

export async function apiProcess(formData: FormData) {
  const url = `${API_BASE}/process`
  const { data } = await axios.post(url, formData)
  return data as { data: Record<string, number[]>; meta: any }
}

export async function apiSave(name: string, data: Record<string, number[]>, meta: any = {}) {
  const url = `${API_BASE}/save`
  const { data: res } = await axios.post(url, { name, data, meta })
  return res
}

export async function apiHistory() {
  const url = `${API_BASE}/history`
  const { data } = await axios.get(url)
  return data as { name: string; file: string; timestamp: string }[]
}

export async function apiHistoryItem(name: string) {
  const url = `${API_BASE}/history/${encodeURIComponent(name)}`
  const { data } = await axios.get(url)
  return data as { meta: any; data: Record<string, number[]> }
}

export function apiDownloadCSV(name: string) {
  const url = `${API_BASE}/history/${encodeURIComponent(name)}/csv`
  window.open(url, '_blank')
}

export function apiDownloadBatchZip() {
  const url = `${API_BASE}/export/batch`
  window.open(url, '_blank')
}
