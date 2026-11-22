# 資料與儲存

所有資料只存在瀏覽器。命名空間：`werewolf:global:*` 由所有工具共用，`werewolf:<appId>:*` 與 IndexedDB `werewolf-<appId>` 屬於各工具。localStorage 的值一律是 `{ version, data }`，可以依版本遷移。

| 資料       | 位置                                                                    |
| ---------- | ----------------------------------------------------------------------- |
| 主題       | `werewolf:global:theme`                                                 |
| 語言       | `werewolf:global:locale`（沒有選過就是繁體中文）                        |
| 自訂板子   | `werewolf:global:boards`（角色發牌與法官輔助共用）                      |
| 發牌設定   | `werewolf:deal:settings`                                                |
| 發牌紀錄   | IndexedDB `werewolf-deal`（失敗時 `werewolf:deal:records`），最多 10 筆 |
| 法官設定   | `werewolf:judge:settings`                                               |
| 遊戲紀錄   | IndexedDB `werewolf-judge`（失敗時 `werewolf:judge:games`），不設上限   |
| 從首頁開啟 | sessionStorage `werewolf:launcher`（標題回到首頁用）                    |

主題、語言與自訂板子透過 `storage` 事件同步到其他已開啟的工具。

## 連結格式

值都是精簡的 JSON 陣列（數字為主，不放欄位名稱），再編成 base64url。壓縮（deflate-raw）比較短時用壓縮並加上前綴 `z`，否則直接編碼並加上前綴 `j`（`packages/share`）。

| 參數         | 工具               | 內容                                                                                                                                  |
| ------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `/deal/?b=`  | 角色發牌、法官輔助 | 板子：`[版本 2, 名稱, 依 ROLE_IDS 順序的張數, 設定]`                                                                                  |
| `/judge/?t=` | 法官輔助           | 發牌交接（版本 2）：內建板子且設定相同時 `[2, 板子 id, 座位]`，否則 `[2, id, 座位, 名稱, 設定]`；座位是每個座位角色索引的 36 進位字元 |
| `/judge/?s=` | 法官輔助           | 遊戲紀錄（版本 3）：`[3, 板子, seq, 開始時間（分鐘）, 名稱, 備註, 座位, 進階設定, 輸入]`，見 `apps/judge/src/games/link.ts`           |

- **設定**：`[勝利條件, 同守同救, 警長 0/1, 遺言]`，皆為選項索引。
- **板子**：內建板子且角色、設定都相同時只放 id，否則 `[名稱, 張數, 設定]`。
- **進階設定**：依 `ADVANCED_OPTIONS` 順序每項一個數字（是否 0/1、選項索引，未設定 -1）。
- **輸入**：一個扁平的數字陣列，每筆以步驟編號開頭、長度依步驟固定，座位 0 代表「沒有／不選」。步驟編號只能往後加，舊連結才能繼續使用。
- 12 人一局三夜三天的遊戲紀錄連結約 200 字元；發牌交接約 100 字元。匯入時會給紀錄新的 id。

## 遊戲紀錄 JSON（`schemaVersion: 1`）

```jsonc
{
  "schemaVersion": 1,
  "id": "…",
  "createdAt": 1795440000000,
  "updatedAt": 1795443600000,
  "name": "", // 空字串＝自動命名「日期 第seq場」
  "seq": 1,
  "note": "",
  "board": {
    "id": "b12-seer-witch-hunter-guard",
    "name": { "zh-TW": "預女獵守", "en-US": "Seer · Witch · Hunter · Guard" },
    "roles": { "werewolf": 4, "seer": 1, "witch": 1, "hunter": 1, "guard": 1, "villager": 4 },
    "rules": {
      "win": "side",
      "guardSaveConflict": "dies",
      "sheriff": true,
      "lastWords": "firstNight",
    },
    "verified": false,
  },
  "table": [{ "seat": 1, "role": "werewolf" }],
  "options": { "witchSelfSave": "never", "wolfKingMeetsPack": true }, // 進階設定（沒寫的用預設） // 開局已知的角色（從角色發牌交接）
  "events": [
    // 法官的每一筆輸入
    { "step": "dusk" },
    { "step": "guard", "target": 9 },
    { "step": "wolves", "kill": 9 },
  ],
}
```

勝方、目前步驟、死亡名單、時間軸都由 `deriveGame` 從 `events` 推導，不存入資料。
