import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { site } from '@/config/site';

declare module 'vue-router' {
  interface RouteMeta {
    /** Browser tab title; the site name is appended. */
    title?: string;
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/projects',
    name: 'projects',
    component: () => import('@/views/ProjectsView.vue'),
    meta: { title: 'Projects' },
  },
  {
    path: '/status',
    name: 'status',
    component: () => import('@/views/StatusView.vue'),
    meta: { title: 'Server Status' },
  },
  {
    path: '/guestbook',
    name: 'guestbook',
    component: () => import('@/views/GuestbookView.vue'),
    meta: { title: 'Guestbook' },
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/views/AboutView.vue'),
    meta: { title: 'About' },
  },

  // Addresses used by earlier versions of the site.
  { path: '/main', redirect: '/' },
  { path: '/opensource-projects', redirect: '/projects' },
  { path: '/server-info', redirect: '/status' },

  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: 'Page not found' },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition ?? { top: 0 };
  },
});

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · ${site.name}` : site.name;
});

export default router;
