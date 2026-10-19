import { createRouter, createWebHashHistory } from 'vue-router'

const STUDENT_PATH_PREFIXES = ['/home', '/my-notes', '/graph', '/editor', '/note']

function getRole() {
  return localStorage.getItem('userRole') || 'student'
}

function isStudentPage(path: string) {
  return STUDENT_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  )
}

const router = createRouter({
  // Hash 模式便于部署到 GitHub Pages（无需服务端回退）
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login/index.vue'),
      meta: { title: '登录', public: true },
    },
    {
      path: '/',
      component: () => import('@/layout/MainLayout.vue'),
      redirect: () => (getRole() === 'admin' ? '/admin/dashboard' : '/home'),
      children: [
        {
          path: 'home',
          name: 'Home',
          component: () => import('@/views/home/index.vue'),
          meta: { title: '笔记广场', roles: ['student'] },
        },
        {
          path: 'my-notes',
          name: 'MyNotes',
          component: () => import('@/views/home/index.vue'),
          meta: { title: '我的笔记', mine: true, roles: ['student'] },
        },
        {
          path: 'editor',
          name: 'Editor',
          component: () => import('@/views/editor/index.vue'),
          meta: { title: '笔记编辑', roles: ['student'] },
        },
        {
          path: 'note/:id',
          name: 'NoteDetail',
          component: () => import('@/views/note/detail.vue'),
          meta: { title: '笔记详情', roles: ['student'] },
        },
        {
          path: 'graph',
          name: 'Graph',
          component: () => import('@/views/graph/index.vue'),
          meta: { title: '知识图谱', roles: ['student'] },
        },
        {
          path: 'admin/users',
          name: 'AdminUsers',
          component: () => import('@/views/admin/users.vue'),
          meta: { title: '用户管理', roles: ['admin'] },
        },
        {
          path: 'admin/review',
          name: 'AdminReview',
          component: () => import('@/views/admin/review.vue'),
          meta: { title: '内容审核', roles: ['admin'] },
        },
        {
          path: 'admin/dashboard',
          name: 'AdminDashboard',
          component: () => import('@/views/admin/dashboard.vue'),
          meta: { title: '数据看板', roles: ['admin'] },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: () => (getRole() === 'admin' ? '/admin/dashboard' : '/home'),
    },
  ],
})

router.beforeEach((to) => {
  document.title = `${(to.meta.title as string) || 'NoteAI'} · NoteAI`
  const token = localStorage.getItem('token')
  const role = getRole()

  if (!to.meta.public && !token && to.path !== '/login') {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (to.path === '/login' && token) {
    return role === 'admin' ? '/admin/dashboard' : '/home'
  }

  // RBAC：无权限则回各自首页
  const roles = to.meta.roles as string[] | undefined
  if (roles?.length && !roles.includes(role)) {
    return role === 'admin' ? '/admin/dashboard' : '/home'
  }

  // 兜底：管理员误入学生页
  if (role === 'admin' && isStudentPage(to.path)) {
    return '/admin/dashboard'
  }

  return true
})

export default router
