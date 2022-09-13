import {
  createRouter,
  createWebHistory,
} from 'vue-router';
import store from '@/store';
import { nextTick } from 'vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/main',
    },
    {
      path: '/main',
      name: 'Main',
      component: () => import('../views/MainView.vue'),
      meta: {
        title: '🏡 Welcome'
      }
    },
    {
      path: '/about',
      name: 'About',
      component: () => import('../views/AboutView.vue'),
      meta: {
        title: '👨‍💻 About Me'
      }
    },
    {
      path: '/server-info',
      name: 'ServerInfo',
      component: () => import('../views/ServerInfoView.vue'),
      meta: {
        title: '🖥︎ Server Info'
      }
    },
    {
      path: '/opensource-projects',
      name: 'OpenSourceProjects',
      component: () => import('../views/OpenSourceProjectsView.vue'),
      meta: {
        title: '🚀 OpenSource Projects'
      }
    },
  ],
});

router.afterEach((to, from) => {
  const title = (to.meta?.title ? to.meta.title : 'Kimhwan.kr') as string;

  nextTick((): any => {
    document.title = title;
  });
});

export default router;