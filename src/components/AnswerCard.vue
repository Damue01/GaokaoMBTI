<template>
  <div class="answer-card">
    <span class="answer-card__label">答题卡</span>
    <span
      v-for="(item, idx) in sequence"
      :key="idx"
      class="answer-card__bubble"
      :class="{
        'answer-card__bubble--filled': isFilled(item),
        'answer-card__bubble--current': idx === currentIndex,
        'answer-card__bubble--gate': item.type === 'gate',
        'bubble-fill': justFilled === idx
      }"
    >
      {{ item.type === 'gate' ? '★' : item.id }}
    </span>
    <span class="answer-card__progress">{{ filledCount }}/{{ sequence.length }}</span>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  sequence: { type: Array, required: true },
  answers: { type: Object, required: true },
  gateAnswers: { type: Object, required: true },
  currentIndex: { type: Number, required: true }
})

const justFilled = ref(-1)

function isFilled(item) {
  if (item.type === 'normal') return !!props.answers[item.id]
  if (item.type === 'gate') return !!props.gateAnswers[item.id]
  return false
}

const filledCount = computed(() => {
  return props.sequence.filter(item => isFilled(item)).length
})

watch(() => props.currentIndex, (newIdx) => {
  if (newIdx > 0) {
    justFilled.value = newIdx - 1
    setTimeout(() => { justFilled.value = -1 }, 400)
  }
})
</script>
