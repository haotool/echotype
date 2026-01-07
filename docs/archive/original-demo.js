(() => {
  "use strict";

  /*
      Whisper Floating Controller (DOM Script) - Fixed Waiting + Robust Clear
      修正重點
      1) 提交後「必須先等到內容至少變動一次」再進入穩定化判定 (避免抓到舊內容就宣告 stable)
      2) 清除 ProseMirror：用 selectAll + delete + input 事件，並「等待清空穩定」且可重試
      3) 只保存「聽寫新增」(baseline diff)
      4) 面板顯示最近 5 次 (新到舊)，點擊項目可複製
    */

  const SELECTORS = {
    startBtn: 'button[aria-label="聽寫按鈕"]',
    stopBtn: 'button[aria-label="停止聽寫"]',
    submitBtn: 'button[aria-label="提交聽寫"]',
    composer: "#prompt-textarea", // ProseMirror editable root
  };

  const ID = {
    panel: "whisper-float-panel",
    style: "whisper-float-style",
    status: "wf-status",
    badge: "wf-badge",
    bar: "wf-bar",
    vis: "wf-vis",
    meta: "wf-meta",
    list: "wf-list",
    toast: "wf-toast",
  };

  const State = {
    audioCtx: null,
    analyser: null,
    dataArray: null,
    rafId: null,
    stream: null,

    rootObserver: null,
    composerEl: null,

    dragging: false,
    dragOffsetX: 0,
    dragOffsetY: 0,

    throttleTimer: null,
    lastCaptureToken: 0,

    baselineText: "",
    history: [], // newest first: { id, ts, text }
  };

  function $(sel, root = document) {
    return root.querySelector(sel);
  }

  function exists(sel) {
    return Boolean($(sel));
  }

  function safeClick(sel) {
    const el = $(sel);
    if (!el) return false;
    el.click();
    return true;
  }

  function throttle(fn, wait = 120) {
    if (State.throttleTimer) return;
    State.throttleTimer = setTimeout(() => {
      State.throttleTimer = null;
      fn();
    }, wait);
  }

  function nowTS() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
  }

  function normalizeText(s) {
    return String(s || "")
      .replace(/\u00A0/g, " ")
      .replace(/\r/g, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function isEmptyText(s) {
    // ProseMirror 清空後常會留 <p></p> 或 <p><br></p>
    // innerText 可能是 "" 或 "\n"
    return normalizeText(s).replace(/\n/g, "").trim() === "";
  }

  function getStatus() {
    if (exists(SELECTORS.stopBtn)) return "listening";
    if (exists(SELECTORS.startBtn)) return "idle";
    return "unknown";
  }

  function getComposerEl() {
    return $(SELECTORS.composer);
  }

  function readComposerText() {
    const el = getComposerEl();
    if (!el) return "";
    return normalizeText(el.innerText || el.textContent || "");
  }

  function escapeHTML(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function ensureStyle() {
    if (document.getElementById(ID.style)) return;

    const style = document.createElement("style");
    style.id = ID.style;
    style.textContent = `
        #${ID.panel} {
          position: fixed;
          right: 20px;
          bottom: 20px;
          width: 380px;
          background: rgba(17, 17, 17, 0.96);
          color: #fff;
          border-radius: 14px;
          padding: 12px;
          z-index: 2147483647;
          font-family: system-ui, -apple-system, Segoe UI, Roboto, "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif;
          box-shadow: 0 12px 40px rgba(0,0,0,.45);
          user-select: none;
          backdrop-filter: blur(6px);
        }
        #${ID.panel} * { box-sizing: border-box; }
  
        .wf-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          cursor: grab;
          padding: 8px 10px;
          background: rgba(255,255,255,0.06);
          border-radius: 12px;
          margin-bottom: 10px;
        }
        .wf-title { font-weight: 700; letter-spacing: .2px; }
        .wf-status { font-size: 12px; opacity: .85; white-space: nowrap; }
  
        .wf-visualizer {
          height: 34px;
          background: rgba(255,255,255,0.06);
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 10px;
          position: relative;
        }
        .wf-bar {
          height: 100%;
          width: 8%;
          background: linear-gradient(90deg, #4ade80, #22d3ee);
          transition: width .08s linear;
        }
        .wf-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 30% 50%, rgba(34,211,238,.25), transparent 55%);
          opacity: 0;
          transition: opacity .15s ease;
          pointer-events: none;
        }
        .wf-visualizer[data-active="1"] .wf-glow { opacity: 1; }
  
        .wf-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 10px;
        }
        .wf-actions button {
          border: none;
          border-radius: 10px;
          padding: 9px 10px;
          cursor: pointer;
          background: rgba(255,255,255,0.10);
          color: #fff;
          font-weight: 600;
        }
        .wf-actions button:hover { background: rgba(255,255,255,0.16); }
        .wf-actions button:active { transform: translateY(1px); }
        .wf-actions button[disabled] {
          cursor: not-allowed;
          opacity: 0.45;
          background: rgba(255,255,255,0.06);
        }
  
        .wf-meta {
          background: rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 8px 10px;
          margin-bottom: 10px;
          font-size: 12px;
          opacity: .9;
          line-height: 1.45;
        }
  
        .wf-list {
          background: rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 10px;
          max-height: 260px;
          overflow: auto;
        }
  
        .wf-item {
          border-radius: 10px;
          padding: 8px 10px;
          background: rgba(255,255,255,0.07);
          cursor: pointer;
          user-select: text;
          margin-bottom: 8px;
        }
        .wf-item:hover { background: rgba(255,255,255,0.11); }
        .wf-item:last-child { margin-bottom: 0; }
  
        .wf-item-head {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 6px;
          font-size: 12px;
          opacity: .85;
        }
        .wf-item-body {
          white-space: pre-wrap;
          font-size: 13px;
          line-height: 1.45;
          user-select: text;
        }
  
        .wf-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 999px;
          background: rgba(255,255,255,0.10);
          font-size: 12px;
        }
  
        #${ID.toast} {
          position: fixed;
          right: 24px;
          bottom: 300px;
          z-index: 2147483647;
          background: rgba(0,0,0,0.85);
          color: #fff;
          padding: 8px 10px;
          border-radius: 10px;
          font-size: 12px;
          opacity: 0;
          transform: translateY(6px);
          transition: opacity .15s ease, transform .15s ease;
          pointer-events: none;
        }
        #${ID.toast}[data-show="1"] {
          opacity: 1;
          transform: translateY(0px);
        }
      `;
    document.head.appendChild(style);
  }

  function ensureToast() {
    if (document.getElementById(ID.toast)) return;
    const t = document.createElement("div");
    t.id = ID.toast;
    t.textContent = "";
    document.body.appendChild(t);
  }

  function toast(msg) {
    const t = document.getElementById(ID.toast);
    if (!t) return;
    t.textContent = msg;
    t.setAttribute("data-show", "1");
    setTimeout(() => t.setAttribute("data-show", "0"), 900);
  }

  function ensurePanel() {
    if (document.getElementById(ID.panel)) return;

    ensureStyle();
    ensureToast();

    const panel = document.createElement("div");
    panel.id = ID.panel;
    panel.innerHTML = `
        <div class="wf-header" title="拖曳可移動">
          <div>
            <div class="wf-title">聽寫控制</div>
            <div class="wf-status" id="${ID.status}">狀態: 讀取中</div>
          </div>
          <div class="wf-badge" id="${ID.badge}">DOM</div>
        </div>
  
        <div class="wf-visualizer" id="${ID.vis}" data-active="0">
          <div class="wf-bar" id="${ID.bar}"></div>
          <div class="wf-glow"></div>
        </div>
  
        <div class="wf-actions">
          <button type="button" data-action="start" id="wf-start">啟動</button>
          <button type="button" data-action="pause" id="wf-pause">暫停</button>
          <button type="button" data-action="submit" id="wf-submit">完成</button>
          <button type="button" data-action="close" id="wf-close">關閉</button>
        </div>
  
        <div class="wf-meta" id="${ID.meta}">
          Baseline: 尚未建立
          <br>提示: 點擊下方任一段文字即可複製
        </div>
  
        <div class="wf-list" id="${ID.list}">
          <div style="opacity:.75;font-size:12px;">（尚無結果）</div>
        </div>
      `;

    document.body.appendChild(panel);
    bindPanelEvents(panel);
    syncUI();
    renderHistory();
    setMeta(`Baseline: 尚未建立`);
  }

  function setMeta(line1) {
    const meta = document.getElementById(ID.meta);
    if (!meta) return;
    meta.innerHTML = `${escapeHTML(line1)}<br>提示: 點擊下方任一段文字即可複製`;
  }

  function syncUI() {
    const status = getStatus();
    const statusEl = document.getElementById(ID.status);
    const badgeEl = document.getElementById(ID.badge);
    const startBtn = document.getElementById("wf-start");
    const pauseBtn = document.getElementById("wf-pause");
    const submitBtn = document.getElementById("wf-submit");
    const vis = document.getElementById(ID.vis);

    if (!statusEl || !badgeEl || !startBtn || !pauseBtn || !submitBtn || !vis)
      return;

    if (status === "idle") {
      statusEl.textContent = "狀態: 待命";
      badgeEl.textContent = "Idle";
      startBtn.disabled = false;
      pauseBtn.disabled = true;
      submitBtn.disabled = true;
      vis.setAttribute("data-active", "0");
    } else if (status === "listening") {
      statusEl.textContent = "狀態: 聽寫中";
      badgeEl.textContent = "Live";
      startBtn.disabled = true;
      pauseBtn.disabled = false;
      submitBtn.disabled = false;
      vis.setAttribute("data-active", "1");
    } else {
      statusEl.textContent = "狀態: 未知";
      badgeEl.textContent = "Unknown";
      startBtn.disabled = false;
      pauseBtn.disabled = false;
      submitBtn.disabled = false;
    }
  }

  async function startVisualizer() {
    if (State.audioCtx && State.analyser && State.dataArray) return;

    const bar = document.getElementById(ID.bar);
    const vis = document.getElementById(ID.vis);
    if (!bar || !vis) return;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    State.audioCtx = new AudioCtx();
    State.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const source = State.audioCtx.createMediaStreamSource(State.stream);
    State.analyser = State.audioCtx.createAnalyser();
    State.analyser.fftSize = 256;

    State.dataArray = new Uint8Array(State.analyser.frequencyBinCount);
    source.connect(State.analyser);

    vis.setAttribute("data-active", "1");

    const loop = () => {
      State.analyser.getByteFrequencyData(State.dataArray);
      let sum = 0;
      for (let i = 0; i < State.dataArray.length; i++)
        sum += State.dataArray[i];
      const avg = sum / State.dataArray.length;
      const width = Math.max(8, Math.min(100, avg));
      bar.style.width = `${width}%`;
      State.rafId = requestAnimationFrame(loop);
    };

    State.rafId = requestAnimationFrame(loop);
  }

  function computeAddedText(baseline, finalText) {
    const b = normalizeText(baseline);
    const f = normalizeText(finalText);

    if (!f) return "";
    if (!b) return f;

    if (f.startsWith(b)) {
      return normalizeText(f.slice(b.length)).replace(/^\s+/, "");
    }

    const idx = f.indexOf(b);
    if (idx >= 0) {
      return normalizeText((f.slice(0, idx) + f.slice(idx + b.length)).trim());
    }

    // fallback: longest common prefix
    const minLen = Math.min(b.length, f.length);
    let i = 0;
    while (i < minLen && b[i] === f[i]) i++;
    return normalizeText(f.slice(i)).replace(/^\s+/, "");
  }

  function pushHistory(text) {
    const clean = normalizeText(text);
    if (!clean) return;

    const item = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      ts: nowTS(),
      text: clean,
    };

    State.history.unshift(item);
    if (State.history.length > 5) State.history.length = 5;
    renderHistory();
  }

  function renderHistory() {
    const list = document.getElementById(ID.list);
    if (!list) return;

    if (!State.history.length) {
      list.innerHTML = `<div style="opacity:.75;font-size:12px;">（尚無結果）</div>`;
      return;
    }

    list.innerHTML = State.history
      .map((h, idx) => {
        const n = idx + 1;
        return `
            <div class="wf-item" data-copy-id="${h.id}" title="點擊複製">
              <div class="wf-item-head">
                <div>#${n} ${escapeHTML(h.ts)}</div>
                <div style="opacity:.8;">點擊複製</div>
              </div>
              <div class="wf-item-body">${escapeHTML(h.text)}</div>
            </div>
          `;
      })
      .join("");
  }

  async function copyToClipboard(text) {
    const t = normalizeText(text);
    if (!t) return false;

    try {
      await navigator.clipboard.writeText(t);
      return true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = t;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        return true;
      } catch {
        return false;
      }
    }
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async function waitForComposerChangeFrom(oldText, timeout = 5000) {
    const oldN = normalizeText(oldText);
    const start = performance.now();

    while (performance.now() - start < timeout) {
      const cur = readComposerText();
      if (normalizeText(cur) !== oldN)
        return { ok: true, text: cur, reason: "changed" };
      await sleep(60);
    }
    return { ok: false, text: readComposerText(), reason: "no-change-timeout" };
  }

  async function waitForStatusIdle(timeout = 5000) {
    const start = performance.now();
    while (performance.now() - start < timeout) {
      if (getStatus() === "idle") return { ok: true, reason: "idle" };
      await sleep(80);
    }
    return { ok: false, reason: "idle-timeout" };
  }

  async function captureStableComposerTextAfterChange({
    oldText,
    interval = 80,
    stableMs = 520,
    timeout = 8000,
    requireChange = true,
  } = {}) {
    const token = ++State.lastCaptureToken;

    const oldN = normalizeText(oldText);
    const start = performance.now();
    let last = readComposerText();
    let stableStart = performance.now();
    let sawChange = !requireChange;

    while (true) {
      if (token !== State.lastCaptureToken)
        return { text: readComposerText(), reason: "canceled" };

      await sleep(interval);

      const now = performance.now();
      const cur = readComposerText();

      if (!sawChange && normalizeText(cur) !== oldN) {
        sawChange = true;
        last = cur;
        stableStart = now;
      }

      if (sawChange && cur !== last) {
        last = cur;
        stableStart = now;
      }

      if (sawChange && now - stableStart >= stableMs)
        return { text: cur, reason: "stable" };
      if (now - start >= timeout)
        return {
          text: cur,
          reason: sawChange ? "timeout" : "timeout-without-change",
        };
    }
  }

  function selectAll(el) {
    try {
      el.focus();
      const sel = window.getSelection?.();
      if (!sel) return false;
      sel.removeAllRanges();
      const range = document.createRange();
      range.selectNodeContents(el);
      sel.addRange(range);
      return true;
    } catch {
      return false;
    }
  }

  function deleteSelection() {
    try {
      // 先用 selectAll/delete 走瀏覽器輸入管線，通常 ProseMirror 會吃得到
      document.execCommand("selectAll");
      document.execCommand("delete");
      return true;
    } catch {
      return false;
    }
  }

  async function clearComposerRobust({
    attempts = 4,
    timeoutPerAttempt = 1800,
  } = {}) {
    const el = getComposerEl();
    if (!el) return { ok: false, reason: "no-composer" };

    for (let i = 1; i <= attempts; i++) {
      // step 1: focus + select all + delete
      el.focus();
      selectAll(el);
      deleteSelection();

      // step 2: fallback hard clear (DOM) + input events
      // 有些情況 execCommand 只刪到剩 <p><br></p>，這裡直接歸零
      try {
        el.innerHTML = "<p></p>";
        el.dispatchEvent(new InputEvent("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      } catch {}

      // step 3: 等待清空結果穩定 (避免框架回填)
      const start = performance.now();
      let last = readComposerText();
      let stableStart = performance.now();

      while (performance.now() - start < timeoutPerAttempt) {
        await sleep(80);

        const cur = readComposerText();
        if (cur !== last) {
          last = cur;
          stableStart = performance.now();
        }

        // 連續 320ms 都維持空，判定成功
        if (isEmptyText(cur) && performance.now() - stableStart >= 320) {
          return { ok: true, reason: `cleared-attempt-${i}` };
        }
      }
    }

    return { ok: isEmptyText(readComposerText()), reason: "clear-timeout" };
  }

  function attachComposerWatcher() {
    // 監控 composer 被替換
    const tryAttach = () => {
      const el = getComposerEl();
      if (!el) return;
      if (State.composerEl !== el) State.composerEl = el;
    };

    tryAttach();

    if (State.rootObserver) return;
    State.rootObserver = new MutationObserver(() => {
      throttle(() => {
        tryAttach();
        syncUI();
      }, 120);
    });
    State.rootObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  function bindPanelEvents(panel) {
    panel.addEventListener("click", async (e) => {
      // click-to-copy items
      const item = e.target?.closest?.(".wf-item[data-copy-id]");
      if (item) {
        const id = item.getAttribute("data-copy-id");
        const found = State.history.find((h) => h.id === id);
        if (!found) return;
        const ok = await copyToClipboard(found.text);
        toast(ok ? "已複製到剪貼簿" : "複製失敗");
        return;
      }

      const btn = e.target?.closest("button[data-action]");
      if (!btn) return;

      const action = btn.getAttribute("data-action");

      if (action === "start") {
        // baseline 必須在啟動前快照
        State.baselineText = readComposerText();
        setMeta(
          `Baseline: ${State.baselineText ? "已建立" : "空白"} (${nowTS()})`
        );

        safeClick(SELECTORS.startBtn);
        try {
          await startVisualizer();
        } catch {}
        setTimeout(syncUI, 200);
        return;
      }

      if (action === "pause") {
        safeClick(SELECTORS.stopBtn);
        setTimeout(syncUI, 150);
        return;
      }

      if (action === "submit") {
        const preSubmitText = readComposerText();

        // 1) 點提交
        safeClick(SELECTORS.submitBtn);

        // 2) 等待「至少一次內容變動」或「狀態回到 idle」
        setMeta(`提交中，等待結果寫入 (${nowTS()})`);

        // 先快速等「變動訊號」，避免直接進 stable
        await Promise.race([
          waitForComposerChangeFrom(preSubmitText, 4500),
          waitForStatusIdle(4500),
        ]).catch(() => {});

        // 3) 真正抓最終內容：要求先變動，再穩定化
        const final = await captureStableComposerTextAfterChange({
          oldText: preSubmitText,
          interval: 80,
          stableMs: 520,
          timeout: 9000,
          requireChange: true,
        });

        const finalText = normalizeText(final.text);
        const added = computeAddedText(State.baselineText, finalText);

        if (normalizeText(added)) {
          pushHistory(added);
          setMeta(`完成，已擷取新增內容 (${final.reason}) (${nowTS()})`);
          toast("已擷取，點擊項目可複製");
        } else {
          setMeta(`完成，但未偵測到新增內容 (${final.reason}) (${nowTS()})`);
          toast("未偵測到新增內容");
        }

        // 4) 清除輸入框，並等待清空穩定
        setMeta(`清除輸入框中 (${nowTS()})`);
        const cleared = await clearComposerRobust({
          attempts: 4,
          timeoutPerAttempt: 1800,
        });

        if (cleared.ok) {
          setMeta(`已清除輸入框 (${cleared.reason}) (${nowTS()})`);
          toast("輸入框已清空");
        } else {
          setMeta(`清除可能未成功 (${cleared.reason}) (${nowTS()})`);
          toast("清除未完全成功");
        }

        // 5) 重置 baseline，下一輪請重新按「啟動」建立 baseline
        State.baselineText = "";

        setTimeout(syncUI, 200);
        return;
      }

      if (action === "close") {
        safeClick(SELECTORS.stopBtn);
        cleanup();
      }
    });

    // drag panel
    const header = panel.querySelector(".wf-header");
    header.addEventListener("mousedown", (e) => {
      State.dragging = true;
      const rect = panel.getBoundingClientRect();
      State.dragOffsetX = e.clientX - rect.left;
      State.dragOffsetY = e.clientY - rect.top;
      header.style.cursor = "grabbing";
      e.preventDefault();
    });

    window.addEventListener("mousemove", (e) => {
      if (!State.dragging) return;
      const x = e.clientX - State.dragOffsetX;
      const y = e.clientY - State.dragOffsetY;

      panel.style.left = `${Math.max(8, x)}px`;
      panel.style.top = `${Math.max(8, y)}px`;
      panel.style.right = "auto";
      panel.style.bottom = "auto";
    });

    window.addEventListener("mouseup", () => {
      if (!State.dragging) return;
      State.dragging = false;
      header.style.cursor = "grab";
    });
  }

  function cleanup() {
    if (State.rootObserver) {
      State.rootObserver.disconnect();
      State.rootObserver = null;
    }

    if (State.rafId) {
      cancelAnimationFrame(State.rafId);
      State.rafId = null;
    }

    if (State.stream) {
      try {
        State.stream.getTracks().forEach((t) => t.stop());
      } catch {}
      State.stream = null;
    }

    if (State.audioCtx) {
      try {
        State.audioCtx.close();
      } catch {}
      State.audioCtx = null;
    }

    State.analyser = null;
    State.dataArray = null;
    State.composerEl = null;

    const panel = document.getElementById(ID.panel);
    if (panel) panel.remove();

    const style = document.getElementById(ID.style);
    if (style) style.remove();

    const t = document.getElementById(ID.toast);
    if (t) t.remove();
  }

  function bootstrap() {
    if (document.getElementById(ID.panel)) cleanup();
    ensurePanel();
    attachComposerWatcher();
    syncUI();
  }

  // debug API
  window.__WHISPER_CTRL__ = {
    bootstrap,
    cleanup,
    readComposerText,
    clearComposerRobust,
    history: () => [...State.history],
  };

  bootstrap();
})();
