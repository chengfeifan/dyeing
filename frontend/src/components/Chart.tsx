import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts'

const industrialDarkTheme = {
  backgroundColor: '#0b1220',
}

echarts.registerTheme('industrial-dark', industrialDarkTheme)

type ChartProps = {
  x: number[]
  series: Record<string, number[]>
  height?: string
}

export default function BeautifulChart({ x, series, height = '440px' }: ChartProps) {
  const option = useMemo(() => {
    const labels = x.map((v) => v.toFixed(2))
    const neonPalette = ['#22d3ee', '#a855f7', '#f472b6', '#38bdf8', '#f59e0b', '#10b981', '#fb7185', '#8b5cf6']

    const datasets = Object.entries(series).map(([name, data]) => ({
      name,
      type: 'line',
      data,
      smooth: true,
      showSymbol: false,
      symbolSize: 8,
      lineStyle: {
        width: 3,
        shadowColor: 'rgba(34, 211, 238, 0.25)',
        shadowBlur: 14,
        shadowOffsetY: 8,
      },
      areaStyle: {
        opacity: 0.08,
      },
      emphasis: {
        focus: 'series',
      },
    }))

    return {
      color: neonPalette,
      backgroundColor: '#0b1220',
      title: {
        text: '光谱曲线预览',
        left: 'left',
        textStyle: {
          color: '#e2e8f0',
          fontSize: 16,
          fontWeight: '600',
        },
        top: 6,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#0ea5e9',
            color: '#0b1220',
          },
          lineStyle: {
            color: '#22d3ee',
            width: 1.2,
            opacity: 0.8,
          },
        },
        backgroundColor: 'rgba(15,23,42,0.94)',
        borderColor: '#22d3ee',
        borderWidth: 1,
        padding: 12,
        textStyle: {
          color: '#e2e8f0',
        },
      },
      legend: {
        data: Object.keys(series),
        top: 32,
        icon: 'roundRect',
        textStyle: { color: '#cbd5e1' },
      },
      grid: {
        left: '4%',
        right: '3%',
        bottom: '12%',
        containLabel: true,
      },
      toolbox: {
        feature: {
          saveAsImage: { title: '保存为图片' },
        },
        iconStyle: { borderColor: '#94a3b8' },
        right: 10,
      },
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100,
          minValueSpan: 10,
        },
        {
          type: 'slider',
          bottom: 6,
          height: 18,
          borderColor: 'transparent',
          backgroundColor: 'rgba(51,65,85,0.6)',
          handleStyle: { color: '#22d3ee' },
          textStyle: { color: '#94a3b8' },
        },
      ],
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: labels,
        axisLine: { lineStyle: { color: '#1f2937' } },
        axisLabel: { color: '#cbd5e1' },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dashed',
            color: '#1f2937',
          },
        },
        axisLabel: { color: '#cbd5e1' },
      },
      series: datasets,
    }
  }, [x, series])

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 shadow-inner shadow-cyan-900/30">
      <ReactECharts
        option={option}
        style={{ height: height, width: '100%' }}
        theme={'industrial-dark'}
      />
    </div>
  )
}
