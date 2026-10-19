<template>
  <div class="login-page">
    <div class="login-shell">
      <section class="hero-pane">
        <div class="grid-glow"></div>
        <div class="glass">
          <div class="orb orb-a"></div>
          <div class="orb orb-b"></div>
          <div class="hero-copy">
            <p class="eyebrow">Knowledge · AI · Notes</p>
            <h1>NoteAI</h1>
            <p class="desc">
              极简科技风知识笔记平台。沉淀灵感、AI 总结、图谱连结，一站完成。
            </p>
            <ul class="features">
              <li>Markdown 沉浸式写作</li>
              <li>AI 一键总结与智能检索</li>
              <li>知识节点可视化探索</li>
            </ul>
          </div>
        </div>
      </section>

      <section class="form-pane">
        <div class="form-card">
          <h2>{{ isRegister ? '创建账号' : '欢迎回来' }}</h2>
          <p class="tip">{{ isRegister ? '注册后即可开启智能笔记之旅' : '登录以同步你的知识库' }}</p>

          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            class="underline-form"
            size="large"
            @keyup.enter="handleSubmit"
          >
            <el-form-item prop="username">
              <el-input
                v-model="form.username"
                placeholder="账号"
                :prefix-icon="User"
                clearable
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="form.password"
                type="password"
                placeholder="密码"
                show-password
                :prefix-icon="Lock"
              />
            </el-form-item>
            <el-form-item v-if="isRegister" prop="nickname">
              <el-input v-model="form.nickname" placeholder="昵称（可选）" :prefix-icon="Avatar" />
            </el-form-item>

            <button
              type="button"
              class="gradient-btn"
              :class="{ loading }"
              :disabled="loading"
              @click="handleSubmit"
            >
              <span v-if="loading" class="spinner"></span>
              <span>{{ loading ? '登录中…' : isRegister ? '注册并登录' : '登录' }}</span>
            </button>
          </el-form>

          <div class="switch-row">
            <span>{{ isRegister ? '已有账号？' : '还没有账号？' }}</span>
            <el-button link type="primary" @click="toggleMode">
              {{ isRegister ? '去登录' : '去注册' }}
            </el-button>
          </div>
          <p class="hint">演示提示：账号含 admin 可直接以管理员身份登录</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Avatar, Lock, User } from '@element-plus/icons-vue'
import { loginApi, registerApi } from '@/api/auth'
import { useUserStore } from '@/store/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const isRegister = ref(false)
const loading = ref(false)
const formRef = ref<FormInstance>()

const form = reactive({
  username: '',
  password: '',
  nickname: '',
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 3, message: '账号至少 3 位', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
}

function toggleMode() {
  isRegister.value = !isRegister.value
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate()
  loading.value = true
  try {
    const res = isRegister.value
      ? await registerApi({
          username: form.username,
          password: form.password,
          nickname: form.nickname,
        })
      : await loginApi({ username: form.username, password: form.password })

    userStore.setAuth(res.data.token, res.data.userInfo)
    ElMessage.success(isRegister.value ? '注册成功' : '登录成功')
    const fallback = res.data.userInfo.role === 'admin' ? '/admin/dashboard' : '/home'
    const redirect = (route.query.redirect as string) || fallback
    router.replace(redirect)
  } catch (e) {
    ElMessage.error((e as Error).message || '操作失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(145deg, #eef3f9 0%, #f5f7fa 50%, #e8eef8 100%);
}

.login-shell {
  width: min(1080px, 100%);
  min-height: 580px;
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.16);
  background: #fff;
}

.hero-pane {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 20% 20%, rgba(22, 119, 255, 0.35), transparent 45%),
    radial-gradient(ellipse at 80% 70%, rgba(124, 58, 237, 0.28), transparent 50%),
    linear-gradient(160deg, #0b1224 0%, #0f172a 45%, #13233f 100%);
}

.grid-glow {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 36px 36px;
  mask-image: radial-gradient(circle at 40% 40%, #000 20%, transparent 75%);
  animation: grid-drift 18s linear infinite;
}

.glass {
  position: absolute;
  inset: 28px;
  border-radius: 18px;
  backdrop-filter: blur(20px) saturate(1.2);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15);
  overflow: hidden;
  padding: 40px 36px;
  color: #fff;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(2px);
  opacity: 0.5;
}

.orb-a {
  width: 180px;
  height: 180px;
  background: #1677ff;
  top: -50px;
  right: -30px;
  animation: float 8s ease-in-out infinite;
}

.orb-b {
  width: 120px;
  height: 120px;
  background: #7c3aed;
  bottom: 50px;
  left: 24px;
  animation: float 10s ease-in-out infinite reverse;
}

.hero-copy {
  position: relative;
  z-index: 1;
  max-width: 360px;
}

.eyebrow {
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-size: 12px;
  opacity: 0.75;
  margin-bottom: 12px;
}

h1 {
  font-size: 46px;
  font-weight: 800;
  letter-spacing: 0.02em;
  margin-bottom: 16px;
}

.desc {
  font-size: 15px;
  line-height: 1.7;
  opacity: 0.9;
  margin-bottom: 28px;
}

.features {
  display: grid;
  gap: 10px;

  li {
    padding: 10px 14px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.16);
    font-size: 14px;
    transition: background var(--transition), transform var(--transition);

    &:hover {
      background: rgba(255, 255, 255, 0.16);
      transform: translateX(4px);
    }
  }
}

.form-pane {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 32px;
  background: #fff;
}

.form-card {
  width: min(360px, 100%);

  h2 {
    font-size: 28px;
    margin-bottom: 8px;
    color: var(--color-text-primary);
  }

  .tip {
    color: var(--color-text-secondary);
    margin-bottom: 28px;
    font-size: 14px;
  }
}

.underline-form {
  :deep(.el-form-item) {
    margin-bottom: 22px;
  }

  :deep(.el-input__wrapper) {
    box-shadow: none !important;
    border-radius: 0;
    background: transparent;
    border-bottom: 1.5px solid #e5e6eb;
    padding-left: 0;
    transition: border-color var(--transition) !important;
  }

  :deep(.el-input__wrapper:hover),
  :deep(.el-input__wrapper.is-focus) {
    border-bottom-color: var(--color-primary);
    box-shadow: none !important;
  }

  :deep(.el-input__inner) {
    height: 42px;
  }
}

.gradient-btn {
  width: 100%;
  height: 46px;
  margin-top: 8px;
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: linear-gradient(120deg, #1677ff 0%, #6d28d9 100%);
  background-size: 160% 160%;
  box-shadow: 0 8px 20px rgba(22, 119, 255, 0.28);
  transition:
    transform var(--transition),
    box-shadow var(--transition),
    background-position 0.4s ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    background-position: 100% 50%;
    box-shadow: 0 12px 28px rgba(109, 40, 217, 0.3);
  }

  &:disabled {
    cursor: wait;
    opacity: 0.85;
  }

  &.loading {
    animation: btn-pulse 1.2s ease-in-out infinite;
  }
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.switch-row {
  margin-top: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.hint {
  margin-top: 12px;
  text-align: center;
  font-size: 12px;
  color: var(--color-text-secondary);
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-14px);
  }
}

@keyframes grid-drift {
  from {
    transform: translate(0, 0);
  }
  to {
    transform: translate(36px, 36px);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes btn-pulse {
  0%,
  100% {
    box-shadow: 0 8px 20px rgba(22, 119, 255, 0.28);
  }
  50% {
    box-shadow: 0 8px 28px rgba(109, 40, 217, 0.45);
  }
}

@media (max-width: 860px) {
  .login-shell {
    grid-template-columns: 1fr;
  }

  .hero-pane {
    min-height: 240px;
  }
}
</style>
