const fs = require('fs');

// === 1. Fix questions.json: Flip S2 dimension values (v → 5-v) ===
const qPath = 'public/questions.json';
const q = JSON.parse(fs.readFileSync(qPath, 'utf8'));

const s2Questions = [1, 7, 18]; // Questions that contain S2 dimension

q.questions.forEach(qs => {
  if (!s2Questions.includes(qs.id)) return;
  qs.options.forEach(opt => {
    if (opt.dimension_map && opt.dimension_map.S2 !== undefined) {
      const oldVal = opt.dimension_map.S2;
      opt.dimension_map.S2 = 5 - oldVal;
      console.log(`Q${qs.id} ${opt.label}: S2 ${oldVal} → ${opt.dimension_map.S2}`);
    }
  });
});

fs.writeFileSync(qPath, JSON.stringify(q, null, 2), 'utf8');
console.log('\n✓ questions.json S2 values flipped');

// === 2. Fix results.json: Change 京华 E3=1 → E3=2(default), A3=2 → A3=1 ===
const rPath = 'public/results.json';
const r = JSON.parse(fs.readFileSync(rPath, 'utf8'));

const jinghua = r.universities.find(u => u.name === '京华大学');
console.log(`\n京华 before: E3=${jinghua.coordinates.E3}, A3=${jinghua.coordinates.A3}`);
jinghua.coordinates.E3 = 2; // reset to default
jinghua.coordinates.A3 = 1; // new signature dimension
console.log(`京华 after:  E3=${jinghua.coordinates.E3}, A3=${jinghua.coordinates.A3}`);

fs.writeFileSync(rPath, JSON.stringify(r, null, 2), 'utf8');
console.log('✓ results.json 京华 coordinates updated');

// === 3. Verify ===
const ALL = ['S1','S2','S3','E1','E2','E3','A1','A2','A3','Ac1','Ac2','Ac3','So1','So2','So3'];

console.log('\n=== 验证：全选A匹配结果 ===');
const dimScores = {}; ALL.forEach(d => dimScores[d] = []);
q.questions.forEach(qs => {
  const opt = qs.options.find(o => o.label === 'A');
  if (opt && opt.dimension_map) {
    for (const [dim, val] of Object.entries(opt.dimension_map)) {
      if (dimScores[dim]) dimScores[dim].push(val);
    }
  }
});
const userVec = {};
ALL.forEach(d => {
  userVec[d] = dimScores[d].length > 0 ? dimScores[d].reduce((a,b)=>a+b,0)/dimScores[d].length : 2;
});

r.universities.forEach(u => {
  const sigs = ALL.filter(d => u.coordinates[d] !== 2);
  let dist = 0;
  sigs.forEach(d => dist += Math.abs((userVec[d]||2) - u.coordinates[d]));
  const norm = sigs.length > 0 ? dist / sigs.length : 999;
  console.log(`  ${u.name}: dist=${norm.toFixed(3)} [${sigs.map(d=>d+'='+u.coordinates[d]+' user='+userVec[d].toFixed(2)).join(', ')}]`);
});

// === 4. Monte Carlo 200K ===
console.log('\n=== Monte Carlo 200K 分布 ===');
const N = 200000;
const counts = {};
r.universities.forEach(u => counts[u.name] = 0);

for (let i = 0; i < N; i++) {
  const ds = {}; ALL.forEach(d => ds[d] = []);
  q.questions.forEach(qs => {
    const opt = qs.options[Math.floor(Math.random() * 4)];
    if (opt && opt.dimension_map) {
      for (const [dim, val] of Object.entries(opt.dimension_map)) {
        if (ds[dim]) ds[dim].push(val);
      }
    }
  });
  const vec = {};
  ALL.forEach(d => vec[d] = ds[d].length > 0 ? ds[d].reduce((a,b)=>a+b,0)/ds[d].length : 2);
  
  let best = null, bestDist = Infinity;
  r.universities.forEach(u => {
    const sigs = ALL.filter(d => u.coordinates[d] !== 2);
    let dist = 0;
    sigs.forEach(d => dist += Math.abs((vec[d]||2) - u.coordinates[d]));
    const norm = sigs.length > 0 ? dist / sigs.length : 999;
    if (norm < bestDist) { bestDist = norm; best = u.name; }
  });
  counts[best]++;
}

const ideal = N / 5;
const pcts = [];
for (const [name, count] of Object.entries(counts)) {
  const pct = (count / N * 100).toFixed(2);
  pcts.push(pct);
  console.log(`  ${name}: ${count} (${pct}%)`);
}
const stddev = Math.sqrt(pcts.reduce((s, p) => s + (p - 20) ** 2, 0) / pcts.length);
console.log(`  stddev: ${stddev.toFixed(2)}%`);

// === 5. 全选ABCD测试 ===
console.log('\n=== 全选ABCD测试 ===');
['A','B','C','D'].forEach(choice => {
  const ds2 = {}; ALL.forEach(d => ds2[d] = []);
  q.questions.forEach(qs => {
    const opt = qs.options.find(o => o.label === choice);
    if (opt && opt.dimension_map) {
      for (const [dim, val] of Object.entries(opt.dimension_map)) {
        if (ds2[dim]) ds2[dim].push(val);
      }
    }
  });
  const vec2 = {};
  ALL.forEach(d => vec2[d] = ds2[d].length > 0 ? ds2[d].reduce((a,b)=>a+b,0)/ds2[d].length : 2);
  
  let best = null, bestDist = Infinity;
  r.universities.forEach(u => {
    const sigs = ALL.filter(d => u.coordinates[d] !== 2);
    let dist = 0;
    sigs.forEach(d => dist += Math.abs((vec2[d]||2) - u.coordinates[d]));
    const norm = sigs.length > 0 ? dist / sigs.length : 999;
    if (norm < bestDist) { bestDist = norm; best = u.name; }
  });
  console.log(`  全选${choice} → ${best} (dist=${bestDist.toFixed(3)})`);
});

// === 6. 签名维度拓扑 ===
console.log('\n=== 签名维度拓扑 ===');
r.universities.forEach(u => {
  const sigs = ALL.filter(d => u.coordinates[d] !== 2);
  console.log(`  ${u.name}: ${sigs.map(d=>d+'='+u.coordinates[d]).join(', ')}`);
});
