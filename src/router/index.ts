import { watch } from 'vue';
import { createRouter, createWebHistory, type RouteLocationNormalizedLoaded, type RouteRecordRaw } from 'vue-router';
import { site } from '@/config/site';
import { messages, type Messages } from '@/i18n';

declare module 'vue-router' {
  interface RouteMeta {
    /** Key of the browser tab title in the `titles` texts; the site name is appended. */
    title?: keyof Messages['titles'];
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
    meta: { title: 'projects' },
  },
  {
    path: '/status',
    name: 'status',
    component: () => import('@/views/StatusView.vue'),
    meta: { title: 'status' },
  },
  {
    path: '/guestbook',
    name: 'guestbook',
    component: () => import('@/views/GuestbookView.vue'),
    meta: { title: 'guestbook' },
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/views/AboutView.vue'),
    meta: { title: 'about' },
  },

  // Addresses used by earlier versions of the site.
  { path: '/main', redirect: '/' },
  { path: '/opensource-projects', redirect: '/projects' },
  { path: '/server-info', redirect: '/status' },

  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: 'notFound' },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition ?? { top: 0 };
  },
});

function applyTitle(route: RouteLocationNormalizedLoaded) {
  const key = route.meta.title;
  document.title = key ? `${messages.value.titles[key]} · ${site.name}` : site.name;
}

router.afterEach(applyTitle);
// The title follows the language, too.
watch(messages, () => applyTitle(router.currentRoute.value));

export default router;
