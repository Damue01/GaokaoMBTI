<template>
  <div class="paper view-enter-active">
    <ExamHeader />

    <div class="exam-notice">
      <p class="exam-notice__title">注意事项：</p>
      <p class="exam-notice__item"><span class="exam-notice__num">1.</span> 答卷前，考生务必将自己的姓名、准考证号填写在答题卡上。用 2B 铅笔将试卷类型填涂在答题卡相应位置上，将条形码横贴在答题卡右上角"条形码粘贴处"。</p>
      <p class="exam-notice__item"><span class="exam-notice__num">2.</span> 作答选择题时，选出每小题答案后，用 2B 铅笔在答题卡上对应题目选项的答案信息点涂黑；如需改动，用橡皮擦干净后，再选涂其他答案。答案不能答在试卷上。写在试卷、草稿纸和答题卡上的非答题区域均无效。</p>
      <p class="exam-notice__item"><span class="exam-notice__num">3.</span> 非选择题必须用黑色字迹的钢笔或签字笔作答，答案必须写在答题卡各题目指定区域内相应位置上；如需改动，先划掉原来的答案，然后再写上新答案；不准使用铅笔和涂改液。不按以上要求作答无效。</p>
      <p class="exam-notice__item"><span class="exam-notice__num">4.</span> 考生必须保持答题卡的整洁。考试结束后，将试卷和答题卡一并交回。</p>
    </div>

    <div style="text-align: center; margin-top: 40px;">
      <button class="btn btn--primary" @click="store.startExam()">
        <span class="btn__check">[&#8201;<span class="btn__fill">■</span>&#8201;]</span> 开 始 答 题
      </button>
    </div>

    <PageFooter :page="1" :total="22" />
  </div>
</template>

<script setup>
import { useExamStore } from '../stores/exam'
import ExamHeader from '../components/ExamHeader.vue'
import PageFooter from '../components/PageFooter.vue'

const store = useExamStore()
</script>
