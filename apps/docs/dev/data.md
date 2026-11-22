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

都是 JSON → deflate-raw → base64url：

| 參數         | 工具               | 內容                                                            |
| ------------ | ------------------ | --------------------------------------------------------------- |
| `/deal/?b=`  | 角色發牌、法官輔助 | 板子：`[版本, 名稱, 依 ROLE_IDS 順序的張數, 設定]`              |
| `/judge/?t=` | 法官輔助           | 發牌交接：`[版本, 板子 id, 板子名稱, 設定, 每個座位的角色索引]` |
| `/judge/?s=` | 法官輔助           | 整場遊戲紀錄（與 JSON 匯出相同的結構）                          |

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
      "witchSelfSave": "firstNight",
      "guardSaveConflict": "dies",
      "sheriff": true,
      "lastWords": "firstNight",
    },
    "verified": false,
  },
  "table": [{ "seat": 1, "role": "werewolf" }], // 開局已知的角色（從角色發牌交接）
  "events": [
    // 法官的每一筆輸入
    { "step": "dusk" },
    { "step": "guard", "target": 9 },
    { "step": "wolves", "kill": 9 },
  ],
}
```

勝方、目前步驟、死亡名單、時間軸都由 `deriveGame` 從 `events` 推導，不存入資料。
