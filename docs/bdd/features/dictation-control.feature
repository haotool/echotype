# language: zh-TW
@dictation @core
Feature: 聽寫控制
  作為使用者
  我想要透過快捷鍵控制 ChatGPT 聽寫功能
  以便在任何網站都能使用語音輸入

  Background:
    Given ChatGPT Tab 已準備就緒
    And 擴充套件已載入

  @start
  Scenario: 啟動聽寫
    Given 目前在任意網站
    And 聽寫狀態為「待命」
    When 按下啟動快捷鍵 "Ctrl+Shift+1"
    Then 系統應切換到 ChatGPT Tab
    And 點擊「聽寫按鈕」啟動錄音
    And 建立 baseline 快照
    And 聽寫狀態應為「聽寫中」

  @pause
  Scenario: 暫停聽寫
    Given 聽寫狀態為「聽寫中」
    When 按下暫停快捷鍵 "Ctrl+Shift+2"
    Then 點擊「停止聽寫」按鈕
    And 聽寫狀態應為「待命」

  @submit
  Scenario: 完成聽寫並取得結果
    Given 聽寫狀態為「聽寫中」
    And 輸入框已有聽寫內容
    When 按下完成快捷鍵 "Ctrl+Shift+3"
    Then 點擊「提交聽寫」按鈕
    And 等待內容至少變動一次
    And 內容穩定後擷取最終文字
    And 計算新增文字（baseline diff）
    And 清空輸入框並驗證成功
    And 將結果儲存至歷史記錄

  @submit @empty
  Scenario: 完成聽寫但無新增內容
    Given 聽寫狀態為「聽寫中」
    And 輸入框內容未變動
    When 按下完成快捷鍵 "Ctrl+Shift+3"
    Then 點擊「提交聽寫」按鈕
    And 等待超時後判定無變動
    And 不應新增歷史記錄
    And 應顯示「未偵測到新增內容」提示

  @error
  Scenario: 找不到聽寫按鈕
    Given ChatGPT 頁面結構已變更
    And 找不到「聽寫按鈕」
    When 按下啟動快捷鍵 "Ctrl+Shift+1"
    Then 應回報錯誤碼 "SELECTOR_NOT_FOUND"
    And 應顯示「無法找到聽寫按鈕，請確認 ChatGPT 頁面版本」提示
