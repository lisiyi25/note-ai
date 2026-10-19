<template>
  <div class="page-container">
    <div class="card panel">
      <h2>内容审核</h2>
      <p class="desc">管理员专属页面（Mock）。待审核笔记列表。</p>
      <el-table :data="rows" stripe>
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="author" label="作者" width="120" />
        <el-table-column prop="status" label="状态" width="120" />
        <el-table-column label="操作" width="180">
          <template #default>
            <el-button link type="success">通过</el-button>
            <el-button link type="danger">驳回</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
const rows = [
  { title: '红黑树核心思想解读', author: 'Cindy', status: '待审核' },
  { title: '动态规划经典例题精讲', author: 'David', status: '待审核' },
]
</script>

<style scoped lang="scss">
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
</style>
