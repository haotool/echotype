# language: zh-TW
@capture @stability
Feature: 穩定化擷取
  作為系統
  我需要確保在 ChatGPT 完成轉寫後才擷取內容
  以避免擷取到不完整或錯誤的文字

  Background:
    Given ChatGPT 輸入框已就緒

  @change-detection
  Scenario: 等待內容變動
    Given 提交前輸入框內容為 "原始內容"
    When 點擊「提交聽寫」
    Then 應等待內容至少變動一次
    And 不應立即宣告穩定

  @stable-window
  Scenario: 穩定視窗判定
    Given 內容已開始變動
    And 內容持續更新中
    When 內容連續 520ms 未變動
    Then 應判定為「已穩定」
    And 擷取當前內容為最終結果

  @timeout
  Scenario: 變動超時
    Given 提交前輸入框內容為 "原始內容"
    When 點擊「提交聽寫」
    And 等待 9 秒仍未變動
    Then 應以「timeout-without-change」原因結束
    And 擷取當前內容（可能為空或原始內容）

  @cancel
  Scenario: 擷取被取消
    Given 正在等待穩定化
    When 發起新的擷取請求
    Then 前一次擷取應被取消
    And 返回「canceled」原因
