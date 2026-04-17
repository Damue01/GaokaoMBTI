import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\//, '')),
  '..');
const questionsPath = path.join(rootDir, 'public', 'questions.json');
const outputDir = path.join(rootDir, 'tmp');

const labelChoices = [
  { key: '1', id: 'jinghua', name: '京华大学' },
  { key: '2', id: 'gelunbiya', name: '鸽伦比亚大学' },
  { key: '3', id: 'malou', name: '吗喽理工大学' },
  { key: '4', id: 'sitanfo', name: '斯坦佛大学' },
  { key: '5', id: 'jiazhou', name: '加州大学波及你分校' },
  { key: '6', id: 'solo_anxiety', name: '焦虑，但没有波及其他人' },
  { key: '7', id: 'drama', name: '戏精' },
  { key: '8', id: 'custom', name: '自定义输入' },
];

function ensureOutputDir() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
}

function loadQuestions() {
  return JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
}

function buildOutputPath() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  const fileName = `option-labels-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.json`;
  return path.join(outputDir, fileName);
}

function printChoices() {
  output.write('\n可选标签：\n');
  for (const choice of labelChoices) {
    output.write(`  ${choice.key}. ${choice.name}\n`);
  }
  output.write('  s. 跳过当前项\n');
  output.write('  q. 保存并退出\n\n');
}

async function askForLabel(rl, question, option, index, total) {
  while (true) {
    output.write('\n==================================================\n');
    output.write(`进度 ${index}/${total}\n`);
    output.write(`Q${question.id}. ${question.stem}\n`);
    output.write(`选项 ${option.label}: ${option.text}\n`);
    printChoices();

    const answer = (await rl.question('请输入编号: ')).trim();

    if (answer.toLowerCase() === 'q') {
      return { quit: true };
    }

    if (answer.toLowerCase() === 's') {
      return {
        quit: false,
        record: {
          selectedId: 'skipped',
          selectedName: '跳过',
          customText: '',
        },
      };
    }

    const matched = labelChoices.find((item) => item.key === answer);
    if (!matched) {
      output.write('输入无效，请重新输入。\n');
      continue;
    }

    let customText = '';
    if (matched.id === 'custom') {
      customText = (await rl.question('请输入你的自定义标签: ')).trim();
      if (!customText) {
        output.write('自定义标签不能为空，请重新选择。\n');
        continue;
      }
    }

    return {
      quit: false,
      record: {
        selectedId: matched.id,
        selectedName: matched.name,
        customText,
      },
    };
  }
}

async function main() {
  ensureOutputDir();
  const data = loadQuestions();
  const questions = data.questions || [];
  const total = questions.reduce((sum, question) => sum + question.options.length, 0);
  const outputPath = buildOutputPath();

  const result = {
    generatedAt: new Date().toISOString(),
    sourceFile: path.relative(rootDir, questionsPath).replace(/\\/g, '/'),
    totalQuestions: questions.length,
    totalOptions: total,
    choices: labelChoices.map(({ key, id, name }) => ({ key, id, name })),
    records: [],
  };

  const rl = readline.createInterface({ input, output });

  try {
    let index = 0;
    for (const question of questions) {
      for (const option of question.options) {
        index += 1;
        const response = await askForLabel(rl, question, option, index, total);
        if (response.quit) {
          fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
          output.write(`\n已保存当前进度到: ${outputPath}\n`);
          return;
        }

        result.records.push({
          questionId: question.id,
          section: question.section,
          stem: question.stem,
          optionLabel: option.label,
          optionText: option.text,
          dimensionMap: option.dimension_map,
          ...response.record,
        });
      }
    }

    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
    output.write(`\n全部记录完成，结果已保存到: ${outputPath}\n`);
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error('脚本执行失败:', error);
  process.exitCode = 1;
});