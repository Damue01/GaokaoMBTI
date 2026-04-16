/**
 * Monte Carlo 模拟：测试不同大学坐标方案的匹配概率分布
 */
const fs = require('fs');
const questions = JSON.parse(fs.readFileSync('public/questions.json','utf8'));

const ALL_DIMS = ['S1','S2','S3','E1','E2','E3','A1','A2','A3','Ac1','Ac2','Ac3','So1','So2','So3'];
const N = 200000;

// 新坐标方案：每所大学有 3-4 个"签名维度"在极值(1或4)，其余在中间值(2-3)
// A2 和 Ac2 全部设为 2（因为没有题目覆盖这两个维度，用户向量永远是默认值 2）
const newCoordinates = [
  {
    name: "鸽伦比亚大学",
    // 逃避型签名：S1↑(4题), E2↓(4题), E3↓(3题), So1↓(3题)
    coords: { S1:4, S2:2, S3:2, E1:2, E2:1, E3:1, A1:2, A2:2, A3:2, Ac1:2, Ac2:2, Ac3:2, So1:1, So2:3, So3:2 }
  },
  {
    name: "皇家戏精学院",
    // 表演型签名：So3↑(4题), A3↑(2题), S2↑(3题), E1↓(5题)
    coords: { S1:2, S2:4, S3:2, E1:1, E2:2, E3:2, A1:2, A2:2, A3:4, Ac1:2, Ac2:2, Ac3:2, So1:2, So2:2, So3:4 }
  },
  {
    name: "吗喽理工大学",
    // 蛮干型签名：A1↑(3题), Ac1↑(2题), S2↓(3题)
    coords: { S1:2, S2:1, S3:2, E1:2, E2:2, E3:2, A1:4, A2:2, A3:2, Ac1:4, Ac2:2, Ac3:2, So1:2, So2:2, So3:2 }
  },
  {
    name: "斯坦佛大学",
    // 佛系型签名：S1↓(4题), S3↑(2题), Ac1↓(2题), So1↓(3题)
    coords: { S1:1, S2:2, S3:4, E1:2, E2:2, E3:2, A1:2, A2:2, A3:2, Ac1:1, Ac2:2, Ac3:2, So1:1, So2:2, So3:2 }
  },
  {
    name: "加州大学波及你分校",
    // 社交攻击签名：E1↑(5题), E3↑(3题), So1↑(3题), So2↓(3题)
    coords: { S1:2, S2:2, S3:2, E1:4, E2:2, E3:4, A1:2, A2:2, A3:2, Ac1:2, Ac2:2, Ac3:2, So1:4, So2:1, So3:2 }
  }
];

function simulate(universities) {
  const uniCount = {};
  universities.forEach(u => uniCount[u.name] = 0);

  for(let trial = 0; trial < N; trial++) {
    const answers = {};
    questions.questions.forEach(q => {
      answers[q.id] = ['A','B','C','D'][Math.floor(Math.random()*4)];
    });

    // 计算用户向量
    const dimScores = {};
    ALL_DIMS.forEach(d => dimScores[d] = []);
    for(const [qId, label] of Object.entries(answers)) {
      const q = questions.questions.find(q => q.id === Number(qId));
      if(!q) continue;
      const opt = q.options.find(o => o.label === label);
      if(opt && opt.dimension_map) {
        for(const [dim, val] of Object.entries(opt.dimension_map)) {
          if(dimScores[dim]) dimScores[dim].push(val);
        }
      }
    }
    const userVector = {};
    ALL_DIMS.forEach(d => {
      userVector[d] = dimScores[d].length > 0 
        ? dimScores[d].reduce((a,b) => a+b, 0) / dimScores[d].length 
        : 2;
    });

    // Manhattan 距离匹配
    let bestUni = null, bestDist = Infinity;
    universities.forEach(uni => {
      let dist = 0;
      ALL_DIMS.forEach(d => dist += Math.abs((userVector[d]||2) - (uni.coords[d]||2)));
      if(dist < bestDist) { bestDist = dist; bestUni = uni.name; }
    });
    uniCount[bestUni]++;
  }
  return uniCount;
}

console.log(`=== Monte Carlo 模拟 (${N} 次) ===\n`);

console.log("--- 新坐标方案 ---");
const result = simulate(newCoordinates);
Object.entries(result).sort((a,b) => b[1]-a[1]).forEach(([name, count]) => {
  const pct = (count/N*100).toFixed(2);
  const bar = '█'.repeat(Math.round(count/N*50));
  console.log(`  ${name}: ${pct}% ${bar} (${count})`);
});

// 计算标准差评估平衡度
const pcts = Object.values(result).map(c => c/N*100);
const mean = pcts.reduce((a,b)=>a+b,0)/pcts.length;
const stddev = Math.sqrt(pcts.reduce((s,p) => s + (p-mean)**2, 0)/pcts.length);
console.log(`\n  理想值: 每所 20%, 标准差: ${stddev.toFixed(2)}%`);

// G2 触发概率验证 (阈值改为 10)
let g2Count = 0;
for(let trial = 0; trial < N; trial++) {
  const answers = {};
  questions.questions.forEach(q => {
    answers[q.id] = ['A','B','C','D'][Math.floor(Math.random()*4)];
  });
  let so3Total = 0;
  for(const [qId, label] of Object.entries(answers)) {
    if(Number(qId) > 14) continue;
    const q = questions.questions.find(q => q.id === Number(qId));
    if(!q) continue;
    const opt = q.options.find(o => o.label === label);
    if(opt && opt.dimension_map && opt.dimension_map.So3 !== undefined) {
      so3Total += opt.dimension_map.So3;
    }
  }
  if(so3Total >= 10) g2Count++;
}
console.log(`\nG2 门控触发概率 (阈值10): ${(g2Count/N*100).toFixed(2)}%`);
