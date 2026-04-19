<template>
  <Analytics />
  <SpeedInsights />
  <ExamView v-if="store.view === 'start' || store.view === 'exam'" />
  <ResultView v-else-if="store.view === 'result'" />
</template>

<script setup>
import { onMounted } from 'vue'
import { Analytics } from '@vercel/analytics/vue'
import { SpeedInsights } from '@vercel/speed-insights/vue'
import { useExamStore } from './stores/exam'
import ExamView from './views/ExamView.vue'
import ResultView from './views/ResultView.vue'

const store = useExamStore()

onMounted(() => {
  store.init()
})
</script>
