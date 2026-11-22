# 架構與指令

pnpm workspace monorepo，建置工具 Vite+（`vp`），Vue 3 + Pinia + UnoCSS（Tokyo Night），vue-i18n（繁中預設、英文），每個工具一個 PWA，部署在 GitHub Pages 的網域根目錄。

```
apps/home/               首頁（/）
apps/deal/               角色發牌（/deal/）
apps/judge/              法官輔助（/judge/）
apps/docs/               使用說明（/docs/，VitePress，不是 PWA）
packages/werewolf-rules/ 純 TS：角色、陣營、視野、板子與板子設定、配置檢查、法官規則引擎
packages/boards/         自訂板子（全域共用）、板子連結與發牌交接格式、板子相關元件
packages/registry/       工具清單（唯一來源）
packages/storage/        localStorage 命名空間、版本與遷移、亂數與 id
packages/share/          分享連結：deflate-raw + base64url
packages/theme/          Tokyo Night → CSS 變數、UnoCSS preset、防閃爍腳本
packages/i18n/           vue-i18n、共用文案（角色名稱與能力）
packages/ui/             AppShell、Sheet、SeatPicker、ShareSheet、主題／語言、更新
packages/pwa/            PWA 設定、快取清理、圖示產生、版本
packages/licenses/       第三方授權 licenses.txt
packages/tsconfig/       共用 tsconfig
scripts/                 dev、build-all、preview、new-app、各項檢查
```

- 各 app **互不 import**（`scripts/check-boundaries.ts`）；`werewolf-rules` 不能依賴 Vue、DOM 或儲存。
- 工具清單只在 `packages/registry/src/tools.ts`；首頁卡片、manifest、service worker 的 scope 與 denylist、build、dev proxy 都由它產生。
- 整個 repo 一個版本號（根目錄 `package.json`，第一版正式上線前一律 `0.0.x`），建置時注入 `<version>-<git rev>`。
- 外部依賴版本只寫在 `pnpm-workspace.yaml` 的 catalog。

## 指令

需要 Node 24+ 與 pnpm 12。

```sh
pnpm install
pnpm dev              # 所有 app，同源 proxy 在 http://localhost:5173/
pnpm dev --filter judge --filter deal   # 只啟動指定的 app（仍走同一個 proxy）
pnpm dev:home         # 單獨啟動一個 app 的 dev server（也有 dev:deal、dev:judge、dev:docs）
pnpm build            # 建置全部並組合到 dist/
pnpm preview          # 以 GitHub Pages 的規則提供 dist/
pnpm lint             # oxlint + catalog、邊界、版本、i18n 檢查
pnpm format           # oxfmt
pnpm typecheck        # vue-tsc
pnpm test             # vitest
pnpm icons [id...]    # 由 registry 產生 PWA 圖示
pnpm new:app <id> --name 名稱 --name-en Name --icon tabler-icon --accent blue
```

每個 app 都有自己的 `dev`、`build`、`preview` script，也可以在 app 目錄執行 `pnpm dev`。單獨啟動時跨工具的連結（例如回到首頁、交給法官輔助）會指向沒有啟動的 app，要測試跨工具流程請用 `pnpm dev`。

## 法官規則引擎

`packages/werewolf-rules/src/judge/`：

- `types.ts`：遊戲設定、玩家、輸入事件（`GameEvent`）、時間軸（`LogEntry`）、目前步驟（`Step`）。
- `engine.ts`：`nightPlan`（當晚呼叫順序）、`nextStep`（下一步要做什麼）、`applyEvent`（套用一筆輸入）、夜晚結算、白天的開槍與警徽、勝負判定。
- `derive.ts`：`deriveGame(setup, events)` 從頭重播所有輸入。遊戲紀錄只存設定與輸入，其他都是推導出來的，所以「復原上一步」就是刪掉最後一筆輸入。

規則改動一定要在 `engine.test.ts` 補上情境測試。
