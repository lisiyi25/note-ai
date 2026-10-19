import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo, UserRole } from '@/api/auth'

const ROLE_KEY = 'userRole'

function readStoredRole(): UserRole {
  const saved = localStorage.getItem(ROLE_KEY) as UserRole | null
  if (saved === 'admin' || saved === 'student') return saved
  try {
    const raw = localStorage.getItem('userInfo')
    if (!raw) return 'student'
    const info = JSON.parse(raw) as UserInfo
    return info.role === 'admin' ? 'admin' : 'student'
  } catch {
    return 'student'
  }
}

function readStoredUser(): UserInfo | null {
  const raw = localStorage.getItem('userInfo')
  if (!raw) return null
  try {
    const info = JSON.parse(raw) as UserInfo
    return { ...info, role: readStoredRole() }
  } catch {
    return null
  }
}

export const useUserStore = defineStore('user', () => {
  /** 当前角色：初始为 student，可切换为 admin */
  const role = ref<UserRole>(readStoredRole())
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfo | null>(readStoredUser())

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => role.value === 'admin')
  const avatar = computed(
    () =>
      userInfo.value?.avatar ||
      'https://api.dicebear.com/7.x/avataaars/svg?seed=NoteAI',
  )
  const nickname = computed(() => userInfo.value?.nickname || '访客')

  function setAuth(t: string, info: UserInfo) {
    token.value = t
    userInfo.value = info
    role.value = info.role || 'student'
    localStorage.setItem('token', t)
    localStorage.setItem('userInfo', JSON.stringify(info))
    localStorage.setItem(ROLE_KEY, role.value)
  }

  /** 切换角色（演示 RBAC） */
  function setRole(next: UserRole) {
    role.value = next
    if (!userInfo.value) {
      userInfo.value = {
        id: 'demo',
        username: 'demo',
        nickname: next === 'admin' ? '管理员' : '学生',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
        role: next,
      }
    } else {
      userInfo.value = {
        ...userInfo.value,
        role: next,
        nickname:
          next === 'admin' && userInfo.value.nickname === '学生'
            ? '管理员'
            : next === 'student' && userInfo.value.nickname === '管理员'
              ? '学生'
              : userInfo.value.nickname,
      }
    }
    localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
    localStorage.setItem(ROLE_KEY, next)
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    role.value = 'student'
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    localStorage.removeItem(ROLE_KEY)
  }

  return {
    token,
    userInfo,
    role,
    isLoggedIn,
    isAdmin,
    avatar,
    nickname,
    setAuth,
    setRole,
    logout,
  }
})
