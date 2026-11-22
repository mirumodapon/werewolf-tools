import { createRouter, createWebHashHistory, type Router } from 'vue-router'

/** Hash routes, so home's service worker answers every page offline. */
export function createHomeRouter(history = createWebHashHistory()): Router {
  return createRouter({
    history,
    routes: [
      { path: '/', component: () => import('./pages/ToolsPage.vue') },
      { path: '/info', component: () => import('./pages/InfoPage.vue') },
      { path: '/:pathMatch(.*)*', redirect: '/' },
    ],
  })
}
