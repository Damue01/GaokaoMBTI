<template>
  <div class="paper result-page" ref="exportRef">
    <!-- 信封 -->
    <div
      v-if="envelopeVisible"
      class="envelope"
      :class="{ 'envelope--opening': envelopeOpening }"
      @click="openEnvelope"
    >
      <!-- 篆刻方印（SVG，带印泥斑驳滤镜） -->
      <svg class="envelope__seal" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="seal-worn" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="4" result="noise" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" in="noise" result="mask" />
            <feComposite in="SourceGraphic" in2="mask" operator="in" result="worn" />
            <feDisplacementMap in="worn" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G" result="disp" />
            <feBlend mode="multiply" in="SourceGraphic" in2="disp" />
          </filter>
        </defs>
        <g filter="url(#seal-worn)">
          <rect x="4" y="4" width="92" height="92" rx="3" fill="none" stroke="currentColor" stroke-width="5" />
          <rect x="10" y="10" width="80" height="80" rx="2" fill="none" stroke="currentColor" stroke-width="1.5" />
          <text x="50" y="56" text-anchor="middle" dominant-baseline="middle"
            font-family="'Garamond','Georgia',serif" font-weight="900" font-size="22"
            fill="currentColor">{{ sealAbbr }}</text>
        </g>
      </svg>
      <!-- 左上角：院系 & 警告 -->
      <div class="envelope__dept" v-if="resultData">
        <div class="envelope__dept-line">{{ resultData.result.english_name || 'University of California, Bojini' }}</div>
        <div class="envelope__dept-line">{{ resultData.result.english_department || 'Dept. of After-Exam Engineering' }}</div>
        <div class="envelope__dept-line envelope__dept-warn">{{ resultData.result.envelope_warning || 'WARNING: PSYCHOLOGICAL HAZARD' }}</div>
      </div>
      <!-- 右上角：SVG 邮戳 -->
      <svg class="envelope__postmark" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <path id="postmark-arc-top" d="M 12,50 A 38,38 0 0,1 88,50" fill="none" />
          <path id="postmark-arc-bot" d="M 88,50 A 38,38 0 0,1 12,50" fill="none" />
        </defs>
        <circle cx="50" cy="50" r="44" />
        <circle cx="50" cy="50" r="38" />
        <circle cx="50" cy="50" r="32" />
        <text><textPath :href="'#postmark-arc-top'" startOffset="50%" text-anchor="middle">{{ postmarkName }}</textPath></text>
        <text><textPath :href="'#postmark-arc-bot'" startOffset="50%" text-anchor="middle">APRIL 16 2026</textPath></text>
        <text x="50" y="52" text-anchor="middle" class="envelope__postmark-center">ADMITTED</text>
      </svg>
      <!-- 中央文字 -->
      <div class="envelope__text">录 取 通 知 书</div>
      <div class="envelope__hint">— 点击拆封 —</div>
      <!-- 左下角：编码 -->
      <div class="envelope__code" v-if="resultData">
        <div class="envelope__code-line">[CODE: {{ resultData.result.envelope_code || 'UCBOJ-26-FALL' }}]</div>
        <div class="envelope__code-line">[STATUS: DAMAGE-CONTROL ASSESSMENT]</div>
      </div>
    </div>

    <!-- 录取通知书 -->
    <ResultNotice
      v-if="resultData && noticeVisible"
      :result="resultData.result"
      :is-gate="resultData.isGate"
      :animate="noticeAnimating"
      :player-name="store.playerName"
      @update:player-name="store.playerName = $event"
    />

    <!-- 操作按钮（随通知书一起渲染） -->
    <div v-if="noticeVisible" class="result-actions" :class="{ 'extras-fade-in': extrasVisible }">
      <button class="btn" @click="handleShare"><span class="btn__check">[&#8201;<span class="btn__fill">■</span>&#8201;]</span> 分 享</button>
      <button class="btn btn--primary" @click="store.restart()"><span class="btn__check">[&#8201;<span class="btn__fill">■</span>&#8201;]</span> 再测一次</button>
    </div>

    <!-- 社媒引导区 -->
    <div v-if="noticeVisible" class="social-links" :class="{ 'extras-fade-in': extrasVisible }">
      <p class="social-links__label">※ 持本通知书可至以下渠道办理报到手续：</p>
      <div class="social-links__buttons">
        <a href="https://www.xiaohongshu.com/user/profile/658448ae000000001d002081" target="_blank" rel="noopener noreferrer" class="btn btn--social"><span class="btn__check">[&#8201;<span class="btn__fill">■</span>&#8201;]</span> 小 红 书</a>
        <button class="btn btn--social" @click="showQrCode = true"><span class="btn__check">[&#8201;<span class="btn__fill">■</span>&#8201;]</span> 公 众 号</button>
        <a href="https://github.com/Damue01/GaokaoMBTI" target="_blank" rel="noopener noreferrer" class="btn btn--social"><span class="btn__check">[&#8201;<span class="btn__fill">■</span>&#8201;]</span> GitHub</a>
      </div>
    </div>

    <!-- 公众号二维码弹窗 -->
    <div v-if="showQrCode" class="qr-modal" @click.self="showQrCode = false">
      <div class="qr-modal__body">
        <span class="qr-modal__corner qr-modal__corner--tl"></span>
        <span class="qr-modal__corner qr-modal__corner--tr"></span>
        <span class="qr-modal__corner qr-modal__corner--bl"></span>
        <span class="qr-modal__corner qr-modal__corner--br"></span>
        <p class="qr-modal__badge">报 到 指 引</p>
        <hr class="qr-modal__divider" />
        <img src="/gongzonghao.png" alt="公众号二维码" class="qr-modal__img" />
        <p class="qr-modal__name">小禾苗的花田</p>
        <p class="qr-modal__hint">※ 微信扫码关注，探索更多 AI 实验与技术分享</p>
        <button class="btn btn--social qr-modal__close" @click="showQrCode = false">
          <span class="btn__check">[&#8201;<span class="btn__fill">■</span>&#8201;]</span> 关 闭
        </button>
      </div>
    </div>

    <!-- 轻量 toast -->
    <Transition name="toast">
      <div v-if="toastMsg" class="share-toast">{{ toastMsg }}</div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useExamStore } from '../stores/exam'
import { computeResult } from '../composables/useScoring'
import ResultNotice from '../components/ResultNotice.vue'

const store = useExamStore()
const exportRef = ref(null)
const resultData = ref(null)
const toastMsg = ref('')

const envelopeVisible = ref(true)
const envelopeOpening = ref(false)
const noticeVisible = ref(false)
const noticeAnimating = ref(false)
const extrasVisible = ref(false)
const showQrCode = ref(false)

const postmarkName = computed(() => {
  const name = resultData.value?.result?.english_name || 'University of California, Bojini'
  // Extract name without abbreviation for the postmark arc
  const match = name.match(/^(.+?)\s*\(/)
  return match ? match[1].toUpperCase() : name.toUpperCase()
})

const sealAbbr = computed(() => {
  const name = resultData.value?.result?.english_name || ''
  const match = name.match(/\(([^)]+)\)$/)
  return match ? match[1] : 'EXAM'
})

function openEnvelope() {
  if (envelopeOpening.value) return
  envelopeOpening.value = true

  setTimeout(() => {
    envelopeVisible.value = false
    noticeVisible.value = true
    noticeAnimating.value = true
    store.envelopeSeen = true

    setTimeout(() => {
      extrasVisible.value = true
    }, 2400)
  }, 1200)
}

onMounted(() => {
  if (!store.results) {
    envelopeVisible.value = false
    return
  }

  // 空闲超时 → 直接使用 fallback_result
  if (store.isFallback && store.results.fallback_result) {
    resultData.value = {
      result: store.results.fallback_result,
      isGate: false
    }
  } else if (store.isCapybaraTriggered && store.isCapybaraTriggered() && store.results.gate_results && store.results.gate_results['亚太水豚研究所']) {
    // 速答触发 → 水豚（优先级高于正常评分，但低于 BUG 局 / fallback）
    // 若用户同时选中了 BUG 选项，computeResult 仍会返回 BUG 局，这里要先判 BUG
    const normalResult = computeResult({
      answers: store.answers,
      gateAnswers: store.gateAnswers,
      questions: store.questions,
      gateQuestions: store.gateQuestions,
      resultsData: store.results
    })
    if (normalResult && normalResult.isGate) {
      resultData.value = normalResult
    } else {
      resultData.value = {
        result: store.results.gate_results['亚太水豚研究所'],
        isGate: true
      }
    }
  } else {
    resultData.value = computeResult({
      answers: store.answers,
      gateAnswers: store.gateAnswers,
      questions: store.questions,
      gateQuestions: store.gateQuestions,
      resultsData: store.results
    })
  }

  if (resultData.value) {
    // 信封已拆过（刷新恢复）→ 跳过动画直接展示通知书
    if (store.envelopeSeen) {
      envelopeVisible.value = false
      noticeVisible.value = true
      noticeAnimating.value = false
      extrasVisible.value = true
      return
    }
    // 首次进入结果页：显示信封，等待用户点击拆封
  } else {
    envelopeVisible.value = false
    noticeVisible.value = true
    extrasVisible.value = true
  }
})

function showToast(msg, duration = 2000) {
  toastMsg.value = msg
  setTimeout(() => { toastMsg.value = '' }, duration)
}

function buildShareUrl(source) {
  const base = 'https://www.gaokaombti.com/'
  const params = new URLSearchParams({
    utm_source: source,
    utm_medium: source === 'poster' ? 'qrcode' : 'share',
    utm_campaign: 'result'
  })
  return `${base}?${params.toString()}`
}

function handleShare() {
  const schoolName = resultData.value?.result?.name || '某高等学府'
  const text = `绝密★启用前｜本人已被「${schoolName}」预录取，特此分享《2026年普通高等学校招生全国统一考试·人格综合》试卷，供同场考生参阅。`

  // navigator.share 必须在用户点击的同步调用栈里，不能有 await
  const nativeUrl = buildShareUrl('native')
  if (navigator.share && navigator.canShare?.({ text, url: nativeUrl })) {
    navigator.share({
      title: '2026年普通高等学校招生全国统一考试 · 人格综合（全国卷）',
      text,
      url: nativeUrl
    }).catch((err) => {
      if (err.name !== 'AbortError') copyFallback(text)
    })
    return
  }

  copyFallback(text)
}

async function copyFallback(text) {
  const content = `${text}\n${buildShareUrl('copy')}`
  try {
    await navigator.clipboard.writeText(content)
    showToast('已复制分享文案到剪贴板')
  } catch {
    showToast('复制失败，请手动复制链接分享')
  }
}
</script>
