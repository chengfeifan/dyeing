import { useEffect, useMemo, useState } from 'react'
import BeautifulChart from './components/Chart'
import { apiProcess, apiSave, apiHistory, apiHistoryItem, apiDownloadBatchZip, apiDownloadCSV } from './api'

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

  const [name, setName] = useState("")
  const [proc, setProc] = useState<{ x: number[]; series: Record<string, number[]> } | null>(null)
  const [hist, setHist] = useState<{ name: string; file: string; timestamp: string }[]>([])
  const x = useMemo(() => proc?.x ?? [], [proc])
  const series = useMemo(() => proc?.series ?? {}, [proc])

  async function doPreview() {
    if (!sample || !water || !dark) { alert('请先选择 3 个 .spc 文件'); return }
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

    const res = await apiProcess(fd)
    const data = res.data
    const x = data['lambda']
    const series: Record<string, number[]> = {}
    Object.entries(data).forEach(([k, v]) => { if (k !== 'lambda') series[k] = v as number[] })
    setProc({ x, series })
  }

  async function doSave() {
    if (!proc) { alert('请先处理并预览'); return }
    if (!name) { alert('请输入名称'); return }
    const data: Record<string, number[]> = { lambda: proc.x, ...proc.series }
    await apiSave(name, data, { from: 'ui' })
    alert('已保存 JSON')
    refreshHistory()
  }

  async function refreshHistory() {
    const items = await apiHistory()
    setHist(items)
  }

  useEffect(() => { refreshHistory() }, [])

  async function loadItem(nm: string) {
    const obj = await apiHistoryItem(nm)
    const x = obj.data['lambda']
    const series: Record<string, number[]> = {}
    Object.entries(obj.data).forEach(([k, v]) => { if (k !== 'lambda') series[k] = v as number[] })
    setProc({ x, series })
  }

  return (
    <div className="container">
      <h2>单染料光谱处理</h2>

      <div className="card">
        <div className="row">
          <div>
            <label>单染料 .spc</label><br />
            <input type="file" accept=".spc" onChange={e => setSample(e.target.files?.[0] ?? null)} />
          </div>
          <div>
            <label>清水 .spc</label><br />
            <input type="file" accept=".spc" onChange={e => setWater(e.target.files?.[0] ?? null)} />
          </div>
          <div>
            <label>暗光 .spc</label><br />
            <input type="file" accept=".spc" onChange={e => setDark(e.target.files?.[0] ?? null)} />
          </div>
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <label><input type="checkbox" checked={outCorr} onChange={e => setOutCorr(e.target.checked)} /> I_corr</label>
          <label><input type="checkbox" checked={outT} onChange={e => setOutT(e.target.checked)} /> T</label>
          <label><input type="checkbox" checked={outA} onChange={e => setOutA(e.target.checked)} /> A</label>
          <label><input type="checkbox" checked={smoothEnabled} onChange={e => setSmoothEnabled(e.target.checked)} /> 启用平滑</label>
          <label>窗口 <input type="number" value={smoothWindow} onChange={e => setSmoothWindow(parseInt(e.target.value||'11'))} style={{ width: 72 }} /></label>
          <label>阶数 <input type="number" value={smoothOrder} onChange={e => setSmoothOrder(parseInt(e.target.value||'3'))} style={{ width: 56 }} /></label>
          <button onClick={doPreview}>预览处理</button>
        </div>
      </div>

      {x.length > 0 && (
        <div className="card">
          <h3>预览</h3>
          <BeautifulChart x={x} series={series} />
        </div>
      )}

      <div className="card">
        <div className="row">
          <label>名称：<input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="如：2025-12-样品A" /></label>
          <button onClick={doSave}>保存 JSON</button>
          <button className="secondary" onClick={() => apiDownloadBatchZip()}>批量导出 ZIP</button>
        </div>
      </div>

      <div className="card">
        <h3>历史记录</h3>
        <table className="table">
          <thead><tr><th>名称</th><th>时间</th><th>操作</th></tr></thead>
          <tbody>
            {hist.map(h => (
              <tr key={h.file}>
                <td>{h.name}</td>
                <td>{h.timestamp}</td>
                <td>
                  <button className="secondary" onClick={() => loadItem(h.name)}>预览</button>{' '}
                  <button className="secondary" onClick={() => apiDownloadCSV(h.name)}>CSV</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
