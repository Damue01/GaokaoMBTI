/**
 * 自动化测试脚本：模拟不同答题路径，验证所有院校匹配结果
 * 
 * 测试用例：
 * 1. 全选A → 应匹配京华大学（理智型）
 * 2. 全选B → 应匹配某焦虑型院校
 * 3. 全选C → 应匹配某加戏型院校
 * 4. 全选D → 应匹配某虚无型院校
 * 5. 混合选择 → 验证中间态匹配
 * 6. 验证各院校之间的概率分布差距
 */

const fs = require('fs');
const path = require('path');

const questions = JSON.parse(fs.readFileSync(path.join(__dirname, 'public/questions.json'), 'utf8'));
const results = JSON.parse(fs.readFileSync(path.join(__dirname, 'public/results.json'), 'utf8'));

const ALL_DIMENSIONS = [
  'S1', 'S2', 'S3', 'E1', 'E2', 'E3',
  'A1', 'A2', 'A3', 'Ac1', 'Ac2', 'Ac3',
  'So1', 'So2', 'So3'
];
const DEFAULT_VALUE = 2;

function extractUserVector(answers, questionsList) {
  const dimScores = {};
  ALL_DIMENSIONS.forEach(d => { dimScores[d] = []; });

  for (const [qId, label] of Object.entries(answers)) {
    const q = questionsList.find(q => q.id === Number(qId));
    if (!q) continue;
    const opt = q.options.find(o => o.label === label);
    if (!opt || !opt.dimension_map) continue;
    for (const [dim, val] of Object.entries(opt.dimension_map)) {
      if (dimScores[dim]) dimScores[dim].push(val);
    }
  }

  const vector = {};
  ALL_DIMENSIONS.forEach(d => {
    const scores = dimScores[d];
    vector[d] = scores.length === 0 ? DEFAULT_VALUE : scores.reduce((a, b) => a + b, 0) / scores.length;
  });
  return vector;
}

function manhattanDistance(vecA, vecB) {
  let dist = 0;
  ALL_DIMENSIONS.forEach(d => {
    dist += Math.abs((vecA[d] || DEFAULT_VALUE) - (vecB[d] || DEFAULT_VALUE));
  });
  return dist;
}

function matchUniversity(userVector, universities) {
  const allDistances = universities.map(uni => ({
    university: uni,
    distance: manhattanDistance(userVector, uni.coordinates)
  }));
  allDistances.sort((a, b) => a.distance - b.distance);
  return allDistances;
}

// ========================
// 测试1: 统一答案路径
// ========================
console.log('='.repeat(60));
console.log('测试1: 统一答案路径');
console.log('='.repeat(60));

['A', 'B', 'C', 'D'].forEach(label => {
  const answers = {};
  questions.questions.forEach(q => { answers[q.id] = label; });
  const vec = extractUserVector(answers, questions.questions);
  const matches = matchUniversity(vec, results.universities);
  
  console.log(`\n全选${label}:`);
  console.log(`  用户向量: ${JSON.stringify(vec)}`);
  console.log(`  匹配排名:`);
  matches.forEach((m, i) => {
    console.log(`    ${i+1}. ${m.university.name} (距离: ${m.distance.toFixed(2)})`);
  });
});

// ========================
// 测试2: 维度覆盖检查
// ========================
console.log('\n' + '='.repeat(60));
console.log('测试2: 各维度被多少道题覆盖');
console.log('='.repeat(60));

const dimCoverage = {};
ALL_DIMENSIONS.forEach(d => { dimCoverage[d] = []; });

questions.questions.forEach(q => {
  q.options.forEach(opt => {
    if (opt.dimension_map) {
      Object.keys(opt.dimension_map).forEach(dim => {
        if (!dimCoverage[dim].includes(q.id)) {
          dimCoverage[dim].push(q.id);
        }
      });
    }
  });
});

ALL_DIMENSIONS.forEach(d => {
  const label = results.dimension_labels[d] || d;
  console.log(`  ${d} (${label}): ${dimCoverage[d].length}题 → Q${dimCoverage[d].join(', Q')}`);
});

// 找出未被覆盖的维度
const uncovered = ALL_DIMENSIONS.filter(d => dimCoverage[d].length === 0);
if (uncovered.length > 0) {
  console.log(`\n  ⚠️ 未覆盖维度: ${uncovered.join(', ')}`);
} else {
  console.log(`\n  ✅ 所有维度均被覆盖`);
}

// ========================
// 测试3: 院校坐标分析
// ========================
console.log('\n' + '='.repeat(60));
console.log('测试3: 院校坐标分析');
console.log('='.repeat(60));

results.universities.forEach(uni => {
  console.log(`\n${uni.name} (${uni.english_name}):`);
  console.log(`  坐标: ${JSON.stringify(uni.coordinates)}`);
});

// ========================
// 测试4: 随机模拟10000次答题的院校分布
// ========================
console.log('\n' + '='.repeat(60));
console.log('测试4: 随机模拟10000次答题 → 各院校命中率');
console.log('='.repeat(60));

const hitCount = {};
results.universities.forEach(u => { hitCount[u.name] = 0; });
const SIMULATIONS = 10000;

for (let i = 0; i < SIMULATIONS; i++) {
  const answers = {};
  questions.questions.forEach(q => {
    const labels = ['A', 'B', 'C', 'D'];
    answers[q.id] = labels[Math.floor(Math.random() * 4)];
  });
  const vec = extractUserVector(answers, questions.questions);
  const matches = matchUniversity(vec, results.universities);
  hitCount[matches[0].university.name]++;
}

console.log(`\n模拟 ${SIMULATIONS} 次均匀随机答题:`);
const rates = [];
results.universities.forEach(u => {
  const rate = (hitCount[u.name] / SIMULATIONS * 100).toFixed(2);
  rates.push({ name: u.name, rate: parseFloat(rate) });
  console.log(`  ${u.name}: ${hitCount[u.name]}次 (${rate}%)`);
});

rates.sort((a, b) => b.rate - a.rate);
const maxRate = rates[0].rate;
const minRate = rates[rates.length - 1].rate;
const gap = maxRate - minRate;
console.log(`\n  最高: ${rates[0].name} ${maxRate}%`);
console.log(`  最低: ${rates[rates.length - 1].name} ${minRate}%`);
console.log(`  差距: ${gap.toFixed(2)}%`);
if (gap > 10) {
  console.log(`  ⚠️ 院校间概率差距超过10%，需要调整坐标！`);
} else {
  console.log(`  ✅ 院校间概率差距在10%以内`);
}

// ========================
// 测试5: 各院校的理想答题路径
// ========================
console.log('\n' + '='.repeat(60));
console.log('测试5: 各院校的"理想答题路径"（最小距离答案组合采样）');
console.log('='.repeat(60));

results.universities.forEach(uni => {
  let bestDist = Infinity;
  let bestAnswers = null;
  
  // 采样1000次找到最接近该院校的答案组合
  for (let i = 0; i < 5000; i++) {
    const answers = {};
    questions.questions.forEach(q => {
      const labels = ['A', 'B', 'C', 'D'];
      answers[q.id] = labels[Math.floor(Math.random() * 4)];
    });
    const vec = extractUserVector(answers, questions.questions);
    const dist = manhattanDistance(vec, uni.coordinates);
    if (dist < bestDist) {
      bestDist = dist;
      bestAnswers = { ...answers };
    }
  }
  
  const answerStr = questions.questions.map(q => `Q${q.id}:${bestAnswers[q.id]}`).join(' ');
  console.log(`\n${uni.name}: 最小距离=${bestDist.toFixed(2)}`);
  console.log(`  答案: ${answerStr}`);
});

// ========================
// 测试6: 门控触发检查
// ========================
console.log('\n' + '='.repeat(60));
console.log('测试6: 门控(Gate)题目检查');
console.log('='.repeat(60));

questions.gate_questions.forEach(gq => {
  console.log(`\n${gq.id}: ${gq.stem.substring(0, 40)}...`);
  console.log(`  触发条件: ${gq.trigger_condition}`);
  gq.options.forEach(opt => {
    console.log(`    ${opt.label}: gate_result=${opt.gate_result || '无'}`);
  });
});

// ========================
// 测试7: Q8门控触发路径
// ========================
console.log('\n' + '='.repeat(60));
console.log('测试7: Q8门控标记检查');
console.log('='.repeat(60));

const q8 = questions.questions.find(q => q.id === 8);
if (q8) {
  console.log(`Q8 gate_trigger: ${q8.gate_trigger}`);
  q8.options.forEach(opt => {
    console.log(`  ${opt.label}: gate_flag=${opt.gate_flag || '无'}, text=${opt.text.substring(0, 30)}...`);
  });
}

console.log('\n' + '='.repeat(60));
console.log('全部测试完成');
console.log('='.repeat(60));
