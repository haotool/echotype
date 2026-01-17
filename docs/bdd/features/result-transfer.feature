# language: zh-TW
@transfer @clipboard
Feature: 結果轉送
  作為使用者
  我想要將聽寫結果自動複製到剪貼簿
  以便在任何地方使用

  Background:
    Given 擴充套件已載入
    And 聽寫已完成並取得結果 "測試文字"

  @auto-copy
  Scenario: 自動複製到剪貼簿（啟用）
    Given 設定「完成後自動複製」為啟用
    When 聽寫完成
    Then 結果應自動複製到系統剪貼簿
    And 剪貼簿內容應為 "測試文字"

  @auto-copy @disabled
  Scenario: 自動複製到剪貼簿（停用）
    Given 設定「完成後自動複製」為停用
    When 聽寫完成
    Then 剪貼簿內容不應被改變

  @history
  Scenario: 歷史記錄保存
    Given 聽寫已完成多次
    When 開啟擴充套件
    Then 應顯示最近 5 次結果
    And 結果應按時間倒序排列

  @history @copy
  Scenario: 點擊歷史項目複製
    Given 歷史記錄有 "第一筆結果"
    When 點擊該歷史項目
    Then "第一筆結果" 應複製到剪貼簿
    And 應顯示「已複製」提示

  @paste
  Scenario: 手動貼上最近結果
    Given 目前在任意網站的輸入框
    And 聽寫結果為 "測試文字"
    When 按下貼上快捷鍵 "Alt+Shift+P"
    Then "測試文字" 應貼到目前焦點元素

  @paste @no-focus
  Scenario: 無焦點元素時貼上
    Given 目前頁面沒有焦點元素
    When 按下貼上快捷鍵 "Alt+Shift+P"
    Then 應顯示「請先選擇輸入框」提示
    And 不應執行任何貼上動作
