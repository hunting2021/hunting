import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import(/* webpackChunkName: "home" */ '@/views/index.vue')
  },
  {
    path: '/assets',
    name: 'assets',
    component: () => import( '@/views/assets.vue')
  },
  {
    path: '/history',
    name: 'history',
    component: () => import( '@/views/history.vue')
  },
  {
    path: '/tokenTop',
    name: 'tokenTop',
    component: () => import( '@/views/token.vue')
  },
  {
    path: '/force',
    name: 'force',
    component: () => import( '@/views/force.vue')
  },
  {
    path: '/approves',
    name: 'approves',
    component: () => import( '@/views/approves.vue')
  }
]

const router = new VueRouter({
  mode: 'history',
  routes
})

export default router
