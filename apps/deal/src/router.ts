import { BOARD_PARAM } from '@werewolf/boards'
import { takeQueryParam } from '@werewolf/share'
import { createRouter, createWebHashHistory, type Router } from 'vue-router'

/** Hash routes under `/deal/`, so the service worker's app shell answers every page offline. */
export function createDealRouter(history = createWebHashHistory()): Router {
  const query = (name: string) => (r: { query: Record<string, unknown> }) =>
    typeof r.query[name] === 'string' ? (r.query[name] as string) : undefined
  return createRouter({
    history,
    routes: [
      { path: '/', component: () => import('./pages/SetupPage.vue') },
      { path: '/deal', component: () => import('./pages/DealPage.vue') },
      { path: '/history', component: () => import('./pages/HistoryPage.vue') },
      { path: '/history/:id', component: () => import('./pages/RecordPage.vue'), props: true },
      {
        path: '/boards/new',
        component: () => import('./pages/BoardEditPage.vue'),
        props: (r) => ({ from: query('from')(r) }),
      },
      { path: '/boards/:id', component: () => import('./pages/BoardEditPage.vue'), props: true },
      {
        path: '/import',
        component: () => import('./pages/ImportPage.vue'),
        props: (r) => ({ payload: query('b')(r) }),
      },
      { path: '/:pathMatch(.*)*', redirect: '/' },
    ],
  })
}

/** A shared board arrives as `/deal/?b=…`: the route that previews it. */
export function sharedBoardRoute(): string | null {
  const payload = takeQueryParam(BOARD_PARAM)
  return payload ? `/import?${new URLSearchParams({ b: payload })}` : null
}
