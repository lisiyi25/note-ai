<template>
  <el-container class="main-layout">
    <el-header class="layout-header" height="60px">
      <div class="logo" @click="goHome">
        <div class="logo-mark">N</div>
        <div class="logo-text">
          <span class="brand">NoteAI</span>
          <span class="sub">智能知识笔记</span>
        </div>
      </div>

      <div class="header-actions">
        <el-dropdown trigger="click" @command="switchRole">
          <el-button plain class="role-switch">
            <el-icon><UserFilled /></el-icon>
            {{ roleLabel }}
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="student" :disabled="userStore.role === 'student'">
                切换为学生
              </el-dropdown-item>
              <el-dropdown-item command="admin" :disabled="userStore.role === 'admin'">
                切换为管理员
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <button
          v-if="userStore.role === 'student'"
          class="write-btn"
          type="button"
          @click="router.push('/editor')"
        >
          <el-icon><EditPen /></el-icon>
          写笔记
        </button>

        <el-dropdown trigger="click" @command="handleCommand">
          <div class="user-entry">
            <el-avatar :size="36" :src="userStore.avatar" />
            <span class="nickname">{{ userStore.nickname }}</span>
            <el-icon><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-if="userStore.role === 'student'" command="my">
                我的笔记
              </el-dropdown-item>
              <el-dropdown-item v-if="userStore.role === 'student'" command="editor">
                写笔记
              </el-dropdown-item>
              <el-dropdown-item
                command="logout"
                :divided="userStore.role === 'student'"
              >
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <el-container class="body">
      <el-aside width="228px" class="layout-aside">
        <div class="role-badge">
          {{ userStore.role === 'admin' ? 'ADMIN' : 'STUDENT' }}
        </div>
        <el-menu
          :key="userStore.role"
          :default-active="activeMenu"
          router
          class="side-menu"
          background-color="transparent"
          text-color="rgba(255,255,255,0.72)"
          active-text-color="#ffffff"
        >
          <el-menu-item v-for="item in currentMenus" :key="item.path" :index="item.path">
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.title }}</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>

    <AiAgent v-if="userStore.role === 'student'" />
  </el-container>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowDown,
  DataAnalysis,
  DocumentChecked,
  EditPen,
  Grid,
  Notebook,
  Share,
  User,
  UserFilled,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { UserRole } from '@/api/auth'
import { useUserStore } from '@/store/user'
import AiAgent from '@/components/AiAgent.vue'

interface MenuItem {
  path: string
  title: string
  icon: Component
}

/** 学生菜单 */
const studentMenus: MenuItem[] = [
  { path: '/home', title: '笔记广场', icon: Grid },
  { path: '/my-notes', title: '我的笔记', icon: Notebook },
  { path: '/graph', title: '知识图谱', icon: Share },
]

/** 管理员菜单 */
const adminMenus: MenuItem[] = [
  { path: '/admin/users', title: '用户管理', icon: User },
  { path: '/admin/review', title: '内容审核', icon: DocumentChecked },
  { path: '/admin/dashboard', title: '数据看板', icon: DataAnalysis },
]

/** 学生端页面（管理员不应停留） */
const STUDENT_PATH_PREFIXES = ['/home', '/my-notes', '/graph', '/editor', '/note']

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const roleLabel = computed(() => (userStore.role === 'admin' ? '管理员' : '学生'))

/** 根据角色动态返回菜单 */
const currentMenus = computed<MenuItem[]>(() =>
  userStore.role === 'admin' ? adminMenus : studentMenus,
)

const activeMenu = computed(() => {
  if (userStore.role === 'admin') {
    if (route.path.startsWith('/admin')) return route.path
    return '/admin/dashboard'
  }
  if (route.path.startsWith('/note')) return '/home'
  if (route.path.startsWith('/editor')) return '/my-notes'
  return route.path
})

function isStudentPage(path: string) {
  return STUDENT_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  )
}

function goHome() {
  router.push(userStore.role === 'admin' ? '/admin/dashboard' : '/home')
}

function switchRole(next: string) {
  const role = next as UserRole
  userStore.setRole(role)
  ElMessage.success(`已切换为${role === 'admin' ? '管理员' : '学生'}身份`)

  if (role === 'admin') {
    // 切到管理员：若在笔记广场等学生页，强制去数据看板
    if (isStudentPage(route.path) || route.path === '/') {
      router.push('/admin/dashboard')
    }
    return
  }

  // 切回学生：离开管理页
  if (route.path.startsWith('/admin')) {
    router.push('/home')
  }
}

async function handleCommand(cmd: string) {
  if (cmd === 'my') router.push('/my-notes')
  if (cmd === 'editor') router.push('/editor')
  if (cmd === 'logout') {
    await ElMessageBox.confirm('确定退出登录吗？', '提示', { type: 'warning' })
    userStore.logout()
    router.push('/login')
  }
}
</script>

<style scoped lang="scss">
.main-layout {
  height: 100%;
  background: $bg-page;
}

.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  z-index: 10;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;

  .logo-mark {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, #69b1ff, #0958d9);
    color: #fff;
    font-weight: 700;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .logo-text {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
  }

  .brand {
    font-size: 18px;
    font-weight: 700;
    color: $text-primary;
  }

  .sub {
    font-size: 12px;
    color: $text-secondary;
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.role-switch {
  border-radius: 999px;
}

.write-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 16px;
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: linear-gradient(120deg, #69b1ff 0%, #1677ff 45%, #0958d9 100%);
  box-shadow: 0 4px 12px rgba(22, 119, 255, 0.25);
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-2px) scale(1.03);
    box-shadow: 0 10px 24px rgba(22, 119, 255, 0.38);
  }
}

.user-entry {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 20px;
  transition: background var(--transition);

  &:hover {
    background: #f0f2f5;
  }

  .nickname {
    font-size: 14px;
    color: $text-regular;
  }
}

.body {
  height: calc(100% - 60px);
}

.layout-aside {
  position: relative;
  overflow: hidden;
  background: rgba(26, 27, 38, 0.92);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-right: 1px solid rgba(255, 255, 255, 0.06);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 20% 10%, rgba(22, 119, 255, 0.18), transparent 40%),
      linear-gradient(180deg, #1a1b26 0%, #151621 100%);
    z-index: 0;
  }
}

.role-badge {
  position: relative;
  z-index: 1;
  margin: 16px 18px 4px;
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.75);
  background: rgba(22, 119, 255, 0.18);
  border: 1px solid rgba(22, 119, 255, 0.35);
}

.side-menu {
  position: relative;
  z-index: 1;
  border-right: none;
  height: calc(100% - 48px);
  padding: 10px 0 18px;
  background: transparent !important;

  :deep(.el-menu-item) {
    position: relative;
    margin: 10px 14px;
    border-radius: 12px;
    height: 46px;
    line-height: 46px;
    overflow: hidden;
    transition:
      background 0.25s ease,
      color 0.25s ease,
      transform 0.25s ease;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 10px;
      bottom: 10px;
      width: 3px;
      border-radius: 0 3px 3px 0;
      background: transparent;
      box-shadow: none;
      transition: all 0.25s ease;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.06) !important;
    }

    &.is-active {
      background: rgba(22, 119, 255, 0.18) !important;
      color: #fff !important;

      &::before {
        background: #1677ff;
        box-shadow: 0 0 10px rgba(22, 119, 255, 0.85);
      }
    }
  }
}

.layout-main {
  padding: 0;
  overflow: auto;
  background: #f7f9fc;
}
</style>
