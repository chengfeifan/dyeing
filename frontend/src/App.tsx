import { useEffect, useMemo, useState } from 'react'
import BeautifulChart from './components/Chart'
import {
  apiProcess,
  apiSave,
  apiHistory,
  apiHistoryItem,
  apiDownloadBatchZip,
  apiDownloadCSV,
} from './api'

const primaryButton =
  'inline-flex items-center justify-center rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:bg-cyan-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300'
const subtleButton =
  'inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-cyan-500/60 hover:text-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300'
const iconBadge = 'flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-500/30'

export default function App() {
  const [sample, setSample] = useState<File | null>(null)
  const [water, setWater] = useState<File | null>(null)
  const [dark, setDark] = useState<File | null>(null)

  const [outCorr, setOutCorr] = useState(true)
  const [outT, setOutT] = useState(true)
  const [outA, setOutA] = useState(true)
  const [smoothEnabled, setSmoothEnabled] = useState(false)
  const [smoothWindow, setSmoothWindow] = useState(11)
  const [smoothOrder, setSmoothOrder] = useState(3)

  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [name, setName] = useState("")
  const [proc, setProc] = useState<{ x: number[]; series: Record<string, number[]> } | null>(null)
  const [hist, setHist] = useState<{ name: string; file: string; timestamp: string }[]>([])
  const x = useMemo(() => proc?.x ?? [], [proc])
  const series = useMemo(() => proc?.series ?? {}, [proc])

  async function doPreview() {
    if (!sample || !water || !dark) {
      setStatus({ type: 'error', message: '请先选择 3 个 .spc 文件，再点击预览。' })
      return
    }
    const fd = new FormData()
    fd.append('sample', sample)
    fd.append('water', water)
    fd.append('dark', dark)
    fd.append('out_corr', String(outCorr))
    fd.append('out_T', String(outT))
    fd.append('out_A', String(outA))
    fd.append('smooth_enabled', String(smoothEnabled))
    fd.append('smooth_window', String(smoothWindow))
    fd.append('smooth_order', String(smoothOrder))

    try {
      setIsProcessing(true)
      setStatus({ type: 'info', message: '正在处理光谱，请稍候…' })
      const res = await apiProcess(fd)
      const data = res.data
      const x = data['lambda']
      const series: Record<string, number[]> = {}
      Object.entries(data).forEach(([k, v]) => { if (k !== 'lambda') series[k] = v as number[] })
      setProc({ x, series })
      setStatus({ type: 'success', message: '处理完成，已生成预览。' })
    } catch (err) {
      setStatus({ type: 'error', message: '处理失败，请检查文件或稍后再试。' })
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }

  async function doSave() {
    if (!proc) { setStatus({ type: 'error', message: '请先处理并预览后再保存。' }); return }
    if (!name) { setStatus({ type: 'error', message: '请输入保存名称。' }); return }
    const data: Record<string, number[]> = { lambda: proc.x, ...proc.series }
    try {
      setIsSaving(true)
      await apiSave(name, data, { from: 'ui' })
      setStatus({ type: 'success', message: '已保存 JSON 数据。' })
      refreshHistory()
    } catch (err) {
      setStatus({ type: 'error', message: '保存失败，请检查网络或稍后重试。' })
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  async function refreshHistory() {
    try {
      const items = await apiHistory()
      setHist(items)
    } catch (err) {
      setStatus({ type: 'error', message: '无法加载历史记录，请稍后再试。' })
      console.error(err)
    }
  }

  useEffect(() => { refreshHistory() }, [])

  useEffect(() => {
    if (!status || status.type === 'info') return
    const timer = setTimeout(() => setStatus(null), 3200)
    return () => clearTimeout(timer)
  }, [status])

  async function loadItem(nm: string) {
    const obj = await apiHistoryItem(nm)
    const x = obj.data['lambda']
    const series: Record<string, number[]> = {}
    Object.entries(obj.data).forEach(([k, v]) => { if (k !== 'lambda') series[k] = v as number[] })
    setProc({ x, series })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-[\'Inter\',_system-ui,_-apple-system,_BlinkMacSystemFont]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.08),transparent_25%),radial-gradient(circle_at_80%_0,rgba(14,165,233,0.06),transparent_30%),radial-gradient(circle_at_70%_70%,rgba(34,211,238,0.05),transparent_30%)]" aria-hidden></div>

      <div className="relative mx-auto w-full px-4 py-8 space-y-6 sm:px-6 lg:px-10 lg:py-12">
        <header className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl shadow-cyan-900/30 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-400">Spectra Lab</p>
              <h1 className="text-3xl font-semibold text-slate-50">单染料光谱处理</h1>
              <p className="text-sm text-slate-400">上传原始光谱、设置处理参数，并保存或下载结果。</p>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span className={iconBadge}>λ</span>
              <div>
                <p className="font-semibold text-slate-100">工业暗调 UI</p>
                <p className="text-xs text-slate-400">Tailwind 风格 · 高对比度</p>
              </div>
            </div>
          </div>
        </header>

        {status && (
          <div
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg shadow-slate-950/40 ${
              status.type === 'error'
                ? 'border-red-700/60 bg-red-950/60 text-red-100'
                : status.type === 'success'
                  ? 'border-emerald-700/60 bg-emerald-950/50 text-emerald-100'
                  : 'border-cyan-700/60 bg-cyan-950/50 text-cyan-100'
            }`}
            role="status"
          >
            <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/30 text-xs font-bold">
              {status.type === 'error' ? '!' : status.type === 'success' ? '✓' : '…'}
            </span>
            <p>{status.message}</p>
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          {[
            { title: '单染料 .spc', hint: '选择待处理的样品数据', state: sample, setter: setSample },
            { title: '清水 .spc', hint: '用于校正的参考光谱', state: water, setter: setWater },
            { title: '暗光 .spc', hint: '用于背景扣除的暗电流', state: dark, setter: setDark },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-50">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.hint}</p>
                </div>
                {item.state && <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs text-cyan-200">已选择</span>}
              </div>
              <label className="group mt-4 flex h-28 cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/80 text-sm text-slate-400 transition hover:border-cyan-500/60 hover:text-cyan-100">
                <input
                  type="file"
                  className="hidden"
                  accept=".spc"
                  onChange={(e) => item.setter(e.target.files?.[0] ?? null)}
                />
                <div className="text-center leading-relaxed">
                  <p className="font-semibold text-slate-200 group-hover:text-cyan-200">{item.state ? item.state.name : '点击上传文件'}</p>
                  <p className="text-xs text-slate-500">支持 .spc，最多 10MB</p>
                </div>
              </label>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/50 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <p className="text-sm font-semibold text-slate-50">处理选项</p>
              <p className="text-xs text-slate-500">选择输出、平滑窗口与阶数</p>
            </div>
            <button className={`${primaryButton} ${isProcessing ? 'opacity-80' : ''}`} onClick={doPreview} disabled={isProcessing}>
              {isProcessing ? '处理中…' : '预览处理'}
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <label className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-cyan-400 focus:ring-2 focus:ring-cyan-400/60" checked={outCorr} onChange={e => setOutCorr(e.target.checked)} />
              I_corr 输出
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-cyan-400 focus:ring-2 focus:ring-cyan-400/60" checked={outT} onChange={e => setOutT(e.target.checked)} />
              T 输出
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-cyan-400 focus:ring-2 focus:ring-cyan-400/60" checked={outA} onChange={e => setOutA(e.target.checked)} />
              A 输出
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-cyan-400 focus:ring-2 focus:ring-cyan-400/60" checked={smoothEnabled} onChange={e => setSmoothEnabled(e.target.checked)} />
              启用平滑
            </label>
            <label className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
              <span>窗口</span>
              <input
                type="number"
                min={1}
                value={smoothWindow}
                disabled={!smoothEnabled}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setSmoothWindow(Number.isFinite(val) ? Math.max(1, Math.round(val)) : 11)
                }}
                className="w-24 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
              <span>阶数</span>
              <input
                type="number"
                min={1}
                value={smoothOrder}
                disabled={!smoothEnabled}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setSmoothOrder(Number.isFinite(val) ? Math.max(1, Math.round(val)) : 3)
                }}
                className="w-24 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
          </div>
        </section>

        {x.length > 0 && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-2xl shadow-cyan-900/40">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-50">预览</p>
                <p className="text-xs text-slate-500">滚轮/拖拽可缩放，悬停查看数值</p>
              </div>
            </div>
            <BeautifulChart x={x} series={series} />
          </section>
        )}

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/50 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex flex-1 min-w-[220px] items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100">
              <span className="text-slate-400">名称</span>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="如：2025-12-样品A" className="flex-1 bg-transparent text-slate-50 placeholder:text-slate-600 focus:outline-none" />
            </label>
            <button className={`${primaryButton} ${isSaving ? 'opacity-80' : ''}`} onClick={doSave} disabled={isSaving}>
              {isSaving ? '保存中…' : '保存 JSON'}
            </button>
            <button className={subtleButton} onClick={() => apiDownloadBatchZip()}>批量导出 ZIP</button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/50 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-50">历史记录</p>
              <p className="text-xs text-slate-500">查看历史样本并再次导出</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-800">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-900/90 text-slate-400">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">名称</th>
                  <th className="px-4 py-3 text-left font-semibold">时间</th>
                  <th className="px-4 py-3 text-left font-semibold">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {hist.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                      暂无历史记录，保存后将在此显示。
                    </td>
                  </tr>
                )}
                {hist.map((h) => (
                  <tr key={h.file} className="bg-slate-950/60 hover:bg-slate-900/70">
                    <td className="px-4 py-3 text-slate-100">{h.name}</td>
                    <td className="px-4 py-3 text-slate-400">{h.timestamp}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button className={subtleButton} onClick={() => loadItem(h.name)}>预览</button>
                        <button className={subtleButton} onClick={() => apiDownloadCSV(h.name)}>CSV</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
