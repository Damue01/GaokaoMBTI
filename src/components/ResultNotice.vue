<template>
  <div class="notice" :class="{ 'notice--gate': isGate, 'notice--animate': animate }">
    <!-- 水印层 -->
    <div
      class="notice__watermark"
      :style="{ '--watermark-image': watermarkSvg }"
      aria-hidden="true"
    ></div>

    <!-- 角花装饰 -->
    <span class="notice__corner notice__corner--tl"></span>
    <span class="notice__corner notice__corner--tr"></span>
    <span class="notice__corner notice__corner--bl"></span>
    <span class="notice__corner notice__corner--br"></span>

    <!-- 编号 -->
    <div class="notice__number notice-stagger" style="--stagger: 0">录字第 {{ admissionNo }} 号</div>

    <div class="notice__badge notice-stagger" style="--stagger: 0">
      {{ isGate ? '✦ 隐藏录取 ✦' : '录 取 通 知 书' }}
    </div>
    <hr class="notice__divider notice-stagger" style="--stagger: 1" />

    <div class="notice__title notice-stagger" style="--stagger: 1.5">
      {{ result.name }}
    </div>
    <div v-if="result.english_name" class="notice__subtitle notice-stagger" style="--stagger: 2">
      {{ result.english_name }}
    </div>
    <div class="notice__content notice-stagger" style="--stagger: 3">
      <p class="notice__greeting">
        <template v-if="isEditingName">
          <input
            ref="editNameInput"
            class="notice__name-input"
            :value="playerName"
            placeholder="请输入姓名"
            maxlength="20"
            @blur="finishEditName"
            @keydown.enter="$event.target.blur()"
          />同学：
        </template>
        <template v-else>
          <span class="notice__name-editable" @click="startEditName" title="点击修改姓名">{{ greetingText }}</span>：
        </template>
      </p>
      <p class="notice__formal">
        经本校二〇二六年度招生委员会综合评审，你已被
        <strong>{{ result.name }} · {{ result.department || '绝密综合评价中心' }}</strong>
        正式录取。
      </p>
      <p class="notice__summary">{{ result.summary }}</p>
      <p class="notice__report">请于收到本通知书后，携带相关材料到校报到。</p>
      <div class="notice__signature">
        <div class="notice__dept">{{ result.department || '绝密综合评价中心' }}</div>
        <div class="notice__date">{{ chineseDate }}</div>
        <SealStamp 
           :text="result.name" 
           :animate="animate" 
           style="right: -30px; bottom: -30px; animation-delay: calc(3.5 * 0.3s);" 
        />
      </div>
    </div>

    <!-- 底部细则 -->
    <div class="notice__fine-print notice-stagger" style="--stagger: 4">
      ※ 此通知书由人格综合评价中心出具，请妥善保管
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import SealStamp from './SealStamp.vue'

const props = defineProps({
  result: { type: Object, required: true },
  isGate: { type: Boolean, default: false },
  animate: { type: Boolean, default: false },
  playerName: { type: String, default: '' }
})

const emit = defineEmits(['update:playerName'])

const isEditingName = ref(false)
const editNameInput = ref(null)

function startEditName() {
  isEditingName.value = true
  setTimeout(() => editNameInput.value?.focus(), 0)
}

function finishEditName(e) {
  const newName = (e.target.value || '').trim()
  emit('update:playerName', newName)
  isEditingName.value = false
}

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
</script>
