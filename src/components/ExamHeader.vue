<template>
  <div class="exam-header">
    <div class="exam-header__secret">绝密 ★ 启用前</div>
    <div class="exam-header__year">2026 年普通高等学校招生全国统一考试</div>
    <h1 class="exam-header__title">
      <span v-if="glitchedTitle" v-html="glitchedTitle"></span><span v-else>人 格 综 合</span>（全国 {{ examLetter }} 卷）
    </h1>
    <div v-if="showInfo" class="exam-info">
      <div class="exam-info__row">
        <span class="exam-info__label">姓名：</span>
        <span class="exam-info__underline">
          <input
            v-if="editable"
            :value="modelValue"
            @input="emit('update:modelValue', $event.target.value)"
            class="exam-info__input"
            placeholder="选填"
            maxlength="10"
          />
          <span v-else class="exam-info__input">{{ modelValue }}</span>
        </span>
      </div>
      <div class="exam-info__row">
        <span class="exam-info__label">准考证号：</span>
        <span class="exam-info__underline exam-info__underline--ticket">{{ ticketNumber }}</span>
      </div>
    </div>
    <div class="exam-header__info">本试卷共 20 题，满分 100 分。考试时间不限。考生务必保持冷静。</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useExamStore } from '../stores/exam'
import { glitchText } from '../composables/useGlitch'

const store = useExamStore()
const examLetter = store.examLetter

const props = defineProps({
  showInfo: { type: Boolean, default: false },
  editable: { type: Boolean, default: false },
  ticketNumber: { type: String, default: '' },
  modelValue: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue'])

// 仅在首页（未开考）且抽中 BUG 时才做方块注入；进考试后标题恢复正常
const shouldGlitch = computed(() => store.view === 'start' && store.bugLotteryWon)

// 标题中可替换的部分："人 格 综 合"（不碰"全国 X 卷"、不碰空格和括号）
// 只替换 1 个汉字
const glitchedTitle = computed(() => {
  if (!shouldGlitch.value) return ''
  return glitchText('人 格 综 合', 1)
})
</script>
