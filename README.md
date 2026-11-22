# 狼人殺工具集

狼人殺桌遊的輔助工具：<https://werewolf.mirumo.net/>。每個工具都是可以單獨安裝、離線使用的 PWA，手機優先。角色發牌與法官輔助目前是 **alpha**。

| 工具     | 路徑      | 說明                                                                                              |
| -------- | --------- | ------------------------------------------------------------------------------------------------- |
| 首頁     | `/`       | 工具列表、主題與語言設定、資訊頁（版本、空間用量、授權、最近 3 個版本的更新紀錄）                 |
| 角色發牌 | `/deal/`  | 選板子 → 一支手機輪流傳，長按看牌、雙擊蓋牌；法官檢視、抽發言位置、最近 10 筆紀錄、自訂板子與分享 |
| 法官輔助 | `/judge/` | 依遊戲進度提示台詞與夜晚行動，算出死訊或平安夜；遊戲紀錄、時間軸、復原、分享、匯出匯入            |
| 使用說明 | `/docs/`  | VitePress：使用方式、遊戲規則、板子設定、開發者文件、更新紀錄（不是 PWA）                         |

完整說明見 [`apps/docs`](apps/docs)（部署後在 `/docs/`），更新內容見 [CHANGELOG.md](CHANGELOG.md)。

## 功能重點

- **預設繁體中文**，可切換 English，所有工具同步；主題 Tokyo Night（系統／Night／Storm／Light）。
- **板子**：內建常見板子，也能自訂角色張數與板子設定（屠邊／屠城、女巫自救、同守同救、警長競選、遺言）。自訂板子由角色發牌與法官輔助共用，可用連結與 QR code 分享。
- **未驗證**：法官邏輯尚未經過人工驗證的板子，在選擇時標示「未驗證」。內建板子由 `packages/werewolf-rules/src/boards.ts` 的 `verified` 控制，維護者確認後改成 `true` 即移除標記；自訂板子一律未驗證。
- **狼人視野**：狼王等特殊狼會被其他狼人看到，隱狼看得到同伴但同伴看不到他。
- **交給法官**：發完牌可以把板子與座位角色以連結交給法官輔助。
- **從首頁開啟**：從首頁（或首頁安裝的 App）開啟的工具，點標題可回到首頁。

## 架構

```
apps/home/               首頁（/）
apps/deal/               角色發牌（/deal/）
apps/judge/              法官輔助（/judge/）
apps/docs/               使用說明（/docs/，VitePress）
packages/werewolf-rules/ 純 TS：角色、視野、板子、板子設定、配置檢查、法官規則引擎
packages/boards/         自訂板子（全域）、板子連結、發牌交接、板子元件
packages/registry/       工具清單（唯一來源）
packages/storage/        localStorage 命名空間與遷移、亂數與 id
packages/share/          分享連結編碼（deflate-raw + base64url）
packages/theme/          Tokyo Night → CSS 變數、UnoCSS preset、防閃爍腳本
packages/i18n/           vue-i18n、共用文案
packages/ui/             共用 Vue 元件
packages/pwa/            PWA 設定、快取清理、圖示、版本
packages/licenses/       第三方授權 licenses.txt
packages/tsconfig/       共用 tsconfig
scripts/                 dev、build-all、preview、new-app、檢查
```

技術：pnpm workspace（catalog strict）、Vite+（`vp`：dev／build／test／lint／fmt）、Vue 3 + Pinia + vue-router、UnoCSS（Wind4 + Tabler 圖示）、vue-i18n、Dexie、zod、vite-plugin-pwa、VitePress。

- 各 app 互不 import；`werewolf-rules` 不依賴 Vue／DOM（`scripts/check-boundaries.ts`）。
- 工具清單只有 `packages/registry/src/tools.ts`，首頁、manifest、service worker、build、dev proxy 都由它產生。
- 整個 repo 一個版本號（根目錄 `package.json`），正式上線前維持 `0.0.x`。
- 法官輔助的遊戲只存設定與輸入，狀態由 `deriveGame` 重播推導（`packages/werewolf-rules/src/judge/`）。

## 開發

需要 Node 24+ 與 pnpm 12。

```sh
pnpm install
pnpm dev                 # 所有 app，同源 proxy 在 http://localhost:5173/（--host 可用手機連線）
pnpm dev --filter judge  # 只啟動指定的 app（可重複）
pnpm dev:home            # 單獨跑一個 app 的 dev server；也有 dev:deal、dev:judge、dev:docs
pnpm build               # 建置全部並組合到 dist/
pnpm preview             # 以 GitHub Pages 的規則提供 dist/
pnpm lint                # oxlint、catalog、app 邊界、版本、i18n 檢查
pnpm format              # oxfmt（format:check 只檢查）
pnpm typecheck           # vue-tsc
pnpm test                # vitest
pnpm icons [id...]       # 產生 PWA 圖示
pnpm new:app <id> --name 名稱 --name-en Name [--icon tabler-name] [--accent blue]
```

每個 app 都有自己的 `dev`／`build`／`preview` script。

## 新增角色、板子、翻譯

- **板子**：在 `packages/werewolf-rules/src/boards.ts` 的 `BUILTIN_BOARDS` 加一筆（`players`、`slug`、雙語名稱、`roles`，可選 `rules`）；新板子預設未驗證。`pnpm test` 會檢查配置與人數。
- **角色**：`roles.ts` 的 `ROLE_IDS` **最後面**加 id 並設定 `ROLES`；在 `packages/i18n/src/messages/*.ts` 加 `roles.<id>.name`／`desc`；在 `packages/ui/src/roleIcons.ts` 選 Tabler 圖示；有視野改 `vision.ts`；有夜晚或白天技能則改法官規則引擎與 `apps/judge` 的步驟與台詞，並補 `engine.test.ts`。
- **翻譯**：共用文案在 `packages/i18n/src/messages/`，各工具在 `apps/<id>/src/locales/`；`zh-TW.ts` 為基準，`pnpm lint` 檢查兩種語言 key 一致。

詳見使用說明的「開發者」章節。

## 部署

推送到 `main` 後由 `.github/workflows/deploy.yml` 檢查、建置並部署到 GitHub Pages（自訂網域 `werewolf.mirumo.net`，必須在網域根目錄）。

## 授權

MIT（見 [LICENSE](LICENSE)）。建置時每個工具會產生第三方授權 `licenses.txt`。

本專案與「狼人殺」相關商標及出版商無關。
