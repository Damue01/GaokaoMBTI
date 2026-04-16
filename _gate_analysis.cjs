const q = require('./public/questions.json');

// E1 维度的题目和选项值
console.log('=== E1 维度覆盖 (G1触发条件: Q12答完后 E1累计 >= 12) ===');
q.questions.filter(qu => qu.id <= 12).forEach(qu => {
  const e1Opts = qu.options.filter(o => o.dimension_map && o.dimension_map.E1 !== undefined);
  if (e1Opts.length > 0) {
    console.log('Q' + qu.id + ': ' + e1Opts.map(o => o.label + '=' + o.dimension_map.E1).join(', '));
  }
});

// So3 维度的题目和选项值
console.log('\n=== So3 维度覆盖 (G2触发条件: Q14答完后 So3累计 >= 10) ===');
q.questions.filter(qu => qu.id <= 14).forEach(qu => {
  const so3Opts = qu.options.filter(o => o.dimension_map && o.dimension_map.So3 !== undefined);
  if (so3Opts.length > 0) {
    console.log('Q' + qu.id + ': ' + so3Opts.map(o => o.label + '=' + o.dimension_map.So3).join(', '));
  }
});

// 暴力枚举所有选项组合
function enumCombos(qs, dim) {
  if (qs.length === 0) return [0];
  const first = qs[0], rest = qs.slice(1);
  const subResults = enumCombos(rest, dim);
  const results = [];
  first.options.forEach(o => {
    const val = (o.dimension_map && o.dimension_map[dim]) || 0;
    subResults.forEach(sub => results.push(val + sub));
  });
  return results;
}

console.log('\n=== G1触发概率 (E1 Q1-12 累计 >= 12) ===');
const e1Qs = q.questions.filter(qu => qu.id <= 12 && qu.options.some(o => o.dimension_map && o.dimension_map.E1 !== undefined));
console.log('E1相关题(前12题): Q' + e1Qs.map(qu => qu.id).join(', Q'));
const e1Totals = enumCombos(e1Qs, 'E1');
const e1Above12 = e1Totals.filter(t => t >= 12).length;
const g1Prob = (e1Above12 / e1Totals.length * 100);
console.log('总组合: ' + e1Totals.length + ', E1>=12的: ' + e1Above12 + ', G1出现概率: ' + g1Prob.toFixed(2) + '%');

console.log('\n=== G2触发概率 (So3 Q1-14 累计 >= 10) ===');
const so3Qs = q.questions.filter(qu => qu.id <= 14 && qu.options.some(o => o.dimension_map && o.dimension_map.So3 !== undefined));
console.log('So3相关题(前14题): Q' + so3Qs.map(qu => qu.id).join(', Q'));
const so3Totals = enumCombos(so3Qs, 'So3');
const so3Above10 = so3Totals.filter(t => t >= 10).length;
const g2Prob = (so3Above10 / so3Totals.length * 100);
console.log('总组合: ' + so3Totals.length + ', So3>=10的: ' + so3Above10 + ', G2出现概率: ' + g2Prob.toFixed(2) + '%');

console.log('\n=== 最终隐藏结局概率 ===');
console.log('BUG修复局 = G1出现(' + g1Prob.toFixed(1) + '%) × 选D(25%) = ' + (g1Prob * 0.25).toFixed(2) + '%');
console.log('水豚研究所 = G2出现(' + g2Prob.toFixed(1) + '%) × 选D(25%) = ' + (g2Prob * 0.25).toFixed(2) + '%');

// E1 分布直方图
console.log('\n=== E1 累计值分布 ===');
const e1Hist = {};
e1Totals.forEach(t => { e1Hist[t] = (e1Hist[t] || 0) + 1; });
Object.keys(e1Hist).sort((a,b) => a-b).forEach(k => {
  const pct = (e1Hist[k] / e1Totals.length * 100).toFixed(1);
  console.log('  E1=' + k + ': ' + pct + '% ' + '█'.repeat(Math.round(pct)));
});

// So3 分布直方图
console.log('\n=== So3 累计值分布 ===');
const so3Hist = {};
so3Totals.forEach(t => { so3Hist[t] = (so3Hist[t] || 0) + 1; });
Object.keys(so3Hist).sort((a,b) => a-b).forEach(k => {
  const pct = (so3Hist[k] / so3Totals.length * 100).toFixed(1);
  console.log('  So3=' + k + ': ' + pct + '% ' + '█'.repeat(Math.round(pct)));
});
