<template>
  <div class="paper view-enter-active">
    <ExamHeader
      show-info
      editable
      :ticket-number="store.ticketNumber"
      v-model="playerNameLocal"
    />

    <div class="exam-notice">
      <p class="exam-notice__title">注意事项：</p>
      <p class="exam-notice__item"><span class="exam-notice__num">1.</span> 答卷前，考生务必将自己的姓名、准考证号填写在答题卡上。用 2B 铅笔将试卷类型填涂在答题卡相应位置上，将条形码横贴在答题卡右上角"条形码粘贴处"。</p>
      <p class="exam-notice__item"><span class="exam-notice__num">2.</span> 作答选择题时，选出每小题答案后，用 2B 铅笔在答题卡上对应题目选项的答案信息点涂黑；如需改动，用橡皮擦干净后，再选涂其他答案。答案不能答在试卷上。写在试卷、草稿纸和答题卡上的非答题区域均无效。</p>
      <p class="exam-notice__item"><span class="exam-notice__num">3.</span> 非选择题必须用黑色字迹的钢笔或签字笔作答，答案必须写在答题卡各题目指定区域内相应位置上；如需改动，先划掉原来的答案，然后再写上新答案；不准使用铅笔和涂改液。不按以上要求作答无效。</p>
      <p class="exam-notice__item"><span class="exam-notice__num">4.</span> 考生必须保持答题卡的整洁。考试结束后，将试卷和答题卡一并交回。</p>
    </div>

    <div v-if="store.view === 'start'" class="exam-action-block">
      <button class="btn btn--primary" @click="handleStart">
        <span class="btn__check">[&#8201;<span class="btn__fill">■</span>&#8201;]</span> 开 始 答 题
      </button>
    </div>

    <!-- 题目区域，使用 v-show 确保 DOM 存在，方便计算位置 -->
    <div v-show="store.view === 'exam'" class="exam-content" ref="examContentRef">
      <template v-for="(item, idx) in store.runSequence" :key="`${item.type}-${item.id}`">
        <!-- 分节标题 -->
        <div v-if="getSectionTitle(item)" class="section-title">{{ getSectionTitle(item) }}</div>

        <!-- 题目 -->
        <QuestionCard
          :ref="el => setCardRef(idx, el)"
          :question="getQuestion(item)"
          :display-number="item.type === 'gate' ? '' : item.id"
          :is-gate="item.type === 'gate'"
          :answered="getAnswer(item)"
          @select="label => onSelect(item, idx, label)"
        />
      </template>
    </div>

    <PageFooter v-if="store.view === 'start'" :page="1" :total="4" />
    <PageFooter v-if="store.view === 'exam'" :answered="store.answeredCount" :total="store.questions.length" />
  </div>
</template>

<script setup>
import { ref, nextTick, onUnmounted, watch } from 'vue'
import { useExamStore } from '../stores/exam'
import { useSound } from '../composables/useSound'
import ExamHeader from '../components/ExamHeader.vue'
import QuestionCard from '../components/QuestionCard.vue'
import PageFooter from '../components/PageFooter.vue'

const store = useExamStore()
const { play } = useSound()

const examContentRef = ref(null)
const playerNameLocal = ref('')

/* ---- 空闲 3 分钟触发 fallback ---- */
const IDLE_TIMEOUT = 3 * 60 * 1000 // 3 分钟
let idleTimer = null

function resetIdleTimer() {
  if (store.view !== 'exam') return
  clearTimeout(idleTimer)
  idleTimer = setTimeout(() => {
    store.triggerFallback()
  }, IDLE_TIMEOUT)
}

function startIdleWatch() {
  const events = ['click', 'touchstart', 'keydown', 'scroll', 'mousemove']
  events.forEach(e => document.addEventListener(e, resetIdleTimer, { passive: true }))
  resetIdleTimer()
}

function stopIdleWatch() {
  clearTimeout(idleTimer)
  idleTimer = null
  const events = ['click', 'touchstart', 'keydown', 'scroll', 'mousemove']
  events.forEach(e => document.removeEventListener(e, resetIdleTimer))
}

// 当进入 exam 视图时启动，离开时停止
watch(() => store.view, (v) => {
  if (v === 'exam') startIdleWatch()
  else stopIdleWatch()
})

onUnmounted(() => { stopIdleWatch() })

const sections = [
  { start: 1, end: 8, title: '一、考场应激反应：本题共 8 小题，每小题 5 分，共 40 分。在每小题给出的四个选项中，只有一项是符合题目要求的。' },
  { start: 9, end: 14, title: '二、社交生态博弈：本题共 6 小题，每小题 5 分，共 30 分。在每小题给出的四个选项中，只有一项是符合题目要求的。' },
  { start: 15, end: 20, title: '三、存亡哲学终局：本题共 6 小题，每小题 5 分，共 30 分。在每小题给出的四个选项中，只有一项是符合题目要求的。' }
]

function getSectionTitle(item) {
  if (item.type !== 'normal') return null
  const sec = sections.find(s => s.start === item.id)
  return sec ? sec.title : null
}

function getQuestion(item) {
  return store.getQuestionObj(item)
}

function getAnswer(item) {
  const raw = item.type === 'normal'
    ? (store.answers[item.id] || null)
    : (item.type === 'gate' ? (store.gateAnswers[item.id] || null) : null)
  if (!raw) return null
  return store.toDisplayLabel(item, raw)
}

// 管理每个题目的 DOM ref
const cardRefs = ref({})
function setCardRef(idx, el) {
  if (el) cardRefs.value[idx] = el
}

function onSelect(item, idx, label) {
  play('pencil')
  store.answerQuestion(item.id, item.type, label)
}

// 平滑向下滚动到第一题
async function handleStart() {
  store.playerName = playerNameLocal.value.trim()
  store.startExam()
  await nextTick()
  if (examContentRef.value) {
    const y = examContentRef.value.getBoundingClientRect().top + window.scrollY - 20
    window.scrollTo({ top: y, behavior: 'smooth' })
  }
}
</script>

<style scoped>
.exam-action-block {
  margin-top: 40px;
  margin-bottom: 40px;
  text-align: center;
}

.exam-content {
  animation: fadeIn 0.6s ease-out;
  padding-top: 20px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 640px) {
  .exam-action-block {
    margin-top: 28px;
    margin-bottom: 32px;
  }
}
</style>
