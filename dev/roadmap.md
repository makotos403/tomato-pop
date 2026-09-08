# ロードマップ

**着手予定の項目はなし。** 新しい案が出たらここに追記する。

---

## リリース済み

### v1.2.0 — 改名 ＋ アイコン刷新

- `Tomato Pop` → **`Tomato Pop Timer`** / `トマトポップタイマー`（検索で「タイマー / timer」に当てる。
  `_locales` の `appName`。`short_name` は `appNameShort` = `Tomato Pop`）
- アイコン：プロモタイルの Gemini トマトを抽出して差し替え（つや・星型のヘタ）。
  リング意匠は不採用（16px で潰れる）。タイマー感はポップアップの円弧が担う
  - パイプライン：`dev/extract_tomato.py` → `dev/icon_src.png` → `dev/build_icons.py`（4サイズ）
- スクリーンショットは v1.1.0 のものを流用（アイコンは実寸 ~16px で差が出ない、名前は写らない）

### v1.1.0 — ↗ ポップアウト・ウィンドウ

タイマーを常に画面に出しておけるように（ドロップダウンはフォーカスを失うと閉じるため）。

- ドロップダウンの操作行に `↗` → `OPEN_WINDOW` → `background.js` の `openTimerWindow()`
- `chrome.windows.create({ type:"popup", url:"popup.html?w=1" })`。窓 ID は `chrome.storage.session`（`WIN_KEY`）
- 既に開いていれば `chrome.windows.update(id,{focused:true,drawAttention:true})` のみ
- `onRemoved` → ID クリア（stale ID は次回 open 時に自己修復）／`onBoundsChanged` → 位置・サイズを `storage.local` に保存 → 復元
- `popup.js`：`?w=1` で窓モード判定 → `↗` を隠す・`<html>.window-mode`・`fitWindow()` で高さ自動調整
- 窓とドロップダウンは同じ background 状態を読む → `storage.onChanged` で自動同期
- 新権限なし。`state.js` は不変
- 限界：最前面固定は不可（Chrome に always-on-top API なし）。小窓は他ウィンドウに隠れうる
