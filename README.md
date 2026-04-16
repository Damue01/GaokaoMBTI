# 🎓 2026 高考命理综合测试

一款以高考试卷为视觉外壳的趣味性格测试 Web 应用。用户通过回答 20 道模拟高考风格的选择题，系统基于 15 维人格向量匹配算法，将用户"录取"到一所虚构的搞笑大学，并生成高仿录取通知书。

## 在线体验

[www.gaokaombti.com](https://www.gaokaombti.com)

## 项目截图

<table>
  <tr>
    <td><strong>试卷首页</strong></td>
    <td><strong>答题页面</strong></td>
    <td><strong>录取通知书</strong></td>
  </tr>
  <tr>
    <td>高仿高考试卷排版，<br>含考生信息与注意事项</td>
    <td>手写体选项标记，<br>括号内涂改痕迹动效</td>
    <td>完整录取通知书，<br>含印章、水印、分享海报</td>
  </tr>
</table>

## 核心玩法

- **20 道高考风格选择题**：覆盖考场应激、社交博弈、存亡哲学三大板块
- **15 维人格评估**：每个选项映射到 S（自我认知）/ E（情绪应激）/ A（权威态度）/ Ac（行动模式）/ So（社交策略）五大类 15 个子维度
- **Manhattan 距离匹配**：将用户答题向量与 5 所虚构大学的特征坐标比对，匹配最近的一所
- **门控彩蛋机制**：特定维度累计值超过阈值时，动态插入隐藏附加题，可触发 2 个彩蛋结果
- **空闲 Fallback**：3 分钟无操作自动触发"格式化游魂收容所"特殊结局
- **分享海报生成**：使用 html2canvas 将录取通知书渲染为图片，附带二维码

## 技术栈

| 层面 | 技术 |
|------|------|
| 框架 | Vue 3 (Composition API) |
| 状态管理 | Pinia |
| 构建工具 | Vite 5 |
| 海报生成 | html2canvas |
| 二维码 | qrcode |
| 样式 | 纯 CSS（无 UI 框架） |

## 项目结构

```
web/
├── public/
│   ├── questions.json          # 题库（20 道常规题 + 2 道门控题）
│   ├── results.json            # 大学结果 & 门控彩蛋 & fallback 配置
│   └── svg/                    # SVG 资源
├── src/
│   ├── App.vue                 # 根组件，按 view 状态切换页面
│   ├── main.js                 # 入口
│   ├── views/
│   │   ├── StartView → ExamView.vue  # 试卷首页 + 答题页（合并）
│   │   └── ResultView.vue            # 录取通知书结果页
│   ├── components/
│   │   ├── ExamHeader.vue      # 试卷头部（考生信息）
│   │   ├── QuestionCard.vue    # 题目卡片（含手写体 SVG 动效）
│   │   ├── AnswerCard.vue      # 底部答题卡气泡
│   │   ├── PageFooter.vue      # 页脚
│   │   ├── SealStamp.vue       # 录取通知书印章
│   │   ├── SealLine.vue        # 密封线
│   │   ├── RadarChart.vue      # 雷达图
│   │   ├── ResultNotice.vue    # 录取通知书内容
│   │   └── SharePoster.vue     # 分享海报
│   ├── composables/
│   │   └── useScoring.js       # 评分引擎（向量提取 + Manhattan 匹配 + 门控检查）
│   ├── stores/
│   │   └── exam.js             # Pinia store（状态管理 + localStorage 持久化）
│   └── styles/                 # 样式文件
│       ├── base.css            # 基础样式 & CSS 变量
│       ├── paper.css           # 试卷纸张风格
│       ├── question.css        # 题目样式
│       ├── answer-card.css     # 答题卡
│       ├── result.css          # 结果页
│       ├── poster.css          # 分享海报
│       └── motion.css          # 动画
└── vite.config.js
```

## 快速开始

```bash
# 安装依赖
cd web
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 评分机制说明

### 15 维人格模型

| 大类 | 维度 | 含义 |
|------|------|------|
| **S** 自我认知 | S1 / S2 / S3 | 估分自尊度 / 知识图谱掌控 / 考试哲学导向 |
| **E** 情绪应激 | E1 / E2 / E3 | 铃声应激反应 / 错题依恋机制 / 备考社交依恋 |
| **A** 权威态度 | A1 / A2 / A3 | 考纲防御机制 / 答题强迫秩序 / 监考权力认知 |
| **Ac** 行动模式 | Ac1 / Ac2 / Ac3 | 压轴题执念 / 改错果断度 / 草稿纸推演 |
| **So** 社交策略 | So1 / So2 / So3 | 对答案主动性 / 分数边界感 / 学霸伪装术 |

### 匹配算法

1. 用户完成答题后，提取每个维度的平均分（1-4 分），构成 15 维向量
2. 计算用户向量与每所大学坐标的 Manhattan 距离
3. 距离最短的大学即为匹配结果

### 门控彩蛋

- **G1**（第 12 题后触发）：当 E1 维度累计 ≥ 12 时，插入附加题，可通往「地球Online·BUG修复局」
- **G2**（第 14 题后触发）：当 So3 维度累计 ≥ 10 时，插入附加题，可通往「亚太区水豚行为模式研究所」

## 可用结果

| 大学 | 系别 |
|------|------|
| 鸽伦比亚大学 | 物理失联与薛定谔成绩管理系 |
| 京华大学 | 末名书院 |
| 吗喽理工大学 | 亚太区高压灵长类行为学 |
| 斯坦佛大学 | 电子木鱼声学与就地圆寂系 |
| 加州大学波及你分校 | 考场应激创伤与拉人下水工程系 |
| 🥚 地球Online·BUG修复局 | 系统异常收容与玩家行为矫正处 |
| 🥚 亚太区水豚行为模式研究所 | 哺乳动物情绪平原化分析室 |
| 💤 格式化游魂收容所 | 大脑皮层重启与记忆考古系 |

## License

MIT
