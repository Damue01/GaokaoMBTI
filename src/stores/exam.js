import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'gaokao-exam-state'

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch { /* quota exceeded – silently ignore */ }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const useExamStore = defineStore('exam', () => {
  // 三阶段视图: start / exam / result
  const view = ref('start')

  // 题目数据
  const questions = ref([])
  const gateQuestions = ref([])
  const results = ref(null)

  // 答题状态
  const answers = ref({})         // { questionId: optionLabel }
  const gateAnswers = ref({})     // { gateId: optionLabel }
  const currentIndex = ref(0)
  const playerName = ref('')
  const ticketNumber = ref(generateTicket())

  // 生成 13 位准考证号: YY + AAAA + SS + CCC + NN
  function generateTicket() {
    const yy = '26'
    const area = String(Math.floor(1000 + Math.random() * 9000))    // 4 位考区
    const subj = '99'                                                 // 99 = 命理综合
    const room = String(Math.floor(100 + Math.random() * 900))       // 3 位考场
    const seat = String(Math.floor(1 + Math.random() * 30)).padStart(2, '0') // 01-30
    return yy + area + subj + room + seat
  }

  // 运行时题序（含插入的门控题）
  const runSequence = ref([])     // [{ type:'normal', id:1 }, { type:'gate', id:'G1' }]

  // 门控 G1 是否已插入
  const g1Inserted = ref(false)
  // 门控 G2 是否已插入
  const g2Inserted = ref(false)

  // 是否因空闲超时触发 fallback 结果
  const isFallback = ref(false)

  // 信封是否已被拆开（用于区分首次进入和刷新恢复）
  const envelopeSeen = ref(false)

  // 当前题目对象
  const currentItem = computed(() => runSequence.value[currentIndex.value] || null)

  // 总题数（含门控）
  const totalCount = computed(() => runSequence.value.length)

  // 是否已答完
  const isFinished = computed(() => currentIndex.value >= runSequence.value.length)

  // 进度百分比
  const progress = computed(() => {
    if (runSequence.value.length === 0) return 0
    return Math.round((currentIndex.value / runSequence.value.length) * 100)
  })

  // 已答题数
  const answeredCount = computed(() => {
    return Object.keys(answers.value).length + Object.keys(gateAnswers.value).length
  })

  // 获取题目的实际对象
  function getQuestionObj(item) {
    if (!item) return null
    if (item.type === 'normal') return questions.value.find(q => q.id === item.id)
    if (item.type === 'gate') return gateQuestions.value.find(q => q.id === item.id)
    return null
  }

  // 初始化数据
  async function init() {
    const [qRes, rRes] = await Promise.all([
      fetch('/questions.json').then(r => r.json()),
      fetch('/results.json').then(r => r.json())
    ])
    questions.value = qRes.questions
    gateQuestions.value = qRes.gate_questions
    results.value = rRes

    // 尝试从 localStorage 恢复状态
    const saved = loadState()
    if (saved) {
      view.value = saved.view || 'start'
      playerName.value = saved.playerName || ''
      ticketNumber.value = saved.ticketNumber || ticketNumber.value
      answers.value = saved.answers || {}
      gateAnswers.value = saved.gateAnswers || {}
      currentIndex.value = saved.currentIndex || 0
      runSequence.value = saved.runSequence || qRes.questions.map(q => ({ type: 'normal', id: q.id }))
      g1Inserted.value = saved.g1Inserted || false
      g2Inserted.value = saved.g2Inserted || false
      isFallback.value = saved.isFallback || false
      envelopeSeen.value = saved.envelopeSeen || false
    } else {
      // 初始化运行序列（仅常规题）
      runSequence.value = qRes.questions.map(q => ({ type: 'normal', id: q.id }))
    }

    // 监听关键状态变化，自动持久化
    watch(
      () => ({
        view: view.value,
        playerName: playerName.value,
        ticketNumber: ticketNumber.value,
        answers: answers.value,
        gateAnswers: gateAnswers.value,
        currentIndex: currentIndex.value,
        runSequence: runSequence.value,
        g1Inserted: g1Inserted.value,
        g2Inserted: g2Inserted.value,
        isFallback: isFallback.value,
        envelopeSeen: envelopeSeen.value
      }),
      (state) => { saveState(state) },
      { deep: true }
    )
  }

  // 按题目 ID 作答（滚动模式使用）
  function answerQuestion(questionId, questionType, optionLabel) {
    if (questionType === 'normal') {
      if (answers.value[questionId] === optionLabel) {
        const { [questionId]: _, ...rest } = answers.value
        answers.value = rest // 反选涂销（整体替换确保响应性）
      } else {
        answers.value = { ...answers.value, [questionId]: optionLabel }
        checkGateTrigger(questionId, optionLabel)
      }
    } else if (questionType === 'gate') {
      if (gateAnswers.value[questionId] === optionLabel) {
        const { [questionId]: _, ...rest } = gateAnswers.value
        gateAnswers.value = rest
      } else {
        gateAnswers.value = { ...gateAnswers.value, [questionId]: optionLabel }
      }
    }

    // 检查是否全部答完
    if (answeredCount.value >= runSequence.value.length) {
      setTimeout(() => { view.value = 'result' }, 1000)
    }
  }

  // 回答当前题（保留旧接口兼容）
  function answer(optionLabel) {
    const item = currentItem.value
    if (!item) return

    if (item.type === 'normal') {
      answers.value[item.id] = optionLabel
      // 检查门控触发
      checkGateTrigger(item.id, optionLabel)
    } else if (item.type === 'gate') {
      gateAnswers.value[item.id] = optionLabel
    }

    // 前进
    currentIndex.value++

    // 检查是否答完
    if (isFinished.value) {
      view.value = 'result'
    }
  }

  // 检查是否需要插入门控题
  function checkGateTrigger(questionId, optionLabel) {
    // G1: 在第12题之后检查 E1 累计值（情绪表达强度溢出 → BUG修复局）
    if (questionId === 12 && !g1Inserted.value) {
      const e1Total = calcDimensionTotal('E1')
      if (e1Total >= 12) {
        insertGateAfter('G1', 12)
        g1Inserted.value = true
      }
    }

    // G2: 在第14题之后检查 So3 累计值
    if (questionId === 14 && !g2Inserted.value) {
      const so3Total = calcDimensionTotal('So3')
      if (so3Total >= 10) {
        insertGateAfter('G2', 14)
        g2Inserted.value = true
      }
    }
  }

  // 在指定题目后面插入门控题
  function insertGateAfter(gateId, afterQuestionId) {
    const idx = runSequence.value.findIndex(
      item => item.type === 'normal' && item.id === afterQuestionId
    )
    if (idx >= 0) {
      runSequence.value.splice(idx + 1, 0, { type: 'gate', id: gateId })
    }
  }

  // 在当前位置后面插入门控题（旧接口）
  function insertGateAfterCurrent(gateId) {
    const insertPos = currentIndex.value + 1
    runSequence.value.splice(insertPos, 0, { type: 'gate', id: gateId })
  }

  // 计算某个维度当前累计值
  function calcDimensionTotal(dimName) {
    let total = 0
    for (const [qId, label] of Object.entries(answers.value)) {
      const q = questions.value.find(q => q.id === Number(qId))
      if (!q) continue
      const opt = q.options.find(o => o.label === label)
      if (opt && opt.dimension_map && opt.dimension_map[dimName] !== undefined) {
        total += opt.dimension_map[dimName]
      }
    }
    return total
  }

  // 开始考试
  function startExam() {
    view.value = 'exam'
  }

  // 触发空闲 fallback，直接跳转结果页
  function triggerFallback() {
    isFallback.value = true
    view.value = 'result'
  }

  // 重新开始
  function restart() {
    localStorage.removeItem(STORAGE_KEY)
    view.value = 'start'
    answers.value = {}
    gateAnswers.value = {}
    playerName.value = ''
    ticketNumber.value = generateTicket()
    currentIndex.value = 0
    g1Inserted.value = false
    g2Inserted.value = false
    isFallback.value = false
    envelopeSeen.value = false
    runSequence.value = questions.value.map(q => ({ type: 'normal', id: q.id }))
  }

  return {
    view, questions, gateQuestions, results,
    answers, gateAnswers, currentIndex, playerName, ticketNumber,
    runSequence, currentItem, totalCount, isFinished, progress, answeredCount,
    isFallback, envelopeSeen,
    getQuestionObj, init, answer, answerQuestion, startExam, restart, triggerFallback, calcDimensionTotal
  }
})
