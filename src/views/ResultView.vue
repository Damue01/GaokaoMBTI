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
      <button class="btn" @click="sharePoster"><span class="btn__check">[&#8201;<span class="btn__fill">■</span>&#8201;]</span> 分 享</button>
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

    <!-- 海报渲染容器（隐藏在视口外） -->
    <SharePoster
      v-if="resultData && posterVisible"
      ref="posterRef"
      :result="resultData.result"
      :is-gate="resultData.isGate"
      :player-name="store.playerName"
    />

    <!-- 海报预览模态框 -->
    <div v-if="posterSrc" class="poster-modal" @click.self="posterSrc = null">
      <div class="poster-modal__body">
        <img :src="posterSrc" alt="分享海报" class="poster-modal__img" />
        <p class="poster-modal__hint">长按图片保存到手机，分享给好友</p>
        <button class="btn poster-modal__close" @click="posterSrc = null">
          <span class="btn__check">[&#8201;<span class="btn__fill">■</span>&#8201;]</span> 关 闭
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useExamStore } from '../stores/exam'
import { computeResult } from '../composables/useScoring'
import ResultNotice from '../components/ResultNotice.vue'
import SharePoster from '../components/SharePoster.vue'
import html2canvas from 'html2canvas'

const store = useExamStore()
const exportRef = ref(null)
const resultData = ref(null)
const posterRef = ref(null)
const posterVisible = ref(false)
const posterSrc = ref(null)

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

function getPosterErrorMessage(error, context = {}) {
  const name = error?.name || ''
  const message = String(error?.message || error || '')

  if (context.stage === 'element-missing') {
    return '海报组件尚未加载完成，请稍后重试。'
  }

  if (context.stage === 'invalid-size') {
    return '海报尺寸读取失败，可能是页面还没渲染完成，请稍后重试。'
  }

  if (name === 'AbortError') {
    return '你已取消系统分享。'
  }

  if (context.stage === 'share') {
    return `系统分享失败：${message || '当前浏览器暂不支持文件分享'}。已为你回退到图片预览。`
  }

  if (/tainted canvas|insecure operation|cross-origin/i.test(message)) {
    return '海报中包含跨域资源，浏览器阻止了截图生成。'
  }

  if (/canvas|memory|allocate|size/i.test(message)) {
    return '海报生成时画布分配失败，可能是当前手机内存不足，请关闭后台后重试。'
  }

  if (/network|fetch/i.test(message)) {
    return '海报图片转换失败，网络或浏览器环境异常，请稍后重试。'
  }

  return `海报生成失败：${message || '未知错误'}。`
}

function canvasToPngUrl(canvas) {
  return new Promise((resolve, reject) => {
    if (typeof canvas.toBlob === 'function') {
      try {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('canvas toBlob returned empty result'))
            return
          }
          resolve(URL.createObjectURL(blob))
        }, 'image/png')
        return
      } catch (error) {
        reject(error)
        return
      }
    }

    try {
      resolve(canvas.toDataURL('image/png'))
    } catch (error) {
      reject(error)
    }
  })
}

async function sharePoster() {
  posterVisible.value = true
  await nextTick()

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

  // 等待 QR code 和字体渲染完成，移动端多等一些
  await new Promise(r => setTimeout(r, isMobile ? 1200 : 600))

  try {
    const el = posterRef.value?.$el
    if (!el) {
      alert(getPosterErrorMessage(new Error('poster element missing'), { stage: 'element-missing' }))
      return
    }

    if (!el.offsetWidth || !el.offsetHeight) {
      alert(getPosterErrorMessage(new Error(`invalid poster size: ${el.offsetWidth}x${el.offsetHeight}`), { stage: 'invalid-size' }))
      return
    }

    let canvas
    const baseOpts = {
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: true,
      logging: false,
      width: el.offsetWidth,
      height: el.offsetHeight,
    }

    try {
      canvas = await html2canvas(el, { ...baseOpts, scale: isMobile ? 1.5 : 2 })
    } catch (firstErr) {
      console.warn('html2canvas 首次失败，降级重试', firstErr)
      canvas = await html2canvas(el, { ...baseOpts, scale: 1 })
    }

    posterSrc.value = await canvasToPngUrl(canvas)
  } catch (e) {
    console.error('海报生成失败', e)
    alert(getPosterErrorMessage(e))
  } finally {
    posterVisible.value = false
  }
}
</script>
