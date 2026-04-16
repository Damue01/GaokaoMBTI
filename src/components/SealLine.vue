<template>
  <div class="seal-line" ref="containerRef">
    <svg
      class="seal-line__svg"
      :viewBox="`0 0 48 ${h}`"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- 虚线 — exam-zh densely-dashed 风格 -->
      <line
        x1="16" :y1="lineStart" x2="16" :y2="lineEnd"
        stroke="#000" stroke-width="1"
        stroke-dasharray="3.2 2.1"
      />
      <!-- 装饰圆点 — 白底黑描边 -->
      <circle
        v-for="(cy, i) in circles" :key="i"
        cx="16" :cy="cy" r="4.2"
        fill="#fff" stroke="#000" stroke-width="0.4"
      />
      <!-- 竖排警告文字 -->
      <text
        :x="33" :y="textStart"
        writing-mode="tb"
        glyph-orientation-vertical="0"
        font-family="KaiTi, STKaiti, 楷体, serif"
        font-size="11" letter-spacing="10"
        fill="#000"
      >密封线内不得答题</text>
    </svg>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const containerRef = ref(null)
const h = ref(1000)

function measure () {
  if (containerRef.value) h.value = containerRef.value.clientHeight || window.innerHeight
}

let ro
onMounted(() => {
  measure()
  ro = new ResizeObserver(measure)
  ro.observe(containerRef.value)
})
onBeforeUnmount(() => ro?.disconnect())

// exam-zh 参数: circle-start=0.07  circle-end=0.92  circle-step≈3.5em(≈35px)
const lineStart = computed(() => Math.round(h.value * 0.04))
const lineEnd   = computed(() => Math.round(h.value * 0.96))
const textStart = computed(() => Math.round(h.value * 0.25))

const circles = computed(() => {
  const start = Math.round(h.value * 0.07)
  const end   = Math.round(h.value * 0.92)
  const step  = 35
  const pts = []
  for (let y = start; y <= end; y += step) pts.push(y)
  return pts
})
</script>
