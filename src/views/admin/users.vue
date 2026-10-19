<template>
  <div class="page-container">
    <div class="card panel">
      <h2>用户管理</h2>
      <p class="desc">管理员专属页面（Mock）。可在此查看与管理平台用户。</p>
      <el-table :data="users" stripe>
        <el-table-column prop="id" label="ID" width="100" />
        <el-table-column prop="nickname" label="昵称" />
        <el-table-column prop="role" label="角色" width="120" />
        <el-table-column prop="status" label="状态" width="120" />
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
const users = [
  { id: 'u1001', nickname: 'Alice', role: '学生', status: '正常' },
  { id: 'u1002', nickname: 'Bob', role: '学生', status: '正常' },
  { id: 'u1003', nickname: 'Admin', role: '管理员', status: '正常' },
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
