/**
 * 最终综合验证脚本
 */
const fs = require('fs');
const q = JSON.parse(fs.readFileSync('public/questions.json', 'utf8'));
const r = JSON.parse(fs.readFileSync('public/results.json', 'utf8'));
const ALL = ['S1','S2','S3','E1','E2','E3','A1','A2','A3','Ac1','Ac2','Ac3','So1','So2','So3'];
const DEF = 2;

function getUserVector(answers) {
  const dimScores = {}; ALL.forEach(d => dimScores[d] = []);
  for (const [qId, label] of Object.entries(answers)) {
    const qs = q.questions.find(q => q.id === Number(qId));
    if (!qs) continue;
    const opt = qs.options.find(o => o.label === label);
    if (opt && opt.dimension_map) {
      for (const [dim, val] of Object.entries(opt.dimension_map))
        if (dimScores[dim]) dimScores[dim].push(val);
    }
  }
  const vec = {};
  ALL.forEach(d => { vec[d] = dimScores[d].length > 0 ? dimScores[d].reduce((a,b)=>a+b,0)/dimScores[d].length : DEF; });
  return vec;
}

function sigDist(userVec, coords) {
  const sigs = ALL.filter(d => coords[d] !== DEF);
  if (sigs.length === 0) return 999;
  let dist = 0;
  sigs.forEach(d => dist += Math.abs((userVec[d]||DEF) - (coords[d]||DEF)));
  return dist / sigs.length;
}

function match(vec) {
  let best = null, bestDist = Infinity, all = [];
  r.universities.forEach(u => {
    const d = sigDist(vec, u.coordinates);
    all.push({ name: u.name, dist: d });
    if (d < bestDist) { bestDist = d; best = u.name; }
  });
  return { best, bestDist, all };
}

// === 1. 签名维度拓扑 ===
console.log('=== 1. 当前大学签名维度配置 ===');
const dimLabels = r.dimension_labels;
r.universities.forEach(u => {
  const sigs = ALL.filter(d => u.coordinates[d] !== DEF);
  console.log(`  ${u.name}:`);
  sigs.forEach(d => console.log(`    ${d}(${dimLabels[d]}) = ${u.coordinates[d]}`));
});

// === 2. 维度共享关系 ===
console.log('\n=== 2. 签名维度共享对 ===');
const sigMap = {};
r.universities.forEach(u => {
  ALL.forEach(d => {
    if (u.coordinates[d] !== DEF) {
      if (!sigMap[d]) sigMap[d] = [];
      sigMap[d].push({ name: u.name, val: u.coordinates[d] });
    }
  });
});
Object.entries(sigMap).forEach(([d, unis]) => {
  if (unis.length > 1) {
    console.log(`  ${d}(${dimLabels[d]}): ` + unis.map(u => `${u.name}=${u.val}`).join(' ↔ '));
  }
});

// === 3. Monte Carlo 200K ===
console.log('\n=== 3. Monte Carlo 200K 随机分布 ===');
const N = 200000;
const uniCount = {};
r.universities.forEach(u => uniCount[u.name] = 0);
for (let i = 0; i < N; i++) {
  const answers = {};
  q.questions.forEach(qs => { answers[qs.id] = ['A','B','C','D'][Math.floor(Math.random()*4)]; });
  const vec = getUserVector(answers);
  const { best } = match(vec);
  uniCount[best]++;
}
const entries = Object.entries(uniCount).sort((a,b) => b[1]-a[1]);
entries.forEach(([name, count]) => {
  const pct = (count/N*100).toFixed(2);
  const bar = '█'.repeat(Math.round(count/N*50));
  console.log(`  ${name}: ${pct}% ${bar}`);
});
const pcts = entries.map(([,c]) => c/N*100);
const mean = pcts.reduce((a,b)=>a+b,0)/pcts.length;
const stddev = Math.sqrt(pcts.reduce((s,p) => s + (p-mean)**2, 0)/pcts.length);
console.log(`  标准差: ${stddev.toFixed(2)}%`);

// === 4. 人设测试：定义5种典型答题人格 ===
console.log('\n=== 4. 典型人格匹配测试 ===');
const profiles = [
  { name: '逃避型(高S1/低Ac1/低So1)', desc: '不查分、不做大题、不对答案',
    strategy: (qs) => {
      // prefer options that give high S1, low Ac1, low So1
      const sigs = { S1: 4, Ac1: 1, So1: 1 };
      return pickBest(qs, sigs);
    }
  },
  { name: '学霸型(高S2/低E3/低So3)', desc: '知识扎实、不依赖社交、不伪装',
    strategy: (qs) => {
      const sigs = { S2: 4, E3: 1, So3: 1 };
      return pickBest(qs, sigs);
    }
  },
  { name: '猴子型(低S3/高A1/高Ac1)', desc: '不信考纲、野生解题、死磕大题',
    strategy: (qs) => {
      const sigs = { S3: 1, A1: 4, Ac1: 4 };
      return pickBest(qs, sigs);
    }
  },
  { name: '佛系型(高S3/高A3/高So3)', desc: '看淡考试、佛系心态、随缘伪装',
    strategy: (qs) => {
      const sigs = { S3: 4, A3: 4, So3: 4 };
      return pickBest(qs, sigs);
    }
  },
  { name: '波及型(高E1/高E3/高So1)', desc: '应激强烈、社交依赖、主动对答案',
    strategy: (qs) => {
      const sigs = { E1: 4, E3: 4, So1: 4 };
      return pickBest(qs, sigs);
    }
  },
];

function pickBest(qs, targets) {
  let bestLabel = 'A', bestScore = -Infinity;
  qs.options.forEach(opt => {
    let score = 0;
    for (const [dim, target] of Object.entries(targets)) {
      if (opt.dimension_map[dim] !== undefined) {
        score -= Math.abs(opt.dimension_map[dim] - target);
      }
    }
    if (score > bestScore) { bestScore = score; bestLabel = opt.label; }
  });
  return bestLabel;
}

profiles.forEach(p => {
  const answers = {};
  q.questions.forEach(qs => { answers[qs.id] = p.strategy(qs); });
  const vec = getUserVector(answers);
  const { best, bestDist, all } = match(vec);
  const sorted = all.sort((a,b) => a.dist - b.dist);
  console.log(`  ${p.name} → ${best} (距离${bestDist.toFixed(2)})`);
  console.log(`    ${p.desc}`);
  console.log(`    排序: ${sorted.map(a => `${a.name}(${a.dist.toFixed(2)})`).join(' > ')}`);
});

// === 5. 全选测试 ===
console.log('\n=== 5. 全选同一选项 ===');
['A','B','C','D'].forEach(choice => {
  const answers = {};
  q.questions.forEach(qs => { answers[qs.id] = choice; });
  const vec = getUserVector(answers);
  const { best, bestDist } = match(vec);
  console.log(`  全选${choice} → ${best} (距离${bestDist.toFixed(2)})`);
});
