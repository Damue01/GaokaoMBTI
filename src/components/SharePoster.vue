<template>
  <div class="poster" :class="{ 'poster--gate': isGate }">
    <!-- 水印层 -->
    <div
      class="poster__watermark"
      :style="{ '--watermark-image': watermarkSvg }"
      aria-hidden="true"
    ></div>

    <!-- 角花装饰 -->
    <span class="poster__corner poster__corner--tl"></span>
    <span class="poster__corner poster__corner--tr"></span>
    <span class="poster__corner poster__corner--bl"></span>
    <span class="poster__corner poster__corner--br"></span>

    <!-- 编号 -->
    <div class="poster__number">录字第 {{ admissionNo }} 号</div>

    <!-- 顶部标题 -->
    <div class="poster__header">
      <div class="poster__badge">{{ isGate ? '✦ 隐藏录取 ✦' : '录 取 通 知 书' }}</div>
      <hr class="poster__divider" />
      <div class="poster__school">{{ result.name }}</div>
      <div v-if="result.english_name" class="poster__school-en">{{ result.english_name }}</div>
    </div>

    <!-- 正文 -->
    <div class="poster__body">
      <p class="poster__greeting">{{ greetingText }}：</p>
      <p class="poster__formal">
        经本校二〇二六年度招生委员会综合评审，你已被
        <strong>{{ result.name }} · {{ result.department || '绝密综合评价中心' }}</strong>
        正式录取。
      </p>
      <p class="poster__summary">{{ result.summary }}</p>
      <p class="poster__report">请于收到本通知书后，携带相关材料到校报到。</p>
    </div>

    <!-- 签章 -->
    <div class="poster__footer">
      <div class="poster__dept">{{ result.department || '绝密综合评价中心' }}</div>
      <div class="poster__date">{{ chineseDate }}</div>
      <SealStamp :text="result.name" style="right: -40px; bottom: -30px; width: 120px; height: 120px;" />
    </div>

    <!-- 底部验证区 -->
    <div class="poster__verify">
      <div class="poster__verify-line"></div>
      <div class="poster__verify-content">
        <div class="poster__qr" ref="qrRef"></div>
        <div class="poster__verify-info">
          <span class="poster__verify-label">扫码测试你的高考命运</span>
          <span class="poster__verify-url">www.gaokaombti.com</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import QRCode from 'qrcode'
import SealStamp from './SealStamp.vue'

const props = defineProps({
  result: { type: Object, required: true },
  isGate: { type: Boolean, default: false },
  playerName: { type: String, default: '' }
})

const qrRef = ref(null)

const greetingText = computed(() => {
  return props.playerName ? `${props.playerName}同学` : '优秀的同学'
})

const cnDigits = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九']
const chineseDate = computed(() => {
  const now = new Date()
  const year = String(now.getFullYear()).split('').map(d => cnDigits[+d]).join('')
  const month = now.getMonth() + 1
  const cnMonth = month <= 10
    ? ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'][month - 1]
    : month === 11 ? '十一' : '十二'
  const day = now.getDate()
  let cnDay
  if (day <= 10) cnDay = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'][day - 1]
  else if (day < 20) cnDay = '十' + cnDigits[day - 10]
  else if (day === 20) cnDay = '二十'
  else if (day < 30) cnDay = '二十' + cnDigits[day - 20]
  else if (day === 30) cnDay = '三十'
  else cnDay = '三十一'
  return `${year}年${cnMonth}月${cnDay}日`
})

const admissionNo = computed(() => {
  const year = new Date().getFullYear()
  let hash = 0
  const name = props.result.name || ''
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i)
    hash |= 0
  }
  return `${year}-${String(Math.abs(hash) % 1000000).padStart(6, '0')}`
})

const watermarkSvg = computed(() => {
  const text = (props.result.name || '').replace(/[&<>'"]/g, (char) => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;'
    }
    return map[char]
  })

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="120" viewBox="0 0 260 120"><text x="0" y="68" fill="rgba(209,37,37,0.045)" font-size="22" font-family="Baskerville, Georgia, STSong, SimSun, serif">${text}</text></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
})

onMounted(async () => {
  if (qrRef.value) {
    try {
      const canvas = await QRCode.toCanvas('https://www.gaokaombti.com', {
        width: 200,
        margin: 1,
        color: { dark: '#999999', light: '#ffffff' }
      })
      qrRef.value.appendChild(canvas)
    } catch (e) {
      console.error('QR code generation failed', e)
    }
  }
})
</script>
