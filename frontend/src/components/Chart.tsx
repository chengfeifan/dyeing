import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts'; // 引入核心库用于渐变色等高级功能

// 定义 Props 类型
type ChartProps = {
  x: number[];
  series: Record<string, number[]>;
  height?: string; // 可选：允许自定义高度
};

export default function BeautifulChart({ x, series, height = '400px' }: ChartProps) {
  
  // 使用 useMemo 缓存配置，防止不必要的重渲染
  const option = useMemo(() => {
    // 1. 处理 X 轴标签
    const labels = x.map((v) => v.toFixed(2));

    // 2. 处理 Series 数据，添加美化样式
    const datasets = Object.entries(series).map(([name, data]) => ({
      name,
      type: 'line',
      data,
      smooth: true, // 【美化】开启平滑曲线
      showSymbol: false, // 【美化】默认不显示拐点圆圈，悬停时才显示
      symbolSize: 8,
      lineStyle: {
        width: 3, // 【美化】加粗线条
        shadowColor: 'rgba(0,0,0,0.3)', // 【美化】线条阴影
        shadowBlur: 10,
        shadowOffsetY: 5
      },
      areaStyle: {
        opacity: 0.15, // 【美化】区域填充，增加通透感
      },
      emphasis: {
        focus: 'series', // 【交互】悬停时高亮当前线条，淡化其他
      },
    }));

    return {
      // 调色盘 (可选，ECharts 默认的也可以，这里提供一套清新的配色)
      color: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4'],
      
      backgroundColor: '#fff', // 背景色
      
      title: {
        text: '数据趋势分析', // 可根据需求通过 props 传入
        left: 'center',
        textStyle: {
            color: '#333',
            fontSize: 16,
            fontWeight: 'normal'
        },
        top: 10
      },

      // 提示框组件
      tooltip: {
        trigger: 'axis', // 坐标轴触发，主要用于柱状图，折线图等
        axisPointer: {
          type: 'cross', // 十字准星指示器
          label: {
            backgroundColor: '#6a7985'
          }
        },
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderWidth: 0,
        padding: 10,
        textStyle: {
            color: '#333'
        },
        extraCssText: 'box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);' // 添加漂亮的 CSS 阴影
      },

      // 图例组件
      legend: {
        data: Object.keys(series),
        top: 40,
        icon: 'roundRect', // 图例形状
      },

      // 绘图网格
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%', // 留出空间给 dataZoom
        containLabel: true
      },

      // 工具栏 (下载图片等)
      toolbox: {
        feature: {
          saveAsImage: { title: '保存为图片' }
        }
      },

      // 区域缩放 (如果数据量大非常有用)
      dataZoom: [
        {
          type: 'inside', // 支持鼠标滚轮缩放
          start: 0,
          end: 100
        },
        {
          type: 'slider', // 下方滑块
          bottom: 0,
          height: 20,
          borderColor: 'transparent',
          handleSize: '80%'
        }
      ],

      xAxis: {
        type: 'category',
        boundaryGap: false, // 【美化】折线从 X 轴边缘开始
        data: labels,
        axisLine: { lineStyle: { color: '#ccc' } },
        axisLabel: { color: '#666' },
        axisTick: { show: false } // 隐藏刻度线
      },

      yAxis: {
        type: 'value',
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dashed', // 【美化】虚线网格，更轻量
            color: '#eee'
          }
        },
        axisLabel: { color: '#666' }
      },

      series: datasets
    };
  }, [x, series]);

  return (
    <div style={{ width: '100%', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <ReactECharts 
        option={option} 
        style={{ height: height, width: '100%' }} 
        theme={"light"}
      />
    </div>
  );
}