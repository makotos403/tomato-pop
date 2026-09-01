# ロードマップ

## v1.1.0 — ⤢ ポップアウト・ウィンドウ

**目的**：タイマーを常に画面に出しておけるようにする（ドロップダウンのポップアップはフォーカスが外れると閉じるため）。

**着手条件**：v1.0.0 がストアで承認・公開されてから。審査中のバージョンはいじらない。

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
