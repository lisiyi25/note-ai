import { mockSuccess } from '@/utils/mock'

export type UserRole = 'student' | 'admin'

export interface LoginForm {
  username: string
  password: string
}

export interface RegisterForm {
  username: string
  password: string
  nickname?: string
}

export interface UserInfo {
  id: string
  username: string
  nickname: string
  avatar: string
  role: UserRole
}

export interface AuthResult {
  token: string
  userInfo: UserInfo
}

/** Mock 登录：用户名含 admin 则默认为管理员，否则学生 */
export async function loginApi(data: LoginForm) {
  if (!data.username || !data.password) {
    await mockSuccess(null)
    throw new Error('账号或密码不能为空')
  }
  const role: UserRole = /admin/i.test(data.username) ? 'admin' : 'student'
  return mockSuccess<AuthResult>({
    token: `mock-token-${Date.now()}`,
    userInfo: {
      id: 'u1001',
      username: data.username,
      nickname: data.username,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.username)}`,
      role,
    },
  })
}

/** Mock 注册 */
export async function registerApi(data: RegisterForm) {
  if (!data.username || !data.password) {
    throw new Error('账号或密码不能为空')
  }
  return mockSuccess<AuthResult>({
    token: `mock-token-${Date.now()}`,
    userInfo: {
      id: `u${Date.now()}`,
      username: data.username,
      nickname: data.nickname || data.username,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.username)}`,
      role: 'student',
    },
  })
}
