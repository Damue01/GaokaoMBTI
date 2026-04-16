<div align="center">

# 2026年普通高等学校招生全国统一考试 · 命理综合

**一场改变命运的考试，一份来自平行宇宙的录取通知书。**

[![在线体验](https://img.shields.io/badge/%E5%9C%A8%E7%BA%BF%E4%BD%93%E9%AA%8C-www.gaokaombti.com-b8342b?style=for-the-badge)](https://www.gaokaombti.com)

[![Vue 3](https://img.shields.io/badge/Vue-3-4FC08D?logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Pinia](https://img.shields.io/badge/Pinia-Store-ffd859?logo=pinia&logoColor=333)](https://pinia.vuejs.org/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000?logo=vercel)](https://www.gaokaombti.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

</div>

---

> 20 道高考风格选择题 → 15 维人格向量匹配 → 被一所离谱大学录取 → 生成仿真录取通知书 → 分享朋友圈

---

## ✨ 亮点

<table>
<tr>
<td width="50%">

### 📝 沉浸式试卷体验
- 1:1 还原高考试卷排版（密封线、考生信息栏、页脚）
- 手写体 ✗ 标记动效，答题括号内涂改痕迹
- 底部答题卡气泡实时反馈

</td>
<td width="50%">

### 🎓 仿真录取通知书
- 信封拆封动画 → 通知书展开
- 含印章、水印、雷达图、社交标签
- 一键生成分享海报（html2canvas + QR Code）

</td>
</tr>
<tr>
<td>

### 🧠 硬核评分引擎
- 15 维人格模型（自我认知 / 情绪应激 / 权威态度 / 行动模式 / 社交策略）
- Manhattan 距离匹配 5 所虚构大学
- 门控彩蛋 + 空闲超时 Fallback

</td>
<td>

### 📱 移动优先
- 纯 CSS 手搓，零 UI 框架依赖
- 适配手机竖屏阅读体验
- localStorage 断点续答

</td>
</tr>
</table>

## 🏫 录取院校一览

| | 大学 | 系别 | 触发条件 |
|:---:|------|------|:---:|
| 🕊️ | **鸽伦比亚大学** | 物理失联与薛定谔成绩管理系 | 常规匹配 |
| 📖 | **京华大学** | 末名书院 | 常规匹配 |
| 🐒 | **吗喽理工大学** | 亚太区高压灵长类行为学 | 常规匹配 |
| 🪷 | **斯坦佛大学** | 电子木鱼声学与就地圆寂系 | 常规匹配 |
| 🌊 | **加州大学波及你分校** | 考场应激创伤与拉人下水工程系 | 常规匹配 |
| 🐛 | **地球Online·BUG修复局** | 系统异常收容与玩家行为矫正处 | 🥚 门控彩蛋 |
| 🦫 | **亚太区水豚行为模式研究所** | 哺乳动物情绪平原化分析室 | 🥚 门控彩蛋 |
| 👻 | **格式化游魂收容所** | 大脑皮层重启与记忆考古系 | 💤 3min 空闲 |

## 🚀 快速开始

```bash
git clone https://github.com/Damue01/GaokaoMBTI.git
cd GaokaoMBTI

npm install
npm run dev          # 开发 → http://localhost:5173
npm run build        # 构建生产版本
```

## 🧬 评分机制

### 15 维人格模型

```
S  自我认知    S1 估分自尊度 ─ S2 知识图谱掌控 ─ S3 考试哲学导向
E  情绪应激    E1 铃声应激反应 ─ E2 错题依恋机制 ─ E3 备考社交依恋
A  权威态度    A1 考纲防御机制 ─ A2 答题强迫秩序 ─ A3 监考权力认知
Ac 行动模式    Ac1 压轴题执念 ─ Ac2 改错果断度 ─ Ac3 草稿纸推演
So 社交策略    So1 对答案主动性 ─ So2 分数边界感 ─ So3 学霸伪装术
```

### 匹配流程

```
答题完成 → 提取 15 维平均分向量
        → 与 5 所大学坐标计算 Manhattan 距离
        → 距离最短 = 你的命中注定
```

### 门控彩蛋

| 彩蛋 | 触发点 | 条件 | 结果 |
|:---:|:---:|------|------|
| G1 | 第 12 题后 | E1 维度累计 ≥ 12 | → 地球Online·BUG修复局 |
| G2 | 第 14 题后 | So3 维度累计 ≥ 10 | → 亚太区水豚行为模式研究所 |

## 🗂️ 项目结构

```
src/
├── views/
│   ├── ExamView.vue          # 试卷首页 + 答题
│   └── ResultView.vue        # 信封动画 + 录取通知书
├── components/
│   ├── QuestionCard.vue      # 题目卡片（手写体动效）
│   ├── AnswerCard.vue        # 底部答题卡
│   ├── ResultNotice.vue      # 录取通知书
│   ├── SharePoster.vue       # 分享海报
│   ├── RadarChart.vue        # 雷达图
│   ├── SealStamp.vue         # 印章
│   └── ...
├── composables/
│   └── useScoring.js         # 评分引擎
├── stores/
│   └── exam.js               # 状态管理 + 持久化
└── styles/                   # 纯 CSS 样式系统
```

## 📄 License

[MIT](LICENSE)

---

<div align="center">
<sub>如果觉得有趣，欢迎 ⭐ Star 支持一下</sub>
</div>
