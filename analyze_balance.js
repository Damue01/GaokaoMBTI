const fs = require('fs');
const questions = JSON.parse(fs.readFileSync('public/questions.json','utf8'));
const results = JSON.parse(fs.readFileSync('public/results.json','utf8'));

const ALL_DIMS = ['S1','S2','S3','E1','E2','E3','A1','A2','A3','Ac1','Ac2','Ac3','So1','So2','So3'];

// 1. Which dimensions are covered by which questions
console.log("=== 维度覆盖分析 ===");
const dimCoverage = {};
ALL_DIMS.forEach(d => dimCoverage[d] = []);
questions.questions.forEach(q => {
  q.options.forEach(opt => {
    if(opt.dimension_map) {
      Object.keys(opt.dimension_map).forEach(dim => {
        if(!dimCoverage[dim].includes(q.id)) dimCoverage[dim].push(q.id);
      });
    }
  });
});
ALL_DIMS.forEach(d => {
  console.log(${"$"}{d} ({results.dimension_labels[d]}): 覆盖{dimCoverage[d].length}题 → Q{dimCoverage[d].join(',Q')});
});

// 2. G1 trigger analysis
console.log("\n=== G1 门控触发分析 ===");
const q8 = questions.questions.find(q=>q.id===8);
q8.options.forEach(opt => {
  console.log(Q8 选{opt.label}: A1={opt.dimension_map.A1}, gate_flag={opt.gate_flag||'无'});
});
console.log("代码中G1触发条件: Q8 选D (仅D, 概率25%)");
console.log("JSON描述: Q8选C或D → 存在不一致!");

// 3. G2 trigger - So3 analysis
console.log("\n=== G2 门控触发分析 (So3 >= 11) ===");
const so3Questions = [];
questions.questions.forEach(q => {
  const so3Opts = {};
  q.options.forEach(opt => {
    if(opt.dimension_map && opt.dimension_map.So3 !== undefined) {
      so3Opts[opt.label] = opt.dimension_map.So3;
    }
  });
  if(Object.keys(so3Opts).length > 0 && q.id <= 14) {
    so3Questions.push({id: q.id, scores: so3Opts});
    console.log(Q{q.id}: {JSON.stringify(so3Opts)});
  }
});
console.log(\nSo3在Q14前涉及 {so3Questions.length} 道题);

// Enumerate all combos for So3
let total = 1;
so3Questions.forEach(q => total *= Object.keys(q.scores).length);
let triggerCount = 0;
function enumerate(idx, sum) {
  if(idx === so3Questions.length) {
    if(sum >= 11) triggerCount++;
    return;
  }
  Object.values(so3Questions[idx].scores).forEach(v => enumerate(idx+1, sum+v));
}
enumerate(0, 0);
console.log(总组合数: {total}, So3>=11的组合数: {triggerCount}, 概率: {(triggerCount/total*100).toFixed(2)}%);

// 4. Monte Carlo simulation
console.log("\n=== Monte Carlo 模拟 (100000次随机答题) ===");
const N = 100000;
const uniCount = {};
results.universities.forEach(u => uniCount[u.name] = 0);
let g1TriggerCount = 0, g2TriggerCount = 0;
let g1ResultCount = 0, g2ResultCount = 0;

for(let trial=0; trial<N; trial++) {
  const answers = {};
  // Random answers for all 20 questions
  questions.questions.forEach(q => {
    const opts = ['A','B','C','D'];
    answers[q.id] = opts[Math.floor(Math.random()*4)];
  });
  
  // Check G1 trigger
  let g1Triggered = answers[8] === 'D';
  if(g1Triggered) {
    g1TriggerCount++;
    // Random answer for G1
    const g1Ans = ['A','B','C','D'][Math.floor(Math.random()*4)];
    const g1q = questions.gate_questions.find(g=>g.id==='G1');
    const g1opt = g1q.options.find(o=>o.label===g1Ans);
    if(g1opt && g1opt.gate_result) { g1ResultCount++; continue; }
  }
  
  // Check G2 trigger - So3 total from answered questions up to Q14
  let so3Total = 0;
  for(const [qId, label] of Object.entries(answers)) {
    if(Number(qId) > 14) continue;
    const q = questions.questions.find(q=>q.id===Number(qId));
    if(!q) continue;
    const opt = q.options.find(o=>o.label===label);
    if(opt && opt.dimension_map && opt.dimension_map.So3 !== undefined) {
      so3Total += opt.dimension_map.So3;
    }
  }
  if(so3Total >= 11) {
    g2TriggerCount++;
    const g2Ans = ['A','B','C','D'][Math.floor(Math.random()*4)];
    const g2q = questions.gate_questions.find(g=>g.id==='G2');
    const g2opt = g2q.options.find(o=>o.label===g2Ans);
    if(g2opt && g2opt.gate_result) { g2ResultCount++; continue; }
  }
  
  // Normal university matching
  const dimScores = {};
  ALL_DIMS.forEach(d => dimScores[d] = []);
  for(const [qId, label] of Object.entries(answers)) {
    const q = questions.questions.find(q=>q.id===Number(qId));
    if(!q) continue;
    const opt = q.options.find(o=>o.label===label);
    if(opt && opt.dimension_map) {
      for(const [dim, val] of Object.entries(opt.dimension_map)) {
        if(dimScores[dim]) dimScores[dim].push(val);
      }
    }
  }
  const userVector = {};
  ALL_DIMS.forEach(d => {
    userVector[d] = dimScores[d].length > 0 ? dimScores[d].reduce((a,b)=>a+b,0)/dimScores[d].length : 2;
  });
  
  let bestUni = null, bestDist = Infinity;
  results.universities.forEach(uni => {
    let dist = 0;
    ALL_DIMS.forEach(d => dist += Math.abs((userVector[d]||2) - (uni.coordinates[d]||2)));
    if(dist < bestDist) { bestDist = dist; bestUni = uni.name; }
  });
  uniCount[bestUni]++;
}

console.log("\n大学匹配概率:");
Object.entries(uniCount).sort((a,b)=>b[1]-a[1]).forEach(([name,count]) => {
  console.log(  {name}: {count}次 ({(count/N*100).toFixed(2)}%));
});

console.log(\nG1 门控触发: {g1TriggerCount}次 ({(g1TriggerCount/N*100).toFixed(2)}%));
console.log(G1 隐藏结局: {g1ResultCount}次 ({(g1ResultCount/N*100).toFixed(2)}%));
console.log(G2 门控触发: {g2TriggerCount}次 ({(g2TriggerCount/N*100).toFixed(2)}%));
console.log(G2 隐藏结局: {g2ResultCount}次 ({(g2ResultCount/N*100).toFixed(2)}%));

// 5. Check option value ranges
console.log("\n=== 各选项分值分布 ===");
const valueCounts = {A:{}, B:{}, C:{}, D:{}};
questions.questions.forEach(q => {
  q.options.forEach(opt => {
    if(opt.dimension_map) {
      Object.values(opt.dimension_map).forEach(v => {
        valueCounts[opt.label][v] = (valueCounts[opt.label][v]||0) + 1;
      });
    }
  });
});
Object.entries(valueCounts).forEach(([label, counts]) => {
  const sorted = Object.entries(counts).sort((a,b)=>Number(a[0])-Number(b[0]));
  const total = sorted.reduce((s,[,c])=>s+c, 0);
  const avg = sorted.reduce((s,[v,c])=>s+Number(v)*c, 0) / total;
  console.log(选项{label}: {sorted.map(([v,c])=>${"$"}{v}分×{c}).join(', ')} (均值{avg.toFixed(2)}));
});
