<template>
  <div class="seal-container" :class="{ 'stamp-slam': animate }">
    <svg viewBox="0 0 200 200" class="seal-svg">
      <!-- 滤镜：产生印泥斑驳、破损感 -->
      <defs>
        <filter id="stamp-texture" x="-20%" y="-20%" width="140%" height="140%">
          <!-- 产生高频噪声 -->
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" result="noise" />
          <!-- 调整噪声对比度 -->
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 15 -6" in="noise" result="highContrastNoise" />
          <!-- 让图案和高对比杂色进行相交，产生空洞和残缺 -->
          <feComposite in="SourceGraphic" in2="highContrastNoise" operator="in" result="composite1" />
          <!-- 轻微变形，让边缘看起来像印泥晕开 -->
          <feDisplacementMap in="composite1" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G" result="disp" />
          <!-- 叠加一层稍微浅一点的原图，保证字能看清 -->
          <feBlend mode="multiply" in="SourceGraphic" in2="disp" />
        </filter>

        <!-- 文字路径（上半圆），缩小半径防止与边框重叠 -->
        <path id="seal-text-path-top" d="M 35, 100 A 65,65 0 1,1 165,100" />
      </defs>

      <!-- 所有元素应用破损滤镜 -->
      <g :filter="noFilter ? undefined : 'url(#stamp-texture)'">
        <!-- 外圈粗线 -->
        <circle cx="100" cy="100" r="92" fill="none" stroke="#c82a2a" stroke-width="5" />
        <!-- 内圈细线 -->
        <circle cx="100" cy="100" r="86" fill="none" stroke="#c82a2a" stroke-width="1.5" />
        
        <!-- 圆圈文字 -->
        <text font-family="'SimSun', 'STSong', serif" font-weight="900" font-size="18" fill="#c82a2a">
          <textPath href="#seal-text-path-top" startOffset="50%" text-anchor="middle">
             {{ text }}
          </textPath>
        </text>

        <!-- 底部文字 -->
        <text x="100" y="155" font-family="'SimHei', 'Microsoft YaHei', sans-serif" font-weight="bold" font-size="16" fill="#c82a2a" text-anchor="middle" letter-spacing="4">
          录取专用章
        </text>

        <!-- 中心图案：五角星 -->
        <polygon points="100,56 112,87 145,87 118,106 128,137 100,118 72,137 82,106 55,87 88,87" fill="#c82a2a" />
      </g>
    </svg>
  </div>
</template>

<script setup>
defineProps({
  text: {
    type: String,
    required: true
  },
  animate: {
    type: Boolean,
    default: false
  },
  noFilter: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.seal-container {
  width: 140px;
  height: 140px;
  position: absolute;
  /* 现实中印章墨水的正片叠底效果 */
  mix-blend-mode: multiply;
  opacity: 0.9;
  transform: rotate(-15deg);
  pointer-events: none;
  z-index: 10;
}

.seal-svg {
  width: 100%;
  height: 100%;
}

/* 盖章动画 */
.stamp-slam {
  animation: stampObjSlam 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  /* 配合外部传入的延迟使用 */
}

@keyframes stampObjSlam {
  0% { transform: scale(4) rotate(15deg); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: scale(1) rotate(-15deg); opacity: 0.9; }
}
</style>
