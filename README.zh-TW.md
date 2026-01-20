# EchoType

[English](README.md) | [繁體中文](README.zh-TW.md)

EchoType 是一個 Chrome 擴充套件，將 ChatGPT 的語音聽寫結果轉為可在任何網站貼上的文字。

## 特色重點

- 使用 ChatGPT Whisper 的語音聽寫
- 全域快捷鍵控制開始、提交、取消與貼上
- 可選擇完成後自動複製與自動貼上
- 保留最近的聽寫歷史
- 介面支援 25 種語言
- Popup 與設定頁面整合 MV3 Offscreen 剪貼簿

## 環境需求

- 支援 Manifest V3 的 Chromium 瀏覽器
- ChatGPT 帳號且具備語音輸入功能

## 安裝

```bash
git clone https://github.com/haotool/echotype.git
cd EchoType
pnpm install
pnpm build
```

載入擴充套件：

1. 開啟 `chrome://extensions/`
2. 啟用開發者模式
3. 點選「載入未封裝項目」
4. 選擇 `dist/` 資料夾

## 使用方式

快捷鍵：

| 快捷鍵 | 功能 |
| --- | --- |
| `Alt+Shift+S` | 切換聽寫（開始/提交） |
| `Alt+Shift+C` | 取消聽寫 |
| `Alt+Shift+P` | 貼上最後結果 |

設定：

開啟 popup，選擇 Settings。

| 設定項目 | 說明 | 預設 |
| --- | --- | --- |
| Auto Copy | 完成後自動複製 | 開啟 |
| Auto Paste | 貼上到原輸入位置 | 關閉 |
| Return Focus | 開始後回到原分頁 | 關閉 |
| Manual Submit Auto Copy | 在 ChatGPT 手動點擊提交時自動複製 | 關閉 |

## 開發

```bash
pnpm dev
pnpm typecheck
pnpm lint
pnpm format
```

## 測試

```bash
pnpm test
pnpm test:e2e
```

注意：`pnpm test:e2e` 需要先完成 build。

## 架構

```
EchoType/
├── _locales/            # i18n 翻譯
├── src/
│   ├── background/      # MV3 Service Worker
│   ├── content/         # ChatGPT 與通用內容腳本
│   ├── offscreen/       # 剪貼簿與音效
│   ├── popup/           # Popup 介面
│   ├── options/         # 設定頁
│   └── shared/          # 共用工具與型別
├── tests/
│   ├── unit/            # Vitest
│   └── e2e/             # Playwright
└── dist/                # Build 產出
```

## 權限

| 權限 | 用途 |
| --- | --- |
| `activeTab` | 貼上到目前分頁 |
| `storage` | 儲存設定 |
| `offscreen` | MV3 剪貼簿存取 |
| `clipboardWrite` | 寫入剪貼簿 |
| `https://chatgpt.com/*` | 聽寫控制 |

## 安全與隱私

EchoType 不會蒐集或傳送使用者資料。請參考 [PRIVACY.md](PRIVACY.md)。

## 免責聲明

EchoType 非 OpenAI 官方產品，且與 OpenAI 或 ChatGPT 無任何隸屬、合作、背書關係。
完整法律與商標聲明請見 [DISCLAIMER.md](DISCLAIMER.md)。

## 授權

[MIT](LICENSE)
