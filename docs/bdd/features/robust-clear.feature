# language: zh-TW
@clear @robust
Feature: 強健清除
  作為系統
  我需要在提交後清空 ChatGPT 輸入框
  且確保清除成功不被框架回填

  Background:
    Given ChatGPT 輸入框已就緒
    And 輸入框有內容 "待清除內容"

  @success
  Scenario: 清除成功
    When 執行強健清除
    Then 輸入框應被清空
    And 等待 320ms 確認穩定
    And 返回成功狀態

  @retry
  Scenario: 清除需重試
    Given 第一次清除後框架回填
    When 執行強健清除（最多 4 次）
    Then 應重試直到成功
    And 返回成功狀態與嘗試次數

  @failure
  Scenario: 清除失敗
    Given 所有清除嘗試都被回填
    When 執行強健清除（4 次後）
    Then 返回失敗狀態
    And 原因為 "clear-timeout"

  @prosemirror
  Scenario: ProseMirror 特殊處理
    Given 輸入框為 ProseMirror 編輯器
    When 執行強健清除
    Then 應使用 selectAll + delete 指令
    And 應 fallback 到 innerHTML 清空
    And 應觸發 input 事件通知框架
