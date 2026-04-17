<template>
  <div class="question-card" :class="{ 'question-card--gate': isGate, 'question-card--bug': isBug }">
    <p class="question-card__stem" :class="{ 'question-card__stem--bug': isBug }">
      <span v-if="!isGate && !isBug" class="question-card__number">{{ displayNumber }}.</span>
      <span v-if="isBug" class="question-card__number question-card__number--bug">※</span>
      <span class="question-card__stem-text" v-html="renderedStem"></span>
      <span v-if="!isGate && !isBug" class="question-card__bracket">（<span class="question-card__answer" ref="answerSpanRef">
        <template v-if="bracketHistory.length === 0">&nbsp;&nbsp;</template>
        <template v-else>
          <span class="answer-item answer-item--first" :style="getBracketStyle(0)">
            <svg class="hw-letter" viewBox="0 0 100 100">
              <path :d="getLetterPath(bracketHistory[0].label, bracketHistory[0].variant)" />
            </svg>
            <svg v-if="bracketHistory[0].crossed" class="scratch-line" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path :d="getScratchPath(bracketHistory[0].scratchVariant)" />
            </svg>
          </span>
          <span class="history-wrapper" v-if="bracketHistory.length > 1" :style="{ '--max-width': dynamicMaxWidth + 'px' }">
            <span v-for="(item, idx) in bracketHistory.slice(1)" :key="item.id" class="answer-item history-item" :style="getBracketStyle(idx + 1)">
              <svg class="hw-letter" viewBox="0 0 100 100">
                <path :d="getLetterPath(item.label, item.variant)" />
              </svg>
              <svg v-if="item.crossed" class="scratch-line" viewBox="0 0 100 100" preserveAspectRatio="none">
                 <path :d="getScratchPath(item.scratchVariant)" />
              </svg>
            </span>
          </span>
        </template>
      </span>）</span>
    </p>
    <div class="option-list">
      <p
        v-for="opt in question.options"
        :key="opt.label"
        class="option-item"
        :class="{ 'option-item--selected': selected === opt.label, 'option-item--bug': isBug }"
        @click="selectOption(opt.label)"
      >
        <span class="option-item__label">
          <template v-for="(mark, mIdx) in (optionMarks[opt.label] || [])" :key="mIdx">
            <svg v-if="mark.type === 'circle'" class="drawn-circle" viewBox="0 0 100 100" preserveAspectRatio="none" :style="{ transform: `scale(${mark.scale}) rotate(${mark.rotation}deg)` }">
              <path :d="getCirclePath(mark.variant)" />
            </svg>
            <svg v-if="mark.type === 'cross'" class="drawn-cross" viewBox="0 0 100 100" preserveAspectRatio="none" :style="{ transform: `scale(${mark.scale}) rotate(${mark.rotation}deg)` }">
              <path :d="getCrossPath(mark.variant)" />
            </svg>
          </template>
          {{ opt.label }}.
        </span>{{ opt.text }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'

const props = defineProps({
  question: { type: Object, required: true },
  displayNumber: { type: [Number, String], default: '' },
  isGate: { type: Boolean, default: false },
  answered: { type: String, default: null }
})

const emit = defineEmits(['select'])

// 是否 BUG 隐藏题（根据题目对象的 is_bug 字段判断）
const isBug = computed(() => !!props.question?.is_bug)

// 渲染题干：把 \n 转成 <br>，并转义 HTML 特殊字符（仅用于 BUG 题，普通题也安全）
const renderedStem = computed(() => {
  const raw = props.question?.stem || ''
  const escaped = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return escaped.split('\n').join('<br>')
})

const optionMarks = ref({})
const bracketHistory = ref([])
const answerSpanRef = ref(null)
const dynamicMaxWidth = ref(160)

const letterPaths = {
  A: [
    "M35,85 L50,20 L65,85 M35,60 Q50,55 70,60",
    "M32,88 L48,15 L68,82 M32,62 Q52,50 68,62",
    "M38,82 L52,25 L62,88 M38,58 Q48,60 72,58"
  ],
  B: [
    "M30,15 L35,85 M30,15 C 60,10 65,40 45,50 C 75,55 75,85 35,85",
    "M25,20 L30,90 M25,20 C 55,5 70,35 40,48 C 80,48 80,90 30,90",
    "M32,10 L38,80 M32,10 C 65,15 60,45 48,52 C 70,60 70,80 38,80"
  ],
  C: [
    "M75,25 C 50,5 20,20 25,50 C 30,80 50,95 75,75",
    "M80,30 C 55,0 15,15 20,55 C 25,85 55,100 80,70",
    "M70,20 C 45,10 25,25 30,50 C 35,75 45,90 70,80"
  ],
  D: [
    "M30,15 L35,85 M30,15 C 80,15 85,85 35,85",
    "M25,20 L30,90 M25,20 C 90,10 95,90 30,90",
    "M35,10 L40,80 M35,10 C 75,20 80,80 40,80"
  ]
};

const scratchPaths = [
  // 经典左下到右上斜杠
  "M10,80 C 40,50 60,40 90,20 M20,85 C 45,60 65,50 80,10",
  // 左上到右下连划（大开大合猛改）
  "M15,15 L85,85 M25,10 L90,75 M10,30 L75,95",
  // 急躁的锯齿划线（彻底乱涂死）
  "M15,40 L35,70 L55,30 L75,70 L90,40"
];

const circlePaths = [
  "M50,5 C20,10 5,40 10,70 C15,95 40,95 70,85 C95,75 95,40 80,15",
  "M45,10 C15,15 0,45 15,75 C30,100 60,90 80,80 C100,70 90,30 70,10",
  "M55,5 C25,5 10,35 5,65 C0,90 30,100 65,95 C100,90 105,50 85,20",
  "M48,8 C18,12 2,42 8,72 C14,98 42,98 68,88 C92,78 98,42 78,18",
  "M52,6 C22,8 8,38 4,68 C-2,92 32,102 62,97 C98,92 102,52 82,22",
  "M46,12 C12,18 -2,48 12,78 C28,102 58,92 78,82 C98,72 92,32 72,12",
  "M50,8 C28,6 8,30 6,62 C4,88 28,100 58,96 C88,92 100,62 92,28",
  "M44,6 C16,14 -4,46 10,76 C22,98 50,96 74,86 C96,76 96,38 76,14"
];

const crossPaths = [
  "M15,15 Q50,45 85,85 M85,15 Q50,45 15,85",
  "M10,20 Q60,40 90,80 M90,20 Q40,60 10,80",
  "M20,10 Q45,50 80,90 M80,10 Q45,50 20,90",
  "M12,18 Q48,52 88,82 M88,18 Q52,48 12,82",
  "M18,12 Q55,42 82,88 M82,12 Q45,58 18,88",
  "M14,22 Q42,55 86,78 M86,22 Q58,45 14,78",
  "M22,14 Q50,48 78,86 M78,14 Q50,52 22,86",
  "M16,16 Q55,38 84,84 M84,16 Q45,62 16,84"
];

function getLetterPath(label, v) {
  const arr = letterPaths[label];
  return arr ? arr[v % arr.length] : '';
}
function getScratchPath(v) {
  if (v === undefined || v === null) return scratchPaths[0]; // 防止之前旧数据报错
  return scratchPaths[v % scratchPaths.length];
}
function getCirclePath(v) {
  return circlePaths[v % circlePaths.length];
}
function getCrossPath(v) {
  return crossPaths[v % crossPaths.length];
}

function getRandomVariant() {
  return Math.floor(Math.random() * 100);
}

function initMarks() {
  if (props.question && Array.isArray(props.question.options)) {
    props.question.options.forEach(o => {
      if (!optionMarks.value[o.label]) {
        optionMarks.value[o.label] = []
      }
    })
  }
}

async function updateMaxWidth() {
  await nextTick();
  if (answerSpanRef.value) {
    const card = answerSpanRef.value.closest('.question-card');
    if (card) {
      const cardRect = card.getBoundingClientRect();
      const answerRect = answerSpanRef.value.getBoundingClientRect();
      // 使用卡片的右侧，减去括号的右侧位置，留出右边距
      let available = cardRect.right - answerRect.right - 12;
      // 保证如果有换行，最多不超过 240px 左古，也不少于两三个字母宽度(60px)
      if (available < 60) available = 60;
      if (available > 240) available = 240;
      dynamicMaxWidth.value = available;
    }
  }
}

watch(() => props.answered, async (newVal, oldVal) => {
  initMarks()
  if (oldVal && newVal !== oldVal) {
    if (optionMarks.value[oldVal]) {
      optionMarks.value[oldVal].push({ type: 'cross', variant: getRandomVariant(), scale: 0.97 + Math.random() * 0.06, rotation: Math.floor(Math.random() * 21) - 10 })
    }
    if (bracketHistory.value.length > 0) {
      const lastItem = bracketHistory.value[bracketHistory.value.length - 1]
      if (!lastItem.crossed) {
        lastItem.crossed = true
        lastItem.scratchVariant = getRandomVariant()
      }
    }
  }
  if (newVal) {
    if (optionMarks.value[newVal]) {
      optionMarks.value[newVal].push({ type: 'circle', variant: getRandomVariant(), scale: 0.95 + Math.random() * 0.1, rotation: Math.floor(Math.random() * 25) - 12 })
    }
    bracketHistory.value.push({
        label: newVal,
        crossed: false,
        id: Date.now() + Math.random(),
        variant: getRandomVariant(),
        rotation: Math.floor(Math.random() * 17) - 8
    })
  }
  updateMaxWidth();
}, { immediate: true })

onMounted(() => {
  updateMaxWidth();
  window.addEventListener('resize', updateMaxWidth);
})

const selected = computed(() => props.answered)

function selectOption(label) {
  emit('select', label)
}

function getBracketStyle(idx) {
  const item = bracketHistory.value[idx];
  const rot = item ? item.rotation : 0;
  if (idx === 0) {
     return { transform: `translate(-50%, -50%) rotate(${rot}deg)` };
  }
  return { transform: `rotate(${rot}deg)` };
}
</script>
