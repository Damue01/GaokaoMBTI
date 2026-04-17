/**
 * 评分引擎 — Manhattan 距离匹配 + 门控彩蛋覆盖
 */

const ALL_DIMENSIONS = ['C', 'P', 'D', 'So']

// 默认值：未被测到的维度默认为 2（中间值）
const DEFAULT_VALUE = 2

/**
 * 从答题记录中提取用户的15维向量
 * @param {Object} answers - { questionId: optionLabel }
 * @param {Array} questions - 题目数组
 * @returns {Object} - { C: 2.5, P: 3, ... }
 */
export function extractUserVector(answers, questions) {
  // 每个维度收集所有得分
  const dimScores = {}
  ALL_DIMENSIONS.forEach(d => { dimScores[d] = [] })

  for (const [qId, label] of Object.entries(answers)) {
    const q = questions.find(q => q.id === Number(qId))
    if (!q) continue
    const opt = q.options.find(o => o.label === label)
    if (!opt || !opt.dimension_map) continue
    for (const [dim, val] of Object.entries(opt.dimension_map)) {
      if (dimScores[dim]) {
        dimScores[dim].push(val)
      }
    }
  }

  // 每个维度取平均值，无数据用默认值
  const vector = {}
  ALL_DIMENSIONS.forEach(d => {
    const scores = dimScores[d]
    if (scores.length === 0) {
      vector[d] = DEFAULT_VALUE
    } else {
      vector[d] = scores.reduce((a, b) => a + b, 0) / scores.length
    }
  })

  return vector
}

/**
 * Manhattan 距离
 */
export function manhattanDistance(vecA, vecB) {
  let dist = 0
  ALL_DIMENSIONS.forEach(d => {
    dist += Math.abs((vecA[d] || DEFAULT_VALUE) - (vecB[d] || DEFAULT_VALUE))
  })
  return dist
}

/**
 * 签名维度距离：只计算大学坐标 ≠ 2 的维度，归一化
 */
export function signatureDistance(userVec, uniCoords) {
  const sigDims = ALL_DIMENSIONS.filter(d => uniCoords[d] !== DEFAULT_VALUE)
  if (sigDims.length === 0) return manhattanDistance(userVec, uniCoords)
  let dist = 0
  sigDims.forEach(d => {
    dist += Math.abs((userVec[d] || DEFAULT_VALUE) - (uniCoords[d] || DEFAULT_VALUE))
  })
  return dist / sigDims.length
}

/**
 * 匹配最近的大学
 * @param {Object} userVector - 用户15维向量
 * @param {Array} universities - 大学数组（含 coordinates 字段）
 * @returns {{ university: Object, distance: number, allDistances: Array }}
 */
export function matchUniversity(userVector, universities) {
  const allDistances = universities.map(uni => ({
    university: uni,
    distance: signatureDistance(userVector, uni.coordinates)
  }))
  allDistances.sort((a, b) => a.distance - b.distance)
  return {
    university: allDistances[0].university,
    distance: allDistances[0].distance,
    allDistances
  }
}

/**
 * 检查门控彩蛋是否触发
 * @param {Object} gateAnswers - { gateId: optionLabel }
 * @param {Array} gateQuestions - 门控题数组
 * @returns {string|null} - 彩蛋结果名称 或 null
 */
export function checkGateResult(gateAnswers, gateQuestions) {
  for (const [gateId, label] of Object.entries(gateAnswers)) {
    const gq = gateQuestions.find(q => q.id === gateId)
    if (!gq) continue
    const opt = gq.options.find(o => o.label === label)
    if (opt && opt.gate_result) {
      return opt.gate_result
    }
  }
  return null
}

/**
 * 完整评分流程
 * @param {Object} params
 * @returns {{ isGate: boolean, result: Object, userVector: Object, matchInfo: Object|null }}
 */
export function computeResult({ answers, gateAnswers, questions, gateQuestions, resultsData }) {
  // 先检查门控彩蛋
  const gateResultName = checkGateResult(gateAnswers, gateQuestions)
  if (gateResultName && resultsData.gate_results[gateResultName]) {
    const gateResult = resultsData.gate_results[gateResultName]
    return {
      isGate: true,
      result: gateResult,
      userVector: extractUserVector(answers, questions),
      matchInfo: null
    }
  }

  // 正常 Manhattan 匹配
  const userVector = extractUserVector(answers, questions)
  const matchInfo = matchUniversity(userVector, resultsData.universities)

  return {
    isGate: false,
    result: matchInfo.university,
    userVector,
    matchInfo
  }
}

export { ALL_DIMENSIONS }
