<template>
  <div ref="chartRef" class="radar-chart"></div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  userVector: { type: Object, required: true },
  uniVector: { type: Object, default: null },
  dimensionLabels: { type: Object, required: true }
})

const chartRef = ref(null)
let chart = null

const dimensions = ['C', 'P', 'D', 'So']

function buildOption() {
  const indicator = dimensions.map(d => ({
    name: props.dimensionLabels[d] || d,
    max: 4
  }))

  const series = [{
    name: '你的画像',
    type: 'radar',
    data: [{
      value: dimensions.map(d => props.userVector[d] || 2),
      name: '你的画像',
      lineStyle: { color: '#c0392b', width: 2 },
      areaStyle: { color: 'rgba(192, 57, 43, 0.15)' },
      itemStyle: { color: '#c0392b' }
    }]
  }]

  if (props.uniVector) {
    series[0].data.push({
      value: dimensions.map(d => props.uniVector[d] || 2),
      name: '录取院校',
      lineStyle: { color: '#2c3e80', width: 2, type: 'dashed' },
      areaStyle: { color: 'rgba(44, 62, 128, 0.08)' },
      itemStyle: { color: '#2c3e80' }
    })
  }

  return {
    color: ['#c0392b', '#2c3e80'],
    legend: {
      bottom: 0,
      textStyle: { fontFamily: 'Source Han Sans SC, SimHei, sans-serif', fontSize: 12 }
    },
    radar: {
      indicator,
      shape: 'polygon',
      splitNumber: 4,
      center: ['50%', '42%'],
      radius: '60%',
      axisName: {
        color: '#333',
        fontSize: 11,
        fontFamily: 'Source Han Sans SC, SimHei, sans-serif'
      },
      splitArea: { areaStyle: { color: ['#faf9f6', '#f5f5f0', '#faf9f6', '#f5f5f0'] } },
      splitLine: { lineStyle: { color: '#ddd' } },
      axisLine: { lineStyle: { color: '#ccc' } }
    },
    series
  }
}

onMounted(() => {
  chart = echarts.init(chartRef.value)
  chart.setOption(buildOption())

  const ro = new ResizeObserver(() => chart?.resize())
  ro.observe(chartRef.value)
})

watch(() => [props.userVector, props.uniVector], () => {
  chart?.setOption(buildOption())
}, { deep: true })
</script>
