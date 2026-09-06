# ロードマップ

## v1.2.0 — アイコン刷新 ＋ 改名（実装済み・未リリース）

- **改名**：`Tomato Pop` → **`Tomato Pop Timer`** / `トマトポップタイマー`
  （検索で「タイマー / timer」に当てる。`_locales` の `appName`。`short_name` は `appNameShort` = `Tomato Pop`）
- **アイコン**：プロモタイルの Gemini トマトを抽出して差し替え（つや・星型のヘタで現行のフラット版より情報量あり）
  - パイプライン：`dev/extract_tomato.py`（`promo-tile-src.jpg` からトマトだけ抽出 → `dev/icon_src.png`）→ `dev/build_icons.py`（4サイズ）
  - **リング意匠は不採用**（16px で潰れて視認性が落ちる）。タイマーのアイデンティティはポップアップの円弧が担う
  - 全サイズ同じ絵
- リリース：v1.1.0 承認・公開後、`version` 1.2.0 で zip 再作成 → アップロード
- ストア掲載でやること：
  - zip アップロード（`tomato-pop-v1.2.0.zip`）
  - 詳細説明の書き出し文を「トマトポップタイマー / Tomato Pop Timer」に（日英・手入力。表示名自体と 128px アイコンはパッケージから自動更新）
  - プロモタイル差し替え（新「Tomato Pop Timer」版）
  - **スクリーンショットは変更不要**（アイコンは実寸 ~16px で差が出ない、名前は写らない）

---

## v1.1.0 — ↗ ポップアウト・ウィンドウ（実装済み・未リリース）

**目的**：タイマーを常に画面に出しておけるようにする（ドロップダウンのポップアップはフォーカスが外れると閉じるため）。

**状態**：実装完了。実機テスト → zip 作成 → ストアにアップロードで v1.1.0 リリース。
（`_locales` の英語基準 appDesc もこのパッケージに乗る）

### 実装の実際

- ドロップダウンの操作行に `↗` ボタン → `OPEN_WINDOW` メッセージ → `background.js` の `openTimerWindow()`
- `chrome.windows.create({ type:"popup", url:"popup.html?w=1" })`。窓 ID は `chrome.storage.session`（`WIN_KEY`）
- 既に開いていれば `chrome.windows.update(id,{focused:true,drawAttention:true})` だけ
- `chrome.windows.onRemoved` → ID クリア（stale ID は次回 open 時に自己修復）
- `chrome.windows.onBoundsChanged` → 位置・サイズを `storage.local`（`WIN_BOUNDS_KEY`）に保存 → 次回復元
- `popup.js`：`?w=1` で窓モード判定 → `↗` ボタンを隠す、`<html>.window-mode`、`fitWindow()` で中身に合わせて窓の高さを自動調整
- 窓とドロップダウンは同じ background 状態を読む → `storage.onChanged` で自動同期（既存配線）
- 新権限なし。状態機械（`state.js`）は不変 → テスト追加なし

---

（旧メモ）**着手条件**：v1.0.0 がストアで承認・公開されてから。審査中のバージョンはいじらない。

### 方式（合意済み）

- 別アプリにはしない（メンテ倍・掲載2セット・ユーザー混乱）。同じ拡張内で対応
- トグルではなく **ドロップダウン内の「⤢」ボタン**で小窓を開く（分岐が少ない）
- 任意で設定に「ブラウザ起動時に自動でポップアウト」を追加してもよい

### 実装メモ

- `chrome.windows.create({ type: "popup", width: ~320, height: ~400, url: "popup.html?w=1" })`
- `popup.html` を窓でも再利用。URL パラメータ `?w=1` で「窓モード」判定 → ⤢ ボタン自身を隠す等
- 窓 ID は `chrome.storage.session` に保存。既に開いていれば `chrome.windows.update(id, { focused: true })` だけ（重複開き防止）
- `chrome.windows.onRemoved` で ID をクリア
- 窓とポップアップは同じ background 状態を読む → `chrome.storage.local.onChanged` で自動同期（配線済み）
- （任意）最後の窓位置・サイズを `storage.local` に保存して次回復元
- **新しい権限は不要**（`chrome.windows` は権限なしで使える）
- ストア審査影響：軽微（権限が増えない）。`version` を 1.1.0 に上げて zip 再作成 → アップロード

### 既知の限界（ユーザー了承済み）

- 最前面固定はできない（Chrome に always-on-top API がない）。小窓は他ウィンドウに隠れうる
- 「残り時間のチラ見」だけならバッジの `MM:SS` で足りる、という前提は変わらない

### 影響ファイル（見込み）

| ファイル | 変更 |
|---|---|
| `background.js` | 窓の open/focus/close 管理、`storage.session` の窓 ID |
| `popup.html` / `popup.js` | ⤢ ボタン追加、窓モード判定 |
| `popup.css` | 窓モードの微調整（必要なら） |
| `strings.*.json` | ⤢ ボタンのラベル／設定項目のラベル |
| `dev/state.test.mjs` | 状態機械は不変なので基本変更なし |
