<div align="center">

# ★ 绝密 ★ 启用前

## 2026年普通高等学校招生全国统一考试

### 人 格 综 合

本试卷共 20 题，共 100 分。考试时长 30 分钟。

---

**一场改变命运的考试，一份来自平行宇宙的录取通知书。**

<br>

[![开始答题](https://img.shields.io/badge/%E5%BC%80%E5%A7%8B%E7%AD%94%E9%A2%98-www.gaokaombti.com-b8342b?style=for-the-badge)](https://www.gaokaombti.com)

<br>

[![Vue 3](https://img.shields.io/badge/Vue-3-4FC08D?style=flat-square&logo=vuedotjs&logoColor=white)](https://vuejs.org/)
&ensp;
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
&ensp;
[![Pinia](https://img.shields.io/badge/Pinia-Store-ffd859?style=flat-square&logo=pinia&logoColor=333)](https://pinia.vuejs.org/)
&ensp;
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000?style=flat-square&logo=vercel)](https://www.gaokaombti.com)
&ensp;
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

</div>

---

### 注意事项：

> **1.** 答卷前，考生务必将本仓库 `git clone` 至本地工作区，用 2B 铅笔将 `npm install` 填涂在终端相应位置上。
>
> **2.** 作答选择题时，选出每小题答案后，系统将在答题卡上对应题目选项的答案信息点涂黑；如需改动，点击其他选项即可覆盖，答案不能答在 `console` 上。
>
> **3.** 考试结束后，系统将自动生成《录取通知书》，含印章、水印、雷达图与分享海报，请考生注意保存。
>
> **4.** 考生必须保持网络连接。不按以上要求作答无效。

---

## 一、考场应激反应（功能概览）

**1.** 沉浸式试卷体验——1:1 还原高考试卷排版，含密封线、考生信息栏、分节标题与页脚。（ &ensp;）

**2.** 手写体答题动效——选中选项后以 ✗ 标记呈现，括号内涂改痕迹还原真实考场感。（ &ensp;）

**3.** 底部答题卡——实时反馈答题进度，气泡高亮已作答题目。（ &ensp;）

**4.** 录取通知书——信封拆封动画 → 通知书展开，含印章、水印、雷达图、社交标签。（ &ensp;）

**5.** 分享海报生成——使用 html2canvas 将通知书渲染为图片，附带二维码，一键保存。（ &ensp;）

**6.** 移动优先——纯 CSS 手搓，零 UI 框架依赖，适配手机竖屏阅读，localStorage 断点续答。（ &ensp;）

---

## 二、社交生态博弈（录取院校一览）

| 序号 | 录取院校 | 院系 | 录取批次 |
|:---:|------|------|:---:|
| 1 | **京华大学** | 末名书院 | 常规批 |
| 2 | **麻了理工大学** | 还没麻系 | 常规批 |
| 3 | **中央戏精学院** | 加戏系 | 常规批 |
| 4 | **斯坦佛大学** | 佛系 | 常规批 |
| ★ | **地球Online·BUG修复局** | ▓█BU▒G处░██▒▓ | 🥚 提前批 |
| ★ | **亚太水豚研究所** | 合法发呆事业编管理处 | 🥚 提前批 |
| ✦ | **空白档案收容所** | 失忆急诊科 | 💤 补录批 |

---

## 三、存亡哲学终局（评分机制）

### 第 1 小题：4 维人格模型（15 分）

```
  ┌──────────┬──────────────────────────────────┐
  │  C 松弛感  │  越高越不把考试当回事              │
  │  P 务实度  │  越高越看重"该拿的那一分"          │
  │  D 表演欲  │  越高越把每件小事当成自己的剧场      │
  │  So 社交敏感│  越高越在意他人的节奏、眼光与反应    │
  └──────────┴──────────────────────────────────┘
```

### 第 2 小题：Manhattan 距离匹配（10 分）

```
  答题完成 ──→ 提取 4 维平均分向量 (0~4 分)
           ──→ 与 4 所大学坐标计算签名距离
           ──→ 距离最短 = 你的命中注定
```

### 第 3 小题：隐藏结局机制（附加分）

| 代号 | 触发方式 | 触发条件 | 录取去向 |
|:---:|:---:|------|------|
| BUG | 5% 抽签 + Q15 后插入 | 选中"别动"选项 | → 地球Online·BUG修复局 |
| 水豚 | 行为检测 | 平均 ≤3s/题 + 零改选 + ≥15 题 | → 亚太水豚研究所 |
| — | 空闲 3 分钟 | 未作答 | → 空白档案收容所 |

---

## 考生须知（快速开始）

```bash
# 领取试卷
git clone https://github.com/Damue01/GaokaoMBTI.git
cd GaokaoMBTI

# 检查文具
npm install

# 开考铃响
npm run dev

# 装订密封（构建生产版本）
npm run build
```

---

## 试卷结构（项目目录）

```
src/
├── views/
│   ├── ExamView.vue ·············· 试卷首页 + 答题区
│   └── ResultView.vue ············ 信封拆封 + 录取通知书
├── components/
│   ├── ExamHeader.vue ············ 试卷抬头（考生信息 · 密封线）
│   ├── QuestionCard.vue ·········· 题目卡片（手写体 ✗ 动效）
│   ├── AnswerCard.vue ············ 底部答题卡气泡
│   ├── ResultNotice.vue ·········· 录取通知书正文
│   ├── SharePoster.vue ··········· 分享海报（html2canvas）
│   ├── RadarChart.vue ············ 4 维雷达图
│   ├── SealStamp.vue ············· 录取印章
│   └── SealLine.vue ·············· 密封线
├── composables/
│   └── useScoring.js ············· 评分引擎（向量匹配 + 门控）
├── stores/
│   └── exam.js ··················· 状态管理 + localStorage 持久化
├── styles/ ······················· 纯 CSS 样式系统
│   ├── base.css ·· paper.css ·· question.css ·· answer-card.css
│   ├── result.css · poster.css · motion.css
public/
├── questions.json ················ 题库（20 常规 + 1 门控）
└── results.json ·················· 大学坐标 + 隐藏结局 + fallback
```

---

## 技术栈

| 科目 | 使用教材 |
|:---:|------|
| 框架 | Vue 3 (Composition API) |
| 状态管理 | Pinia |
| 构建工具 | Vite 5 |
| 海报渲染 | html2canvas |
| 二维码 | qrcode |
| 样式方案 | 纯 CSS（零 UI 框架） |
| 部署 | Vercel |

---

<div align="center">

```
人格综合    第 1 页（共 1 页）
```

[MIT License](LICENSE)

如果觉得有趣，欢迎 ⭐ Star · 转发朋友圈 · 考完记得交卷

</div>
