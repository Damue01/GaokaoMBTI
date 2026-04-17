<template>
  <div class="page-footer">
    <template v-if="answered !== undefined">
      人格综合　已完成 {{ answered }}/{{ total }}
    </template>
    <template v-else>
      人格综合　第 {{ page }} 页（共 {{ total }} 页）
    </template>
  </div>
</template>

<script setup>
defineProps({
  page: { type: Number, default: 1 },
  total: { type: Number, default: 22 },
  answered: { type: Number, default: undefined }
})
</script>
