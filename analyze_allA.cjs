const fs = require('fs');
const q = JSON.parse(fs.readFileSync('public/questions.json','utf8'));
const r = JSON.parse(fs.readFileSync('public/results.json','utf8'));
const ALL = ['S1','S2','S3','E1','E2','E3','A1','A2','A3','Ac1','Ac2','Ac3','So1','So2','So3'];

// 京华签名维度: S2=4, E3=1, So3=1
// 全选A时: S2=1.33, E3=3.00, So3=2.00 → 全部方向反了！

console.log('=== 京华签名维度相关题目的ABCD完整分值 ===\n');

// S2相关题目
const s2Qs = q.questions.filter(qs => qs.options.some(o => o.dimension_map['S2'] !== undefined));
console.log('--- S2 (京华目标=4) ---');
s2Qs.forEach(qs => {
  console.log(`Q${qs.id}: ${qs.text.substring(0, 40)}...`);
  qs.options.forEach(o => {
    const s2 = o.dimension_map['S2'];
    if (s2 !== undefined) {
      console.log(`  ${o.label}: S2=${s2} "${o.text.substring(0, 35)}"`);
    }
  });
});

// E3相关题目
const e3Qs = q.questions.filter(qs => qs.options.some(o => o.dimension_map['E3'] !== undefined));
console.log('\n--- E3 (京华目标=1) ---');
e3Qs.forEach(qs => {
  console.log(`Q${qs.id}: ${qs.text.substring(0, 40)}...`);
  qs.options.forEach(o => {
    const e3 = o.dimension_map['E3'];
    if (e3 !== undefined) {
      console.log(`  ${o.label}: E3=${e3} "${o.text.substring(0, 35)}"`);
    }
  });
});

// So3相关题目
const so3Qs = q.questions.filter(qs => qs.options.some(o => o.dimension_map['So3'] !== undefined));
console.log('\n--- So3 (京华目标=1) ---');
so3Qs.forEach(qs => {
  console.log(`Q${qs.id}: ${qs.text.substring(0, 40)}...`);
  qs.options.forEach(o => {
    const so3 = o.dimension_map['So3'];
    if (so3 !== undefined) {
      console.log(`  ${o.label}: So3=${so3} "${o.text.substring(0, 35)}"`);
    }
  });
});

// 全选各字母的匹配结果
console.log('\n=== 全选ABCD的signatureDistance匹配 ===');
['A','B','C','D'].forEach(choice => {
  const dimScores = {}; ALL.forEach(d => dimScores[d] = []);
  q.questions.forEach(qs => {
    const opt = qs.options.find(o => o.label === choice);
    if(opt && opt.dimension_map) {
      for(const [dim, val] of Object.entries(opt.dimension_map)) {
        if(dimScores[dim]) dimScores[dim].push(val);
      }
    }
  });
  const userVec = {};
  ALL.forEach(d => {
    userVec[d] = dimScores[d].length > 0 ? dimScores[d].reduce((a,b)=>a+b,0)/dimScores[d].length : 2;
  });
  
  const dists = r.universities.map(u => {
    const sigs = ALL.filter(d => u.coordinates[d] !== 2);
    let dist = 0;
    sigs.forEach(d => dist += Math.abs((userVec[d]||2) - u.coordinates[d]));
    return { name: u.name, dist: sigs.length > 0 ? dist / sigs.length : 999 };
  }).sort((a,b) => a.dist - b.dist);
  
  console.log(`全选${choice} → ${dists[0].name}(${dists[0].dist.toFixed(3)})  [${dists.map(d=>d.name.substring(0,2)+'='+d.dist.toFixed(2)).join(', ')}]`);
});
