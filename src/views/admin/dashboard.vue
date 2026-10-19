<template>
  <div class="page-container">
    <div class="stats">
      <div v-for="item in cards" :key="item.label" class="card stat-card">
        <p class="label">{{ item.label }}</p>
        <p class="value">{{ item.value }}</p>
      </div>
    </div>
    <div class="card panel">
      <h2>数据看板</h2>
      <p class="desc">管理员专属页面（Mock）。展示平台核心运营指标。</p>
      <el-empty description="后续可接入 ECharts 趋势图" />
    </div>
  </div>
</template>

<script setup lang="ts">
const cards = [
  { label: '总用户', value: '1,286' },
  { label: '笔记总数', value: '5,420' },
  { label: '今日新增', value: '37' },
  { label: '待审核', value: '12' },
]
</script>

<style scoped lang="scss">
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  padding: 18px 20px;

  .label {
    color: var(--color-text-secondary);
    font-size: 13px;
    margin-bottom: 8px;
  }

  .value {
    font-size: 28px;
    font-weight: 700;
    color: var(--color-primary);
  }
}

.panel {
  padding: 20px 24px;
}

h2 {
  margin-bottom: 8px;
}

.desc {
  color: var(--color-text-secondary);
  margin-bottom: 16px;
  font-size: 14px;
}

@media (max-width: 900px) {
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
