import { createRouter, createWebHistory } from 'vue-router'
import Layout from '../views/Layout.vue'

const routes = [
  { path: '/login', component: () => import('../views/Login.vue'), meta: { title: '登录' } },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', component: () => import('../views/Dashboard.vue'), meta: { title: '数据概览' } },
      { path: 'banners', component: () => import('../views/Banners.vue'), meta: { title: '轮播公告' } },
      { path: 'news', component: () => import('../views/News.vue'), meta: { title: '农业资讯' } },
      { path: 'diseases', component: () => import('../views/Diseases.vue'), meta: { title: '官方病害库' } },
      { path: 'posts', component: () => import('../views/Posts.vue'), meta: { title: '社区审核' } },
      { path: 'users', component: () => import('../views/Users.vue'), meta: { title: '用户管理' } }
    ]
  }
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to) => {
  if (to.path !== '/login' && !localStorage.getItem('admin_token')) {
    return '/login'
  }
})

router.afterEach((to) => {
  const base = '云农智诊'
  if (to.path === '/login') {
    document.title = `${base} - 管理员登录`
  } else if (to.meta?.title) {
    document.title = `${base} - ${to.meta.title}`
  } else {
    document.title = `${base} - 管理后台`
  }
})

export default router
