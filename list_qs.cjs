const fs = require('fs');
const q = JSON.parse(fs.readFileSync('public/questions.json', 'utf8'));
const targets = [5, 8, 11, 16, 17, 20];
q.questions.forEach(item => {
  if (targets.includes(item.id)) {
    console.log('\n==============================');
    console.log('Q' + item.id + ': ' + item.stem);
    item.options.forEach((o, i) => console.log(' [' + i + '] ' + o.text));
  }
});
