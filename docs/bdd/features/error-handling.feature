# language: zh-TW
@error @detection
Feature: 錯誤處理與狀態偵測
  作為使用者
  我想要擴充套件能正確偵測各種錯誤狀態
  以便獲得清晰的錯誤提示並採取正確的修復措施

  Background:
    Given 擴充套件已載入

  # ============================================================================
  # 登入狀態偵測
  # ============================================================================

  @login @not-logged-in
  Scenario: 偵測未登入狀態 - 登入按鈕存在
    Given ChatGPT 頁面已載入
    And 頁面上存在「登入」按鈕
    When 執行登入狀態檢查
    Then 應回報登入狀態為「未登入」
    And 原因應為 "login_button_found"

  @login @not-logged-in
  Scenario: 偵測未登入狀態 - 註冊按鈕存在
    Given ChatGPT 頁面已載入
    And 頁面上存在「註冊」或「開始使用」按鈕
    When 執行登入狀態檢查
    Then 應回報登入狀態為「未登入」
    And 原因應為 "signup_button_found"

  @login @logged-in
  Scenario: 偵測已登入狀態 - 使用者選單存在
    Given ChatGPT 頁面已載入
    And 頁面上存在使用者設定檔圖像
    When 執行登入狀態檢查
    Then 應回報登入狀態為「已登入」
    And 原因應為 "user_menu_found"

  @login @logged-in
  Scenario: 偵測已登入狀態 - 輸入框存在
    Given ChatGPT 頁面已載入
    And 頁面上存在 prompt-textarea 輸入框
    When 執行登入狀態檢查
    Then 應回報登入狀態為「已登入」
    And 原因應為 "composer_found"

  # ============================================================================
  # 語音輸入可用性偵測
  # ============================================================================

  @voice @available
  Scenario: 語音輸入可用 - 聽寫按鈕存在
    Given 使用者已登入 ChatGPT
    And 頁面上存在「聽寫按鈕」
    When 執行語音輸入可用性檢查
    Then 應回報語音輸入為「可用」

  @voice @unavailable
  Scenario: 語音輸入不可用 - 無聽寫按鈕
    Given 使用者已登入 ChatGPT
    And 頁面上不存在任何聽寫相關按鈕
    When 執行語音輸入可用性檢查
    Then 應回報語音輸入為「不可用」

  @voice @unavailable
  Scenario: 語音輸入不可用 - 地區限制
    Given 使用者已登入 ChatGPT
    And 使用者所在地區不支援語音輸入
    When 嘗試啟動聽寫
    Then 應回報錯誤碼 "VOICE_INPUT_UNAVAILABLE"
    And 應顯示「語音輸入在您的地區不可用」提示

  # ============================================================================
  # 健康檢查
  # ============================================================================

  @health @healthy
  Scenario: 健康檢查通過 - 閒置狀態
    Given 使用者已登入 ChatGPT
    And 輸入框可見
    And 聽寫按鈕可用
    When 執行健康檢查
    Then 健康狀態應為「健康」
    And 不應有任何缺失元素

  @health @healthy
  Scenario: 健康檢查通過 - 錄音狀態
    Given 使用者已登入 ChatGPT
    And 正在進行聽寫錄音
    And 波形畫布可見
    And 停止/提交按鈕可見
    When 執行健康檢查
    Then 健康狀態應為「健康」
    And 警告應包含「composer hidden during dictation (expected)」

  @health @unhealthy
  Scenario: 健康檢查失敗 - 頁面未完全載入
    Given ChatGPT 頁面正在載入
    And 輸入框尚未出現
    And 無任何聽寫按鈕
    When 執行健康檢查
    Then 健康狀態應為「不健康」
    And 缺失元素應包含 "composer"
    And 錯誤碼應為 "SELECTOR_NOT_FOUND"

  # ============================================================================
  # 聽寫狀態偵測
  # ============================================================================

  @status @idle
  Scenario: 偵測閒置狀態
    Given 使用者已登入 ChatGPT
    And 只有「開始聽寫」按鈕可見
    When 執行狀態偵測
    Then 聽寫狀態應為「idle」

  @status @listening
  Scenario: 偵測監聽狀態
    Given 使用者已開始聽寫
    And 「停止」按鈕可見
    And 波形畫布可見
    When 執行狀態偵測
    Then 聽寫狀態應為「listening」

  @status @recording
  Scenario: 偵測錄音狀態
    Given 使用者正在錄音
    And 「提交」按鈕可見
    And 波形畫布可見
    When 執行狀態偵測
    Then 聽寫狀態應為「recording」

  @status @processing
  Scenario: 偵測處理狀態
    Given 使用者已提交錄音
    And 按鈕呈現停用狀態
    And 載入動畫可見
    When 執行狀態偵測
    Then 聽寫狀態應為「processing」

  # ============================================================================
  # 背景分頁錯誤處理
  # ============================================================================

  @background @page-inactive
  Scenario: 背景分頁操作 - 開始聽寫
    Given 使用者在其他分頁
    And ChatGPT 分頁在背景
    When 使用者按下啟動快捷鍵
    Then 應能在背景成功點擊聽寫按鈕
    And 不需要切換到 ChatGPT 分頁

  @background @page-inactive
  Scenario: 背景分頁操作 - 提交並擷取
    Given 使用者在其他分頁
    And ChatGPT 分頁正在錄音
    When 使用者按下提交快捷鍵
    Then 應短暫激活 ChatGPT 分頁
    And 激活時間應小於 200ms
    And 應成功擷取轉錄文字
    And 應自動返回原始分頁

  @background @retry
  Scenario: 背景分頁操作失敗後重試
    Given 使用者在其他分頁
    And ChatGPT 分頁在背景
    When 背景操作回報 "PAGE_INACTIVE" 錯誤
    Then 應自動激活 ChatGPT 分頁
    And 重新嘗試操作
    And 操作成功後返回原始分頁

  # ============================================================================
  # 錯誤恢復
  # ============================================================================

  @recovery @timeout
  Scenario: 操作逾時後重試
    Given 聽寫提交操作進行中
    And 等待轉錄結果
    When 超過 14 秒未收到結果
    Then 應觸發狀態重新同步
    And 嘗試擷取當前文字
    And 若仍失敗則回報 "TIMEOUT" 錯誤

  @recovery @injection
  Scenario: 內容腳本注入失敗後重試
    Given ChatGPT 分頁已開啟
    And 內容腳本尚未注入
    When 發送命令到 ChatGPT 分頁
    Then 應自動嘗試注入內容腳本
    And 注入成功後重新發送命令

  @recovery @tab-closed
  Scenario: ChatGPT 分頁被關閉
    Given 使用者正在進行聽寫
    And ChatGPT 分頁被使用者關閉
    When 擴充套件嘗試發送命令
    Then 應回報錯誤碼 "TAB_NOT_FOUND"
    And 應清除聽寫狀態
    And 狀態應重置為「idle」

  # ============================================================================
  # 使用者指引
  # ============================================================================

  @guidance @not-logged-in
  Scenario: 未登入時提供指引
    Given 使用者嘗試啟動聽寫
    And 偵測到使用者未登入
    Then 應顯示「請登入 ChatGPT 以使用語音聽寫功能」
    And 錯誤訊息應包含登入連結或指引

  @guidance @voice-unavailable
  Scenario: 語音不可用時提供指引
    Given 使用者嘗試啟動聽寫
    And 偵測到語音輸入不可用
    Then 應顯示「語音輸入在您的地區或瀏覽器中可能不可用」
    And 錯誤訊息應建議檢查瀏覽器設定
