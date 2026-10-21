import { createRouter, createWebHistory } from 'vue-router';

declare module 'vue-router' {
  interface RouteMeta {
    title?: string;
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/main',
      redirect: '/',
    },
    {
      path: '/',
      name: 'Main',
      component: () => import('@/views/MainView.vue'),
      meta: {
        title: '🏡 Welcome',
      },
    },
    {
      path: '/about',
      name: 'About',
      component: () => import('@/views/AboutView.vue'),
      meta: {
        title: '👨‍💻 About Me',
      },
    },
    {
      path: '/status',
      name: 'Status',
      component: () => import('@/views/StatusView.vue'),
      meta: {
        title: '📡 Live Status',
      },
    },
    {
      path: '/server-info',
      name: 'ServerInfo',
      component: () => import('@/views/ServerInfoView.vue'),
      meta: {
        title: '🖥︎ Server Info',
      },
    },
    {
      path: '/opensource-projects',
      name: 'OpenSourceProjects',
      component: () => import('@/views/OpenSourceProjectsView.vue'),
      meta: {
        title: '🚀 OpenSource Projects',
      },
    },
  ],
});

router.afterEach((to) => {
  document.title = to.meta.title ?? 'Kimhwan.kr';
});

export default router;
