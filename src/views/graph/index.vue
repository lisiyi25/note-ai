<template>
  <div class="graph-page">
    <div class="grid-layer"></div>
    <div class="toolbar">
      <div class="title-block">
        <h2>知识图谱</h2>
        <p>力引导布局 · 神经元网络可视化</p>
      </div>
      <el-button type="primary" :icon="Refresh" :loading="loading" @click="regenerate">
        重新生成图谱
      </el-button>
    </div>
    <div
      ref="chartRef"
      class="chart"
      v-loading="loading"
      element-loading-background="rgba(15,23,42,0.55)"
    />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import * as echarts from 'echarts'
import type { ECharts, EChartsOption } from 'echarts'
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  fetchGraphData,
  regenerateGraphData,
  type GraphCategory,
  type GraphData,
} from '@/api/graph'

const chartRef = ref<HTMLDivElement>()
const loading = ref(false)
let chart: ECharts | null = null
let flowTimer: ReturnType<typeof setInterval> | null = null
let flowPhase = 0

const categoryMeta: Record<GraphCategory, { name: string; color: string }> = {
  concept: { name: '基础概念', color: '#34d399' },
  algorithm: { name: '算法', color: '#38bdf8' },
  structure: { name: '数据结构', color: '#fbbf24' },
}

function buildOption(data: GraphData, phase = 0): EChartsOption {
  const categories = (Object.keys(categoryMeta) as GraphCategory[]).map((key) => ({
    name: categoryMeta[key].name,
    itemStyle: { color: categoryMeta[key].color },
  }))

  const categoryIndex: Record<GraphCategory, number> = {
    concept: 0,
    algorithm: 1,
    structure: 2,
  }

  const edgeOpacity = 0.28 + Math.sin(phase) * 0.12

  return {
    backgroundColor: 'transparent',
    tooltip: {
      backgroundColor: 'rgba(15,23,42,0.92)',
      borderColor: 'rgba(56,189,248,0.35)',
      textStyle: { color: '#e2e8f0' },
      formatter: (params: unknown) => {
        const p = params as {
          dataType?: string
          data?: { name?: string; desc?: string; category?: number }
          name?: string
        }
        if (p.dataType === 'node' && p.data) {
          const catName = categories[p.data.category ?? 0]?.name || ''
          return `<strong>${p.data.name}</strong><br/>类别：${catName}<br/>${p.data.desc || ''}`
        }
        return p.name || ''
      },
    },
    legend: [
      {
        data: categories.map((c) => c.name),
        textStyle: { color: 'rgba(226,232,240,0.8)' },
        top: 56,
        left: 20,
      },
    ],
    series: [
      {
        type: 'graph',
        layout: 'force',
        roam: true,
        draggable: true,
        categories,
        label: {
          show: true,
          position: 'bottom',
          color: '#fff',
          fontSize: 12,
          distance: 8,
          textBorderColor: 'rgba(15,23,42,0.85)',
          textBorderWidth: 2,
        },
        force: {
          repulsion: 220,
          edgeLength: [70, 160],
          gravity: 0.06,
          friction: 0.2,
        },
        lineStyle: {
          color: 'source',
          curveness: 0.28,
          width: 1.6,
          opacity: edgeOpacity,
        },
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: [0, 8],
        emphasis: {
          focus: 'adjacency',
          scale: 1.2,
          lineStyle: { width: 3, opacity: 0.9 },
          itemStyle: {
            shadowBlur: 28,
          },
        },
        data: data.nodes.map((n) => ({
          id: n.id,
          name: n.name,
          value: n.value,
          category: categoryIndex[n.category],
          desc: n.desc,
          symbolSize: Math.max(22, n.value * 0.9),
          itemStyle: {
            color: categoryMeta[n.category].color,
            shadowBlur: 20,
            shadowColor: categoryMeta[n.category].color,
            borderColor: 'rgba(255,255,255,0.35)',
            borderWidth: 1,
          },
        })),
        links: data.links.map((l, idx) => ({
          source: l.source,
          target: l.target,
          lineStyle: {
            opacity: 0.22 + ((idx + phase * 3) % 5) * 0.08,
            width: 1.2 + (idx % 3) * 0.4,
            curveness: 0.2 + (idx % 4) * 0.05,
          },
        })),
      },
    ],
  }
}

let latestData: GraphData | null = null

async function render(data: GraphData) {
  if (!chartRef.value) return
  latestData = data
  if (!chart) {
    chart = echarts.init(chartRef.value)
  }
  chart.setOption(buildOption(data, flowPhase), true)
  startFlow()
}

function startFlow() {
  if (flowTimer) clearInterval(flowTimer)
  flowTimer = setInterval(() => {
    if (!chart || !latestData) return
    flowPhase += 0.35
    chart.setOption(
      {
        series: [
          {
            lineStyle: {
              opacity: 0.28 + Math.sin(flowPhase) * 0.12,
            },
            links: latestData.links.map((l, idx) => ({
              source: l.source,
              target: l.target,
              lineStyle: {
                opacity: 0.2 + (Math.sin(flowPhase + idx) + 1) * 0.18,
                width: 1.2 + (Math.cos(flowPhase + idx * 0.7) + 1) * 0.5,
                curveness: 0.22 + (idx % 4) * 0.04,
              },
            })),
          },
        ],
      },
      false,
    )
  }, 80)
}

async function load() {
  loading.value = true
  try {
    const res = await fetchGraphData()
    await render(res.data)
  } finally {
    loading.value = false
  }
}

async function regenerate() {
  loading.value = true
  try {
    const res = await regenerateGraphData()
    await render(res.data)
    ElMessage.success('图谱已重新生成')
  } finally {
    loading.value = false
  }
}

function onResize() {
  chart?.resize()
}

onMounted(async () => {
  await load()
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  if (flowTimer) clearInterval(flowTimer)
  chart?.dispose()
  chart = null
})
</script>

<style scoped lang="scss">
.graph-page {
  height: calc(100vh - 60px);
  background: #0f172a;
  position: relative;
  overflow: hidden;
}

.grid-layer {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image:
    radial-gradient(rgba(148, 163, 184, 0.16) 1px, transparent 1px),
    linear-gradient(rgba(56, 189, 248, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(56, 189, 248, 0.04) 1px, transparent 1px);
  background-size:
    28px 28px,
    56px 56px,
    56px 56px;
  mask-image: radial-gradient(circle at center, #000 35%, transparent 90%);
}

.toolbar {
  position: absolute;
  top: 16px;
  right: 20px;
  left: 20px;
  z-index: 2;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  pointer-events: none;

  .el-button {
    pointer-events: auto;
  }
}

.title-block {
  color: #fff;

  h2 {
    font-size: 22px;
    letter-spacing: 0.04em;
    margin-bottom: 4px;
  }

  p {
    font-size: 13px;
    color: rgba(226, 232, 240, 0.55);
  }
}

.chart {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
}
</style>
