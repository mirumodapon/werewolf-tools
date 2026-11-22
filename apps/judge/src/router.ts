import {
  BOARD_PARAM,
  decodeBoard,
  decodeHandoff,
  HANDOFF_PARAM,
  type Handoff,
} from '@werewolf/boards'
import { takeQueryParam } from '@werewolf/share'
import { createRouter, createWebHashHistory, type Router } from 'vue-router'
import { GAME_PARAM } from './games/transfer.ts'

/** Handed over from the deal tool, kept until the setup page reads it. */
let pendingHandoff: Handoff | null = null

/** Hash routes under `/judge/`, so the app shell answers every page offline. */
export function createJudgeRouter(history = createWebHashHistory()): Router {
  return createRouter({
    history,
    routes: [
      { path: '/', component: () => import('./pages/ListPage.vue') },
      {
        path: '/new',
        component: () => import('./pages/SetupPage.vue'),
        props: () => {
          const handoff = pendingHandoff
          pendingHandoff = null
          return { handoff }
        },
      },
      { path: '/play/:id', component: () => import('./pages/PlayPage.vue'), props: true },
      { path: '/games/:id', component: () => import('./pages/DetailPage.vue'), props: true },
      {
        path: '/import',
        component: () => import('./pages/ImportPage.vue'),
        props: (r) => ({ payload: typeof r.query.s === 'string' ? r.query.s : undefined }),
      },
      { path: '/:pathMatch(.*)*', redirect: '/' },
    ],
  })
}

/**
 * Links that open the app: a game (`?s=`), a deal handed over (`?t=`), or a board
 * (`?b=`, set up a game with it). Returns the route to open.
 */
export async function incomingRoute(): Promise<string | null> {
  const game = takeQueryParam(GAME_PARAM)
  if (game) return `/import?${new URLSearchParams({ s: game })}`
  const handoff = takeQueryParam(HANDOFF_PARAM)
  if (handoff) {
    try {
      pendingHandoff = await decodeHandoff(handoff)
      return '/new'
    } catch {
      return null
    }
  }
  const board = takeQueryParam(BOARD_PARAM)
  if (board) {
    try {
      const b = await decodeBoard(board)
      pendingHandoff = {
        boardId: null,
        boardName: b.name,
        roles: b.roles,
        rules: b.rules,
        table: [],
      }
      return '/new'
    } catch {
      return null
    }
  }
  return null
}

/** Tests hand a deal over without a URL. */
export function setPendingHandoff(h: Handoff | null): void {
  pendingHandoff = h
}
