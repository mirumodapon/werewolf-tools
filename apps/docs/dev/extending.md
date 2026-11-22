# 新增角色、板子、翻譯

## 新增板子

在 `packages/werewolf-rules/src/boards.ts` 的 `BUILTIN_BOARDS` 加一筆：

```ts
builtin({
  players: 12,
  slug: 'wolf-king-crow',
  name: { 'zh-TW': '狼王烏鴉', 'en-US': 'Wolf King · Crow' },
  roles: { werewolf: 3, wolfKing: 1, seer: 1, witch: 1, hunter: 1, crow: 1, villager: 4 },
  // rules: SMALL_TABLE_RULES,  // 不寫就是 DEFAULT_RULES
}),
```

- `id` 會是 `b<人數>-<slug>`，發佈後不要改（設定與紀錄用它找板子）。
- 新板子一律從「未驗證」開始（不寫 `verified`）。
- `pnpm test` 會檢查每個內建板子都通過配置檢查、人數與 id 一致；使用說明的[內建板子](/rules/builtin-boards)自動更新。

## 新增角色

1. `packages/werewolf-rules/src/roles.ts`：在 `ROLE_IDS` **最後面**加上 id（分享連結依這個順序編碼，不能插在中間），並在 `ROLES` 設定陣營、是否唯一、是否需要大桌（`complex`）。
2. `packages/i18n/src/messages/zh-TW.ts` 與 `en-US.ts`：`roles.<id>.name` 與 `roles.<id>.desc`。
3. `packages/ui/src/roleIcons.ts`：選一個 Tabler 圖示（完整 class 名稱，例如 `i-tabler-moon`）。
4. 若有視野（例如新的狼）：`vision.ts`。
5. 若有夜晚行動或白天技能：法官規則引擎（`judge/types.ts` 的步驟與事件、`engine.ts` 的 `nightPlan` 與套用邏輯）、法官輔助的 `StepPanel.vue` 與台詞（`apps/judge/src/locales`），並在 `engine.test.ts` 加情境測試。
6. 更新使用說明的[角色](/rules/roles)補充說明（表格會自動更新）與[夜晚順序](/rules/night-order)。

## 新增法官輔助的進階設定

進階設定是每一局開始前選擇、依板子角色出現的選項：

1. `packages/werewolf-rules/src/judge/options.ts`：在 `OPTION_IDS` 加 id，在 `ADVANCED_OPTIONS` 加一筆（`roles`：板子有其中任一角色才顯示；`default`：預設值）。
2. 規則引擎用 `resolveOptions(state.setup.options).<id>` 讀取，並在 `engine.test.ts` 補情境測試。
3. `apps/judge/src/locales/*.ts` 的 `options.items.<id>.label` 與 `hint`。
4. 更新本說明的[法官輔助](/guide/judge#進階設定)表格。

## 翻譯

- 共用文案：`packages/i18n/src/messages/`；各工具：`apps/<id>/src/locales/`。
- `zh-TW.ts` 是基準，`en-US.ts` 以 `satisfies Shape<typeof zhTW>` 檢查型別。
- `pnpm lint` 的 `check-i18n` 確認兩種語言 key 完全一致、沒有空字串，且每個角色都有名稱與簡述。
- 繁中使用台灣用語。
