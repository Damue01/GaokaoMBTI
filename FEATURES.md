# 人格综合（全国 B 卷）—— 功能规范文档

一份仿高考试卷风格的人格测试网页应用。用户答完一张 20 题的"模拟考卷"，会拿到一封"录取通知书"式的结果页。

---

## 1. 项目结构与技术栈

- **框架**：Vue 3（Composition API）+ Pinia + Vite
- **主目录**：`web/`
- **核心数据**：
  - `web/public/questions.json` —— 20 道普通题 + 门控题（隐藏题）
  - `web/public/results.json` —— 4 所主大学 + 3 个隐藏结局
- **核心代码**：
  - `web/src/stores/exam.js` —— Pinia 状态机（考试流程、答题、门控触发、持久化）
  - `web/src/composables/useScoring.js` —— 评分引擎
  - `web/src/composables/useSound.js` —— 音效加载与播放（铅笔声）
  - `web/src/views/ExamView.vue` / `ResultView.vue` —— 两阶段视图（ExamView 内部通过 `store.view === 'start' | 'exam'` 切换 “开始答题” 和 “题目列表”）
  - `web/src/components/QuestionCard.vue` —— 题目卡片（普通题 + 门控题 + BUG 题三态）

---

## 2. 评分体系

### 2.1 四个维度

| 符号 | 名称 | 含义 |
|---|---|---|
| C | 松弛感 | 越高越不把考试当回事 |
| P | 务实度 | 越高越看重"该拿的那一分" |
| D | 表演欲 | 越高越把每件小事当成自己的剧场 |
| So | 社交敏感 | 越高越在意他人的节奏、眼光与反应 |

每个选项的 `dimension_map` 在 0–4 分区间打分（默认值 2 表示"未测到"），每道题测 1–2 个维度。

### 2.2 四所主大学坐标

| 大学 | C | P | D | So | 人设 |
|---|---|---|---|---|---|
| 京华大学（KHU）| 3 | 4 | 1 | 2 | 务实稳拿分、没有奇迹但总能到终点 |
| 麻了理工大学（NIT）| 1 | 3 | 2 | 4 | 把考试看得最重的那一个、焦虑到极致 |
| 中央戏精学院（NADO）| 2 | 1 | 4 | 3 | 把日常过得像史诗、自带 BGM |
| 斯坦佛大学（Stanfo）| 4 | 1 | 2 | 1 | 饿了就吃困了就睡、佛系到根上 |

四个坐标彼此按 Manhattan 距离等距分布，形成对称四面体。

### 2.3 匹配算法

位置：`web/src/composables/useScoring.js`。

1. **用户向量 `extractUserVector`**：对每个维度，**取所有测到该维度的选项得分的平均值**。未测到的维度回退到默认值 2。
2. **签名距离 `signatureDistance`**：Manhattan 距离，但**只对大学坐标 ≠ 2 的维度求距离**，再除以参与维度数（归一化）。当前 4 所大学所有维度都 ≠ 2，因此等价于 `Manhattan / 4`。
3. **匹配最近大学 `matchUniversity`**：对 4 所大学求签名距离，取最小者。

### 2.4 纯型用户的预期结果（已验证）

| 全选某个原始选项 | 匹配结果 | 距离 |
|---|---|---|
| 全选 A | 京华 | 0.00 |
| 全选 B | 麻了 | 0.07 |
| 全选 C | 戏精 | 0.03 |
| 全选 D | 斯坦佛 | 0.07 |

所有非目标大学距离都远高于 1.3，区分度清晰。

---

## 3. 题目结构

### 3.1 普通题（`questions.questions`）

20 道题分 3 节（见 `questions.sections`）：

- **一、考场应激反应**（Q1–Q8，40 分）
- **二、社交生态博弈**（Q9–Q14，30 分）
- **三、存亡哲学终局**（Q15–Q20，30 分）

每题字段：
```json
{
  "id": 1,
  "section": 1,
  "points": 5,
  "dimensions": ["C", "P"],
  "stem": "题目正文……",
  "options": [
    { "label": "A", "text": "……", "dimension_map": { "C": 3, "P": 4 } },
    ...
  ]
}
```

### 3.2 门控题（`questions.gate_questions`）

目前**只有 1 道**，即 `G1`（BUG 隐藏题），详见第 6 节。

---

## 4. 准考证号

- 格式：`YY(26) + AAAA(4位考区) + SS(99) + CCC(3位考场) + NN(2位座位)`，共 13 位。
- 生成时机：
  - 首次进入应用（`defineStore` 初始化时随机生成一个默认值）
  - `startExam()` 未重新生成——它在页面加载时已经生成
  - `restart()` 时重新生成
- **后 4 位（考场末 2 位 + 座位 2 位）** 被用作 BUG 题题干里的 `{SEAT4}` 占位符。

### 考卷字母

`examLetter` 在 `['M','B','T','I']` 里随机取一个，显示在考卷标题 "全国 X 卷"。纯粹视觉装饰。

---

## 5. 选项乱序机制

### 5.1 目标
每次进入考试时，每道题的 4 个选项显示顺序都不同。选项乱序**只影响显示顺序**——原始数据中 A 选项始终对应京华人设的内容，但在页面上可能显示在 B、C、D 任意位置。目的是防止用户背题（记住"第 3 题选 B"之类的攻略），让每次测试都需要真正阅读选项内容。

### 5.2 实现

位置：`web/src/stores/exam.js` 的 `optionOrderMap` + `regenerateOptionOrder()` + `getQuestionObj()` + `resolveOriginalLabel()` + `toDisplayLabel()`。

- **数据结构**：`optionOrderMap` 是一个 map，键为 `n-<id>`（普通题）或 `g-<id>`（门控题），值为打乱后的原始 label 数组，例如 `['C', 'A', 'D', 'B']`。数组第 i 位表示"新位置 i（显示为 A/B/C/D 的第 i 个）对应的原始 label"。
- **生成时机**：
  - 首次 init（无存档）→ 生成乱序
  - `restart()` → 重新洗牌
  - 老存档（无 `optionOrderMap`）→ 现场补生成
- **持久化**：随同答题进度一起存 localStorage，刷新后保持相同顺序。
- **渲染**：`getQuestionObj()` 返回题目时，把原始 options 按 `optionOrderMap` 重新排序，并把 label 重写为 A/B/C/D（新顺序），同时在 option 对象上保留 `_origLabel` 字段留作调试。
- **答案存储**：用户点击时传回来的是显示 label（A/B/C/D）。`answerQuestion()` 通过 `resolveOriginalLabel()` 转回原始 label 再存入 `answers`。评分代码（`useScoring.js`）无需改动——它拿到的一直是原始 label。
- **显示选中态**：ExamView 从 `answers` 取原始 label，通过 `toDisplayLabel()` 转成当前显示的字母传给 QuestionCard 做高亮。

### 5.3 Fisher–Yates 洗牌
标准实现。不需要担心分布偏差。

---

## 6. BUG 隐藏题 / 地球Online·BUG修复局

### 6.1 触发链路（两步制）

```
                 5% 抽签（开考时）
StartView → startExam() ────────────► bugLotteryWon = true
                                              │
                                              ▼
                                 Q15 答完 → 插入 G1 到题序
                                              │
                                              ▼
              用户看到 BUG 题 → 选中"别动"那一项 → BUG 结局
              用户看到 BUG 题 → 选其他项或不选 → 回到正常评分
```

> 当前代码里的抽签概率是 `< 0.05`（5%）。

### 6.2 抽签

位置：`exam.js` 的 `startExam()`。

```js
bugLotteryWon.value = Math.random() < 0.05
```

- 只在用户点"开始答题"时抽一次
- 结果随同其他状态持久化到 localStorage —— 刷新页面不会重抽
- `restart()` 会把该值清 0 重新抽

### 6.3 Q15 后插入

位置：`exam.js` 的 `checkGateTrigger()`。

```js
if (questionId === 15 && !g1Inserted.value && bugLotteryWon.value) {
  insertGateAfter('G1', 15)
  g1Inserted.value = true
}
```

- 当用户**答完 Q15** 时触发判定
- 插入到 Q15 之后（成为第 16 张卡）
- 插入后 `runSequence.length = 21`

### 6.4 BUG 题定义（`questions.json` → `gate_questions[0]`）

```jsonc
{
  "id": "G1",
  "is_gate": true,
  "is_bug": true,                             // 标记：渲染时用 ※ 而不是【附加题】
  "trigger_condition": "1%抽签（开考时决定）+ Q15后插入",
  "trigger_check": "bug_lottery_after_q15",
  "stem": "你做题做得好好的，耳机里、窗外、或者就是脑子里——你说不清——突然串进了一段不该属于这个考场的声音：\n\n「……好，先不要让 {SEAT4} 号位察觉。把她的心跳调回 72，把前排翻页的节奏对齐到下一个整秒。监考组重复一遍，目标考生编号 ██ 的情绪曲线偏离预设，准备用 B 选项把她拉回来——」\n\n声音说到这里卡了一下，然后是一长串滋滋啦啦的电流声。等电流声停下来，你的答题卡上多出了四个选项。它们看起来像是从别的题里掉进来的。",
  "options": [
    { "label": "A", "text": "……所以最后我还是哭出来了，连作文纸都打&&湿了半页██", "gate_result": null },
    { "label": "B", "text": "已知一个向量组线性无关，求证这个向量组中$+$任一向量都不能由其余向量线性表出██", "gate_result": null },
    { "label": "C", "text": "▓█别动█▒。继续按你原本的节奏做题░，不要█让他们知道你刚才听到了▓", "gate_result": "地球Online·BUG修复局" },
    { "label": "D", "text": "标准答案：D。难度：★★★★★。正确率：1.46%。", "gate_result": null }
  ]
}
```

**注意**：题干里的 `{SEAT4}` 是占位符，渲染时替换为准考证号后 4 位。

### 6.5 `{SEAT4}` 动态替换

位置：`exam.js` 的 `getQuestionObj()`。

```js
let stem = raw.stem
if (item.type === 'gate' && typeof stem === 'string' && stem.includes('{SEAT4}')) {
  const seat4 = (ticketNumber.value || '').slice(-4) || '0000'
  stem = stem.split('{SEAT4}').join(seat4)
}
```

### 6.6 视觉规则

- **题号显示 ※ 而不是数字**
  - QuestionCard 内部通过 `isBug = computed(() => !!props.question?.is_bug)` 判断
  - template 里 `v-if="isBug"` 显示 `※`
- **没有 "（ ）" 答题括号**（普通题末尾那个记录答题历史的括号）
  - 通过 `v-if="!isGate && !isBug"` 隐藏
- **题干保留换行**
  - 题干里的 `\n` 转成 `<br>`，通过 `renderedStem` computed + `v-html` 渲染
  - 渲染前做 HTML 转义（`&` `<` `>`），避免注入
- **题卡边框改为实线**（区别于普通附加题的虚线）
- **CSS**：`.question-card--bug`、`.question-card__number--bug`、`.option-item--bug`（见 `web/src/styles/question.css`）

### 6.7 不占答题进度

- `answeredCount`（页脚进度）**只数普通题 + 非 BUG 的门控题**。
- 结束条件从"`answeredCount >= runSequence.length`"改成"**普通题全部答完**"：`Object.keys(answers.value).length >= questions.value.length`
- 即使用户没选 BUG 题，答完第 20 题照样跳转结果页
- 页脚总题数 `total` 直接用 `store.questions.length`（20），不用 `runSequence.length`

### 6.8 BUG 题的答案走正常门控通道

即：用户选了 BUG 题任何一个选项，都会写入 `gateAnswers`（通过 `answerQuestion` 的 `questionType === 'gate'` 分支）。`computeResult()` 在评分时先检查 `gateAnswers` 里有没有 `gate_result` 不为 null 的选项，有就直接返回 BUG 局；没有就走正常大学匹配。

---

## 7. 水豚隐藏结局（亚太水豚研究所）

### 7.1 人设
- **核心意象**：情感扁平、不是装不在乎，而是"连涟漪都翻不出来"
- **触发直觉**：用户的行为表现为"根本没在用心读题 / 反应系统像是关了"
- summary 在 `results.json` → `gate_results['亚太水豚研究所']`

### 7.2 触发机制

同时满足以下 3 个条件才触发：

1. **平均答题时长 ≤ 3 秒/题**
2. **全程零反选、零改选**（`changeCount === 0`）
3. **已答完 ≥ 15 题**

### 7.3 实现（`exam.js`）

```js
const CAPYBARA_AVG_MS = 3000
const CAPYBARA_MIN_Q = 15
function isCapybaraTriggered() {
  const answeredN = Object.keys(answers.value).length
  if (answeredN < CAPYBARA_MIN_Q) return false
  if (!firstAnswerAt.value) return false
  if (changeCount.value > 0) return false
  const elapsed = Date.now() - firstAnswerAt.value
  const avg = elapsed / answeredN
  return avg <= CAPYBARA_AVG_MS
}
```

**`changeCount`** 状态（`ref(0)`）在 `answerQuestion` 中递增：
- 反选涂销（已选的又点了一次）→ `changeCount += 1`
- 改选（已有答案，改成别的）→ `changeCount += 1`

`restart()` 清零、`init()` 恢复、`watch` 持久化均已实现。

### 7.5 覆盖优先级

位置：`ResultView.vue` `onMounted`。

```
空闲 fallback （3 分钟不动）               ← 最高优先级
  ↓
computeResult 返回 isGate=true（BUG 局）    ← 次之
  ↓
isCapybaraTriggered() === true             ← 水豚覆盖
  ↓
normal computeResult（4 所主大学之一）       ← 默认
```

当前代码已实现这个顺序（水豚判定前先跑一次 `computeResult`，若发现是 BUG 局则优先 BUG 局）。

---

## 8. 空闲 Fallback —— 空白档案收容所

### 8.1 触发
在 `ExamView` 里挂全局事件监听（`click/touchstart/keydown/scroll/mousemove`），任何交互都会 reset 计时器。**3 分钟内无任何交互**则触发。

### 8.2 效果
- `store.triggerFallback()` → `isFallback = true` + 跳结果页
- `ResultView` 最优先分支：读取 `results.fallback_result`

### 8.3 文案
见 `results.json` → `fallback_result`，人设是"整个脑袋被按下了重启键"。

---

## 9. 门控结局数据（`results.json`）

### 9.1 地球Online·BUG修复局
```json
{
  "department": "▓█BU▒G处░██▒▓",
  "envelope_warning": "WARNING: DATA OVERFLOW",
  "envelope_code": "EOBFB-26-FALL",
  "summary": "你答着答着突然发现，监考老师的步伐精确到毫秒，窗外的鸟叫每47秒循环一次，前排同学翻卷子的节奏完全同步……",
  "social_tag": "#不存在的考场"
}
```

### 9.2 亚太水豚研究所
```json
{
  "department": "合法发呆事业编管理处",
  "envelope_warning": "WARNING: EMOTIONAL FLATLINE",
  "envelope_code": "APCBI-26-FALL",
  "summary": "你的精神内核已经彻底退化成一只水豚……",
  "social_tag": "#确诊为人类变异水豚"
}
```

### 9.3 空白档案收容所（fallback）
```json
{
  "department": "失忆急诊科",
  "envelope_warning": "WARNING: BRAIN FORMATTED",
  "envelope_code": "FMTGH-26-FALL",
  "summary": "你坐在考场里，眼前的试卷仿佛一本你从未学过的外语……",
  "social_tag": "#我的大脑已经蓝屏"
}
```

---

## 10. 状态持久化

### 10.1 localStorage key
`gaokao-exam-state`

### 10.2 持久化字段
`exam.js` 的 `watch` 监听下列字段，变化即写入 localStorage：
- `view` / `playerName` / `ticketNumber`
- `answers` / `gateAnswers`
- `currentIndex` / `runSequence`
- `g1Inserted`
- `bugLotteryWon`
- `firstAnswerAt`
- `isFallback` / `envelopeSeen`
- `optionOrderMap`
- `changeCount`（反选/改选次数，水豚触发的零犹豫防线）

### 10.3 init 时的恢复
`init()` 里的 `loadState()`：
- 有存档 → 按字段恢复
- 无存档 → 设默认值，生成初始 `runSequence` 和 `optionOrderMap`
- 部分字段缺失（老存档）→ 兜底

### 10.4 restart
`restart()` 清空 localStorage + 所有状态置初值 + 重新生成准考证号 + 重新洗牌。

---

## 11. 视图流程

```
ExamView 开篇（绝密★启用前的抬头 + 注意事项 + "开始答题"按钮）
   │ 点击按钮 → startExam()（此时 5% BUG 抽签）
   ▼
ExamView 中篇（滚动式一屏展示所有题）
   │ 答完第 20 道普通题
   │ （或 3 分钟不动 → fallback）
   ▼
ResultView（录取通知书信封 → 点击拆封 → 通知书正文 + 分享海报）
```

> 实现上 `StartView` 已没有单独组件，开篇与中篇都由 `ExamView.vue` 通过 `store.view` 的 `start`/`exam` 状态驱动。`App.vue` 只负责在 `view === 'result'` 时切换到 `ResultView`。

### 11.1 特殊 UI 点

- **答题括号历史**（QuestionCard 里的"（X）"）记录每次作答的手写字母，若反选则在字母上画个删除线，多次改答会叠出历史。**仅普通题显示**。
- **铅笔音效**：点击选项时播放 `/sounds/pencil.mp3`（`useSound` composable 管理 WebAudio 上下文与缓存）。
- **准考证号** + **姓名（可选填）** + **考卷字母**（M/B/T/I 随机）在 ExamHeader 上显示。

### 11.2 信封与拆封动画

位置：`ResultView.vue`。

进入结果页后，首先看到的是一个**录取通知书信封**，包含以下元素：

- **篆刻方印**（SVG）：显示大学英文缩写（如 KHU、APCI），带印泥斑驳滤镜（`feTurbulence` + `feDisplacementMap`）
- **左上角院系信息**：英文校名、英文院系名、警告文字（如 `WARNING: ANXIETY OVERFLOW`）
- **右上角邮戳**（SVG 圆形）：英文校名弧形排列 + 日期 `APRIL 16 2026` + 中心 `ADMITTED`
- **中央文字**：`录 取 通 知 书`
- **提示**：`— 点击拆封 —`
- **左下角编码**：`[CODE: xxx-26-FALL]` + `[STATUS: DAMAGE-CONTROL ASSESSMENT]`

点击信封后触发拆封动画（`envelope--opening` class），1.2 秒后信封消失，通知书淡入。

**刷新恢复**：`envelopeSeen` 标记持久化在 localStorage。若已拆过信封，刷新后直接跳过信封显示通知书。每次答完题进入结果页都会重新展示信封动画，只有停留在录取通知书页面刷新时才跳过。

### 11.3 录取通知书

位置：`ResultNotice.vue`。

通知书以逐行交错动画（`notice-stagger`）展开，包含：

- **录取编号**：`录字第 YYYY-NNNNNN 号`（年份 + 大学名称 hash 取 6 位）
- **徽章**：普通结局显示 `录 取 通 知 书`，隐藏结局显示 `✦ 隐藏录取 ✦`
- **大学名称**（中文 + 英文）
- **正文**：
  - 称呼（`XX同学` 或 `优秀的同学`，姓名可在通知书上点击修改）
  - 录取声明：`经本校二〇二六年度招生委员会综合评审，你已被 XX大学 · XX系 正式录取。`
  - 大学 summary 文案
  - `请于收到本通知书后，携带相关材料到校报到。`
- **签章区**：院系名 + 中文日期（`二〇二六年四月十八日`）+ 篆刻印章（`SealStamp` 组件，带盖章动画）
- **水印层**：大学名称斜排重复水印（SVG 生成，半透明红色）
- **角花装饰**：四角 L 形边框

### 11.4 操作按钮

通知书下方（随通知书一起淡入，延迟 2.4 秒）：

- **分享**：生成分享海报图片
- **再测一次**：调用 `store.restart()` 重置所有状态

### 11.5 社媒引导区

- 提示文字：`※ 持本通知书可至以下渠道办理报到手续：`
- 三个按钮：
  - **小红书**：外链到作者小红书主页
  - **公众号**：弹出二维码模态框（`gongzonghao.png`）
  - **GitHub**：外链到 `Damue01/GaokaoMBTI` 仓库

### 11.6 分享海报

位置：`SharePoster.vue`。

点击"分享"按钮后：

1. 海报组件渲染到视口外（隐藏容器）
2. 等待 QR code 和字体渲染完成（移动端 1.2s，桌面端 0.6s）
3. 使用 `html2canvas` 截图生成 PNG（移动端 1.5x，桌面端 2x 缩放）
4. 弹出海报预览模态框，提示"长按图片保存到手机，分享给好友"

海报内容：
- 角花装饰 + 水印层（大学名称重复）
- 录取编号、大学名称（中英文）、录取声明、summary 文案
- 签章区（院系 + 日期 + 篆刻印章）
- 底部验证区：QR code（指向 `www.gaokaombti.com`）+ `扫码测试你的高考命运`

**降级策略**：首次 `html2canvas` 失败时自动降级到 `scale: 1` 重试；各类错误（跨域、内存、网络）有友好的中文提示。

---

## 12. 开发测试命令

```powershell
cd web
npm install
npm run dev -- --host 127.0.0.1 --port 4173
# 访问 http://127.0.0.1:4173/
```

VS Code 里也有预置 task：`Run web dev server from subdir`。

### 12.1 快速触发各结局（开发调试）

```js
// 浏览器 console 里执行
localStorage.clear()
location.reload()

// 强制抽中 BUG 彩票（在点"开始答题"之前执行）
Math.random = () => 0.001
// 点按钮，然后恢复：
Math.random = () => 0.5

// 强制水豚：快速点击 20 题（平均 < 3 秒/题）且不反选
```

---

## 13. TODO

所有功能已实现，当前无待办项。这份规范即是实际代码状态的精确描述。
