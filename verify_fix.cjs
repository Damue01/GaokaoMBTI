/**
 * Monte Carlo 验证：签名维度距离算法 vs 旧全局距离算法
 */
const fs = require('fs');
const questions = JSON.parse(fs.readFileSync('public/questions.json', 'utf8'));
const results = JSON.parse(fs.readFileSync('public/results.json', 'utf8'));

const ALL_DIMS = ['S1','S2','S3','E1','E2','E3','A1','A2','A3','Ac1','Ac2','Ac3','So1','So2','So3'];
const DEFAULT = 2;
const N = 200000;

function getUserVector(answers) {
  const dimScores = {};
  ALL_DIMS.forEach(d => dimScores[d] = []);
  for (const [qId, label] of Object.entries(answers)) {
    const q = questions.questions.find(q => q.id === Number(qId));
    if (!q) continue;
    const opt = q.options.find(o => o.label === label);
    if (opt && opt.dimension_map) {
      for (const [dim, val] of Object.entries(opt.dimension_map)) {
        if (dimScores[dim]) dimScores[dim].push(val);
      }
    }
  }
  const vec = {};
  ALL_DIMS.forEach(d => {
    vec[d] = dimScores[d].length > 0
      ? dimScores[d].reduce((a, b) => a + b, 0) / dimScores[d].length
      : DEFAULT;
  });
  return vec;
}

// 旧算法：全局曼哈顿
function oldDistance(userVec, coords) {
  let dist = 0;
  ALL_DIMS.forEach(d => dist += Math.abs((userVec[d]||DEFAULT) - (coords[d]||DEFAULT)));
  return dist;
}

// 新算法：签名维度归一化距离
function newDistance(userVec, coords) {
  const sigDims = ALL_DIMS.filter(d => coords[d] !== DEFAULT);
  if (sigDims.length === 0) return oldDistance(userVec, coords);
  let dist = 0;
  sigDims.forEach(d => dist += Math.abs((userVec[d]||DEFAULT) - (coords[d]||DEFAULT)));
  return dist / sigDims.length;
}

function simulate(distanceFn) {
  const unis = results.universities;
  const uniCount = {};
  unis.forEach(u => uniCount[u.name] = 0);

  for (let i = 0; i < N; i++) {
    const answers = {};
    questions.questions.forEach(q => {
      answers[q.id] = ['A','B','C','D'][Math.floor(Math.random()*4)];
    });
    const vec = getUserVector(answers);

    let best = null, bestDist = Infinity;
    unis.forEach(u => {
      const d = distanceFn(vec, u.coordinates);
      if (d < bestDist) { bestDist = d; best = u.name; }
    });
    uniCount[best]++;
  }
  return uniCount;
}

function printResult(label, result) {
  console.log(`\n--- ${label} ---`);
  const entries = Object.entries(result).sort((a,b) => b[1]-a[1]);
  entries.forEach(([name, count]) => {
    const pct = (count/N*100).toFixed(2);
    const bar = '█'.repeat(Math.round(count/N*50));
    console.log(`  ${name}: ${pct}% ${bar} (${count})`);
  });
  const pcts = Object.values(result).map(c => c/N*100);
  const mean = pcts.reduce((a,b)=>a+b,0)/pcts.length;
  const stddev = Math.sqrt(pcts.reduce((s,p) => s + (p-mean)**2, 0)/pcts.length);
  console.log(`  标准差: ${stddev.toFixed(2)}% (理想: 每所20%, 标准差0%)`);
}

// 全选测试
function testAllSame(distanceFn, label) {
  console.log(`\n--- ${label}: 全选同一选项 ---`);
  ['A','B','C','D'].forEach(choice => {
    const answers = {};
    questions.questions.forEach(q => { answers[q.id] = choice; });
    const vec = getUserVector(answers);

    let best = null, bestDist = Infinity;
    results.universities.forEach(u => {
      const d = distanceFn(vec, u.coordinates);
      if (d < bestDist) { bestDist = d; best = u.name; }
    });
    console.log(`  全选${choice} -> ${best} (距离${bestDist.toFixed(2)})`);
  });
}

console.log(`=== Monte Carlo 验证 (${N} 次) ===`);
const oldResult = simulate(oldDistance);
printResult('旧算法（全局曼哈顿）', oldResult);
testAllSame(oldDistance, '旧算法');

const newResult = simulate(newDistance);
printResult('新算法（签名维度归一化）', newResult);
testAllSame(newDistance, '新算法');
