# ロードマップ

## 着手予定

なし。新しい案が出たらここに追記する。

---

## リリース済み

### v1.3.0 — 評価のお願い（ストアレビュー導線）

方針は [../../CONVENTIONS.md](../../CONVENTIONS.md) §11。ロジックは `review.js`（純粋関数）、テストは `dev/review.test.mjs`。

- **導線は3か所。お願い文 `review.body` は専用画面とバナーで共用**
  1. 設定画面：最下段に控えめな「★ ストアで評価・レビューを書く」リンクを**常設**（状況を問わず表示）。
     押すと「評価した」扱いになり、以降の割り込みは出ない。
     （当初は先頭にカードを置く案だったが、インストール直後に開いた人が使う前に「今後表示しない」を押してしまうため見送り）
  2. ポップアップの専用画面：累計3回完了後、アイコンを開くとタイマーの代わりに割り込んで表示
     （トマトのアイコン／お礼／お願い文／「評価する」「あとで」「今後表示しない」）
  3. ページ内バナー（設定でON時のみ）：ポモドーロ終了バナーの下に同じ案内。休憩終了には出さない
- **出す条件（専用画面とバナーで `review` を共有、条件式は `isReviewDue` の1本）**：
  未完了 かつ 累計 ≥ max(3, nextAt)（インストール当日でも到達しうる）。
  「あとで」は画面をまたいで数え、`nextAt` = 押した時の累計 + 5、2回目で打ち止め（定数 `REVIEW_MAX_LATER`）。
  「評価する」「今後表示しない」、設定画面のリンクで二度と出さない。状態は `storage.local` の `review`
  （`{status:"active",laterCount,nextAt}` / `{status:"done"}`）
- **出さない場面（専用画面）**：タイマー実行中／ポップアウト窓／設定画面表示中
- **フェイルセーフ**：`review` や累計が読めない・壊れている → 出さない。保存に失敗してもそのポップアップでは再表示しない
- 「評価する」は回答を記録してから `chrome.tabs.create` でレビューページを開く（権限追加なし）
- `state.totalCompleted` を追加（旧データは未定義 → 0 扱い。既存ユーザーは更新後に3回完了で初回表示）
- 併せて：長めの休憩の初期設定をオフに変更（新規インストールのみ。既存ユーザーの保存済み設定は不変）／ストア掲載文を「おすすめの設定：ページ内バナー」中心に刷新（`dev/store-listing.md` §2・§3、`_locales` の `appDesc`）

---

---

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
