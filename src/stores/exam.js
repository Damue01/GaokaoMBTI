import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'gaokao-exam-state'

// BUG 抽签命中率（8%）
const BUG_LOTTERY_RATE = 0.08

// 故障字符池：与 BUG 题题干保持同一视觉语言
export const BUG_CHAR_POOL = ['▓', '█', '▒', '░']

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
  const examLetter = ref(['M', 'B', 'T', 'I'][Math.floor(Math.random() * 4)])

  // BUG 抽签结果：与准考证号绑定，进入首页时就抽；restart 时随准考证号一起重抽
  const bugLotteryWon = ref(Math.random() < BUG_LOTTERY_RATE)

  // 生成 13 位准考证号: YY + AAAA + SS + CCC + NN
  function generateTicket() {
    const yy = '26'
    const area = String(Math.floor(1000 + Math.random() * 9000))    // 4 位考区
    const subj = '99'                                                 // 99 = 人格综合
    const room = String(Math.floor(100 + Math.random() * 900))       // 3 位考场
    const seat = String(Math.floor(1 + Math.random() * 30)).padStart(2, '0') // 01-30
    return yy + area + subj + room + seat
  }

  // 运行时题序（含插入的门控题）
  const runSequence = ref([])     // [{ type:'normal', id:1 }, { type:'gate', id:'G1' }]

  // 门控 G1 (BUG题) 是否已插入
  const g1Inserted = ref(false)

  // 首次答题的时间戳（毫秒）。用于计算平均答题速度（水豚触发）
  const firstAnswerAt = ref(0)

  // 反选/改选次数：用户把已选的选项再点一次（反选涂销）或改选到其他选项算一次
  // 用于水豚触发的「零犹豫」判定
  const changeCount = ref(0)

  // 是否因空闲超时触发 fallback 结果
  const isFallback = ref(false)

  // 信封是否已被拆开（用于区分首次进入和刷新恢复）
  const envelopeSeen = ref(false)

  // 选项乱序映射: { [questionKey]: ['C','A','D','B'] }
  // questionKey 格式: 'n-<id>' (normal) / 'g-<id>' (gate)
  // 数组第 i 位表示：新位置 i（即显示为 A/B/C/D 中的第 i 个）对应原始的 label
  const optionOrderMap = ref({})

  // Fisher–Yates 洗牌
  function shuffleArray(arr) {
    const a = arr.slice()
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  // 为所有题目（普通 + 门控）生成选项乱序映射
  function regenerateOptionOrder() {
    const map = {}
    const labels = ['A', 'B', 'C', 'D']
    for (const q of questions.value) {
      const original = q.options.map(o => o.label)
      map[`n-${q.id}`] = shuffleArray(original).slice(0, labels.length)
    }
    for (const q of gateQuestions.value) {
      const original = q.options.map(o => o.label)
      map[`g-${q.id}`] = shuffleArray(original).slice(0, labels.length)
    }
    optionOrderMap.value = map
  }

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

  // 已答题数（不计入 BUG 题：BUG 题不占答题进度）
  const answeredCount = computed(() => {
    const normalCount = Object.keys(answers.value).length
    const gateCount = Object.keys(gateAnswers.value).filter(id => {
      const gq = gateQuestions.value.find(q => q.id === id)
      return gq && !gq.is_bug
    }).length
    return normalCount + gateCount
  })

  // 获取题目的实际对象（应用选项乱序；门控题做 {SEAT4} 等模板替换）
  function getQuestionObj(item) {
    if (!item) return null
    let raw = null
    let key = null
    if (item.type === 'normal') {
      raw = questions.value.find(q => q.id === item.id)
      key = `n-${item.id}`
    } else if (item.type === 'gate') {
      raw = gateQuestions.value.find(q => q.id === item.id)
      key = `g-${item.id}`
    }
    if (!raw) return null

    // 门控题题干里的 {SEAT4} 替换为准考证号后 4 位（考场末2位+座位2位）
    let stem = raw.stem
    if (item.type === 'gate' && typeof stem === 'string' && stem.includes('{SEAT4}')) {
      const seat4 = (ticketNumber.value || '').slice(-4) || '0000'
      stem = stem.split('{SEAT4}').join(seat4)
    }

    const order = optionOrderMap.value[key]
    if (!order || order.length !== raw.options.length) {
      return stem === raw.stem ? raw : { ...raw, stem }
    }

    const displayLabels = ['A', 'B', 'C', 'D']
    const shuffledOptions = order.map((origLabel, idx) => {
      const orig = raw.options.find(o => o.label === origLabel)
      if (!orig) return null
      return {
        ...orig,
        label: displayLabels[idx],        // 新的显示字母
        _origLabel: origLabel             // 保留原始字母用于评分反查
      }
    }).filter(Boolean)

    return { ...raw, stem, options: shuffledOptions }
  }

  // 将显示字母（A/B/C/D）映射回原始字母
  function resolveOriginalLabel(item, displayLabel) {
    if (!item) return displayLabel
    const key = item.type === 'normal' ? `n-${item.id}` : `g-${item.id}`
    const order = optionOrderMap.value[key]
    if (!order) return displayLabel
    const idx = ['A', 'B', 'C', 'D'].indexOf(displayLabel)
    if (idx < 0 || idx >= order.length) return displayLabel
    return order[idx]
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
      bugLotteryWon.value = saved.bugLotteryWon || false
      firstAnswerAt.value = saved.firstAnswerAt || 0
      changeCount.value = saved.changeCount || 0
      isFallback.value = saved.isFallback || false
      envelopeSeen.value = saved.envelopeSeen || false
      optionOrderMap.value = saved.optionOrderMap || {}
      // 若旧存档没有乱序映射，现场补一份
      if (!saved.optionOrderMap || Object.keys(saved.optionOrderMap).length === 0) {
        regenerateOptionOrder()
      }
    } else {
      // 初始化运行序列（仅常规题）
      runSequence.value = qRes.questions.map(q => ({ type: 'normal', id: q.id }))
      // 初始化选项乱序
      regenerateOptionOrder()
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
        bugLotteryWon: bugLotteryWon.value,
        firstAnswerAt: firstAnswerAt.value,
        changeCount: changeCount.value,
        isFallback: isFallback.value,
        envelopeSeen: envelopeSeen.value,
        optionOrderMap: optionOrderMap.value
      }),
      (state) => { saveState(state) },
      { deep: true }
    )
  }

  // 按题目 ID 作答（滚动模式使用）
  // optionLabel 是用户点击时看到的显示字母（A/B/C/D），需转换回原始字母再存储与评分
  function answerQuestion(questionId, questionType, optionLabel) {
    const item = { type: questionType, id: questionId }
    const origLabel = resolveOriginalLabel(item, optionLabel)

    // 记录首次答题时间（用于计算平均答题速度 → 水豚触发）
    if (firstAnswerAt.value === 0) {
      firstAnswerAt.value = Date.now()
    }

    if (questionType === 'normal') {
      const prev = answers.value[questionId]
      if (prev === origLabel) {
        // 反选涂销（已选的又点了一次）→ 记一次「犹豫」
        const { [questionId]: _, ...rest } = answers.value
        answers.value = rest
        changeCount.value += 1
      } else {
        if (prev !== undefined) {
          // 改选（已有答案，改成别的）→ 记一次「犹豫」
          changeCount.value += 1
        }
        answers.value = { ...answers.value, [questionId]: origLabel }
        checkGateTrigger(questionId, origLabel)
      }
    } else if (questionType === 'gate') {
      if (gateAnswers.value[questionId] === origLabel) {
        const { [questionId]: _, ...rest } = gateAnswers.value
        gateAnswers.value = rest
      } else {
        gateAnswers.value = { ...gateAnswers.value, [questionId]: origLabel }
      }
    }

    // 检查是否全部普通题答完（BUG 题不算进度，答不答都能进结果页）
    if (Object.keys(answers.value).length >= questions.value.length) {
      envelopeSeen.value = false
      setTimeout(() => { view.value = 'result' }, 1000)
    }
  }

  // 原始 label 转显示 label（供视图层高亮选中态）
  function toDisplayLabel(item, originalLabel) {
    if (!item || !originalLabel) return originalLabel
    const key = item.type === 'normal' ? `n-${item.id}` : `g-${item.id}`
    const order = optionOrderMap.value[key]
    if (!order) return originalLabel
    const idx = order.indexOf(originalLabel)
    if (idx < 0) return originalLabel
    return ['A', 'B', 'C', 'D'][idx] || originalLabel
  }

  // 回答当前题（保留旧接口兼容）
  function answer(optionLabel) {
    const item = currentItem.value
    if (!item) return
    const origLabel = resolveOriginalLabel(item, optionLabel)

    // 记录首次答题时间
    if (firstAnswerAt.value === 0) {
      firstAnswerAt.value = Date.now()
    }

    if (item.type === 'normal') {
      answers.value[item.id] = origLabel
      // 检查门控触发
      checkGateTrigger(item.id, origLabel)
    } else if (item.type === 'gate') {
      gateAnswers.value[item.id] = origLabel
    }

    // 前进
    currentIndex.value++

    // 检查是否答完
    if (isFinished.value) {
      envelopeSeen.value = false
      view.value = 'result'
    }
  }

  // 检查是否需要插入门控题
  function checkGateTrigger(questionId, optionLabel) {
    // 只在答完 Q15 时检查：如果开考时抽中了 BUG 彩票，就插入 G1（BUG 题）
    if (questionId === 15 && !g1Inserted.value && bugLotteryWon.value) {
      insertGateAfter('G1', 15)
      g1Inserted.value = true
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

  // 开始考试（抽签已在准考证号生成时完成，这里只切换视图）
  function startExam() {
    view.value = 'exam'
  }

  // 水豚触发判定：
  //   · 平均答题速度 ≤ 3 秒/题
  //   · 整个过程零反选、零改选（changeCount === 0）
  //   · 已答完 ≥ 15 题
  const CAPYBARA_AVG_MS = 3000
  const CAPYBARA_MIN_Q = 15
  function isCapybaraTriggered() {
    const answeredN = Object.keys(answers.value).length
    if (answeredN < CAPYBARA_MIN_Q) return false
    if (!firstAnswerAt.value) return false
    if (changeCount.value > 0) return false
    const elapsed = Date.now() - firstAnswerAt.value
    const avg = elapsed / answeredN
    return avg <= CAPYBARA_AVG_MS
  }

  // 触发空闲 fallback，直接跳转结果页
  function triggerFallback() {
    isFallback.value = true
    envelopeSeen.value = false
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
    // 准考证号重生 → BUG 抽签同步重抽
    bugLotteryWon.value = Math.random() < BUG_LOTTERY_RATE
    firstAnswerAt.value = 0
    changeCount.value = 0
    isFallback.value = false
    envelopeSeen.value = false
    runSequence.value = questions.value.map(q => ({ type: 'normal', id: q.id }))
    regenerateOptionOrder()
  }

  return {
    view, questions, gateQuestions, results,
    answers, gateAnswers, currentIndex, playerName, ticketNumber, examLetter,
    runSequence, currentItem, totalCount, isFinished, progress, answeredCount,
    isFallback, envelopeSeen, g1Inserted,
    bugLotteryWon, firstAnswerAt, changeCount,
    getQuestionObj, init, answer, answerQuestion, startExam, restart, triggerFallback, calcDimensionTotal,
    toDisplayLabel, isCapybaraTriggered
  }
})
