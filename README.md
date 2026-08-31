# トマトポップ / Tomato Pop

> 各ポモドーロの終了を、画面上部からスライドインするバナーと通知で知らせるシンプルな
> ポモドーロタイマーの Chrome 拡張機能（Manifest V3）。日本語・英語対応。
>
> A simple Pomodoro timer Chrome extension (MV3). When a session ends it slides a
> banner down from the top of the page and shows a notification. English & Japanese.

**開発中 / Work in progress** — まだストア公開していません。

---

## 特長 / Features

- アイコンのバッジに残り時間を `MM:SS` でリアルタイム表示
- 円形タイマーは赤い弧が時計回りに減っていく表現。休憩・長めの休憩はヘタの緑色に
- ポモドーロ / 短い休憩 / 長めの休憩 の3つ。時間はすべて設定で変更可能
- フェーズ終了時に **OS通知**＋**バッジ色の変化**で通知（音・ページ内バナーは任意でON）
- セッションの移行は**手動**。終了時に「次を開始 →」を提案するだけ
- 外部通信なし — すべてブラウザ内で完結（[PRIVACY.md](PRIVACY.md)）

## インストール（開発版）

1. このフォルダを clone またはダウンロード
2. `chrome://extensions` を開き「デベロッパーモード」をON
3. 「パッケージ化されていない拡張機能を読み込む」→ このフォルダを選択

## 構成 / Layout

[../CONVENTIONS.md](../CONVENTIONS.md) に従ったフラット構成。

| ファイル | 役割 |
|---|---|
| `manifest.json` | MV3 マニフェスト。権限は `alarms` / `storage` / `notifications` / `offscreen` のみ |
| `background.js` | Service Worker。`chrome.alarms` と状態機械の配線、バッジ・通知 |
| `state.js` | 純粋関数の状態機械 `reduce(state, settings, event) → { state, effects }` |
| `defaults.js` | `settings` / `state` の初期値 |
| `i18n.js` | 実行時の言語ローダ `t(key, params)` |
| `popup.*` | 円形タイマーUI＋設定画面（同じポップアップ内で切替） |
| `settings.js` | 設定ビューのローカライズ・入力配線（`popup.js` から利用） |
| `offscreen.*` | 「ソフトな1音」を Web Audio で合成（音声ファイル不要） |
| `content.js` | スライドインバナー。フェーズ終了時にアクティブタブへ動的注入（任意権限） |
| `strings.{ja,en}.json` | 拡張内UIの文言辞書（設定で切替可能） |
| `_locales/{en,ja}/messages.json` | ストア表示名・説明（`chrome.i18n`） |
| `icons/` | ツールバー・通知用アイコン |
| `dev/` | 出荷しない開発用（元画像 `icon_src.png`、テスト）。ストア zip から除外 |

## 開発 / Development

```
node dev/state.test.mjs   # 状態機械のテスト
```

## 権限 / Permissions

| 権限 | 目的 |
|---|---|
| `alarms` | フェーズ終了時刻の予約 |
| `storage` | 進行状況と設定の保存 |
| `notifications` | 終了時のOS通知 |
| `offscreen` | アラーム音の再生 |
| `scripting` / host（任意） | ページ内バナー。設定でONにした時のみ要求 |

## ライセンス / License

MIT — [LICENSE](LICENSE)
