<template>
  <router-view />
</template>

<script setup lang="ts"></script>

<style>
:root {
  --color-primary: #1677ff;
  --color-primary-dark: #0958d9;
  --color-primary-light: #69b1ff;
  --color-bg-sidebar: #1a1b26;
  --color-bg-dark: #1a1b26;
  --color-bg-page: #f7f9fc;
  --color-text-primary: #1f2329;
  --color-text-regular: #646a73;
  --color-text-secondary: #8f959e;
  --color-border: #ebeef5;
  --card-radius: 16px;
  --card-shadow: 0 8px 24px rgba(149, 157, 165, 0.1);
  --card-shadow-hover: 0 16px 36px rgba(149, 157, 165, 0.22);
  --transition: 0.25s ease;
  --el-color-primary: #1677ff;
}

html,
body,
#app {
  height: 100%;
}
</style>
