# Chrome ウェブストア 掲載情報（下書き）

そのまま Developer Dashboard に貼れるようにまとめたもの。dev/ 配下なのでストア zip には含まれない。

- カテゴリ: **Productivity**（サブ: Workflow & Planning）
- 言語: 日本語 / English（既定ロケール: en）
- プライバシーポリシー URL: `https://github.com/makotos403/tomato-pop/blob/main/PRIVACY.md`

---

## 1. 名前

- EN: `Tomato Pop Timer`（v1.2.0〜。それ以前は `Tomato Pop`）
- JA: `トマトポップタイマー`

（manifest の `__MSG_appName__` から自動。検索で「タイマー / timer」に当てるため v1.2.0 で改名。
short_name は `__MSG_appNameShort__` = `Tomato Pop` / `トマトポップ`）

---

## 2. 概要 / Summary（132字以内）

英語を基準表現とし、日本語も並行で用意する。

**EN（基準）**
> Pomodoro timer that slides a banner onto your page when time is up (enable in Settings), plus a live countdown on the icon.

**JA**
> 作業中のページの上にバナーでポモドーロの終了をお知らせ（設定でオン）。アイコンに残り時間も表示。日英対応。

（`_locales/*/messages.json` の `appDesc` と同一）

### GitHub リポジトリ About 欄（英語）
> A Chrome extension that announces the end of each Pomodoro session with a banner sliding down from the top of the page and a live countdown on the toolbar icon. English & Japanese, MV3.

---

## 3. 詳細な説明 / Detailed description

構成：冒頭に「おすすめの設定：ページ内バナー」（初期設定はオフであることを明記）→ 切り離し窓 → 機能一覧 → プライバシー。
設定画面の文言（`ページ内にバナーを表示` / `Show a banner on the page`）と一致させること。

**JA**

```
トマトポップタイマーは、ポモドーロ・テクニックのための集中タイマーです。

■ おすすめの設定：ページ内バナー
設定で「ページ内にバナーを表示」にチェックを入れると、
時間が来たときに、見ているページの上からバナーがスライドして降りてきます。
図書館・カフェ・会議中など、音を出せない場所に最適です。
※ 初期設定はオフです。オンにすると、バナーを表示するためのアクセス許可を確認します。
　ページの内容は読み取らず、保存も送信もしません。

■ タイマーを切り離して常に表示
「↗」ボタンで、タイマーを小さな別ウィンドウに切り離せます。
ツールバーのドロップダウンと違い、フォーカスが外れても消えません。
作業しながら残り時間をいつでも確認できます。

■ できること
・ツールバーのアイコンに、残り時間を MM:SS でリアルタイム表示
・ポモドーロ / 短い休憩 / 長めの休憩 の3つ。時間はすべて分単位で設定可能
・長めの休憩は「使う / 使わない」を切り替え可能（初期設定はオフ）
・セッションの移行は手動。終了時に「次を開始」か「終了」を選ぶだけ
・通知：OS通知（常時）／音（OS通知音・ソフトなチャイム・無音）／ページ内バナー
・日本語・英語対応。ブラウザの言語に自動追従、設定で切り替えも可能
・ライト / ダークはブラウザの設定に自動追従

■ プライバシー
外部との通信は一切ありません。タイマーの状態と設定はお使いの端末内にのみ保存され、
収集も送信もされません。
```

**EN**

```
Tomato Pop Timer is a focus timer for the Pomodoro Technique.

RECOMMENDED SETTING: PAGE BANNER
Check "Show a banner on the page" in Settings, and when time is up a banner slides
down from the top of the page you're viewing.
Perfect for libraries, cafés, or meetings, where you can't use sound.
Note: it is off by default. Turning it on asks for permission to show the banner.
The extension never reads, stores, or sends page content.

KEEP THE TIMER ON SCREEN
The "↗" button detaches the timer into a small window. Unlike the toolbar dropdown,
it doesn't disappear when it loses focus, so you can check the time remaining
while you work.

FEATURES
- Live MM:SS countdown on the toolbar icon
- Pomodoro / short break / long break, each adjustable in minutes
- The long break can be turned on or off (off by default)
- Manual transitions: when an interval ends, choose "start next" or "done"
- Alerts: system notification (always), sound (system sound / soft chime / silent), page banner
- English and Japanese; follows your browser language, switchable in settings
- Light / dark follows your browser setting

PRIVACY
No external connections at all. The timer state and your settings are stored only
on your device — nothing is collected or sent anywhere.
```

---

## 4. 単一用途の説明 / Single purpose

**EN（審査は英語なので英語で入力）**
> Tomato Pop Timer is a Pomodoro timer. It runs the focus and break intervals that the
> user configures and notifies the user when each interval ends.

**JA（参考）**
> ポモドーロ式の集中・休憩インターバルを実行し、各区切りの終了を通知する集中タイマー。

---

## 5. 権限の理由 / Permission justifications

Dashboard の「プライバシー」タブで各権限に入力。英語推奨。

| 権限 | 理由文（英語・そのまま貼れる） |
|---|---|
| `alarms` | Fires an event at the exact time a focus or break interval ends. Required because the MV3 service worker is suspended while the timer runs, so a setInterval would not survive. |
| `storage` | Stores the timer's current state and the user's settings (interval lengths, sound, language) locally via chrome.storage.local. Nothing leaves the device. |
| `notifications` | Shows a notification when a focus or break interval ends. |
| `offscreen` | Creates an offscreen document to play a short chime when an interval ends. Audio cannot be played from a service worker directly. |
| `scripting`（optional） | Requested only if the user enables the optional in-page banner. Injects the banner script into the user's active tab when an interval ends. |
| host `*://*/*`（optional） | Requested only if the user enables the optional in-page banner. Needed to show the end-of-interval banner on whatever page the user is currently viewing. The extension does not read or collect page content and makes no network requests. |

---

## 6. データ利用の申告 / Data usage

- 収集・使用するユーザーデータ: **なし**（すべてのカテゴリで「収集しない」を選択）
- 認証チェック（3つともチェック可能）:
  - [x] データを第三者に販売しない
  - [x] 単一用途と無関係な目的に使わない
  - [x] 与信・融資目的に使わない・転送しない

---

## 7. スクリーンショット（1280×800 PNG・日英で別セット・完成）

**アップロード用** → `dev/store/`（5枚 × ja/en）。撮影原本 → `dev/store/raw/`（`ss01`〜`ss06`。`ss05`＝休憩の緑は不使用）。

- ブラウザ最大化のネイティブ 1280×800 キャプチャ（Wikipedia「ポモドーロ・テクニック」記事）
- 下部に全幅キャプション帯（焦げ茶 #3A3330 ＋ トマト色のアクセント線 ＋ クリーム文字。フォント Yu Gothic Bold）
- 生成：`dev/caption_shots.py`（`dev/store/raw/` を読んで `dev/store/` に出力）

| # | ファイル | 画面 | キャプション JA / EN | 原本 |
|---|---|---|---|---|
| 1 | `1-timer` | 円形タイマー実行中（ドロップダウン・ライト） | 画面で知らせるポモドーロタイマー / A Pomodoro timer that tells you on the screen | ss01 |
| 2 | `2-banner` | スライドインバナー（セッション終了 ＋ 2ボタン） | 終了を、見ているページの上部でお知らせ / A banner slides down the page when a session ends | ss03 |
| 3 | `3-popout` | ポップアウト窓がページの上に浮遊（v1.1.0） | タイマーを切り離して、常に画面に表示 / Pop the timer out to keep it on screen | ss04 |
| 4 | `4-settings` | 設定画面（時間・音・言語、長め休憩トグル ON） | 時間・音・言語をこまかく設定 / Tune the timers, sound, and language | ss02 |
| 5 | `5-dark` | ダークモードのタイマー | ライト / ダークに自動で対応 / Adapts to light and dark automatically | ss06 |

- EN セットは Chrome UI もほぼ英語（一部「Google に質問する」等が日本語のまま。実害小）

### プロモーションタイル（小・440×280・任意）

`dev/store/promo-tile.png` — Gemini 生成の下絵（`raw/promo-tile-src.jpg`・「Tomato Pop Timer」版）を
440×280 にリサイズしただけ（`dev/promo_tile.py`）。温かいオフホワイト＋トマト＋タイマーの赤い円弧＋
2行の「Tomato Pop / Timer」。全言語共通で可。マーキータイル（1400×560）は未作成（不要なら省略）。

### 背景の Web ページ（#2 用）

**推奨：Wikipedia の「ポモドーロ・テクニック」記事**（EN 掲載は "Pomodoro Technique"）

- 「集中して調べもの／読書」の文脈が一目で伝わる
- レイアウトが穏やかでバナーと競合しない
- 日英で同じ記事があり、ブランド・提携の懸念ゼロ（Google の審査はスクショの他社ロゴに厳しい）
- タイマーの通知が、その手法を解説する記事の上に出る、という軽い遊び

代替：ミニマルなテキストエディタ系ページ（「書きもの」の文脈にしたい場合）。
避ける：他社サービスのロゴが大きく写るもの、雑多で読みにくいページ。

- 記事はバナー（上部中央・幅 ~400px）が本文の頭にかかる程度までスクロール
- バナーはページのタイトルやナビを「隠して壊れて見える」位置にしない

---

## 8. 提出用 zip

```
cd D:\Create\Tools\chrome-extensions\tomato-pop
zip -r ../tomato-pop-v<version>.zip . \
  -x 'dev/*' '.git/*' '*.md' 'LICENSE' '.gitignore' '.gitattributes' '*.zip'
```

---

## 9. v1.3.0 更新の提出メモ

zip：`D:\Create\Tools\chrome-extensions\tomato-pop-v1.3.0.zip`（`manifest.json` の version は 1.3.0。`dev/` `*.md` などは除外済み）

Dashboard で「パッケージ」→「新しいパッケージをアップロード」→ 次を貼り替えて「審査用に送信」：

| タブ | やること |
|---|---|
| ストアの掲載情報 | 「詳細な説明」を **§3 の JA / EN** に差し替え（日本語・English それぞれ）。「概要」は zip の `appDesc` から自動で変わる（§2） |
| プライバシー | **変更なし**（権限の追加なし。新しく保存するのは累計の完了回数と評価依頼への回答状況で、いずれも端末内のみ・外部送信なし。「データを収集しない」のまま） |
| 配布 | 変更なし |
| スクリーンショット | 変更なし（#4 の設定画面は「長め休憩トグル ON」のまま。初期設定はオフになったが機能紹介としては問題なし） |

v1.3.0 の変更点（審査メモ用・英語）：

> - Added a polite, one-time request to rate the extension (never shown while the timer is running; "Don't show again" is always available; no incentives).
> - The long break is now off by default.
> - Updated the store description to explain the optional in-page banner.
> - No new permissions.

承認後：`git tag v1.3.0 && git push --tags`、`../CLAUDE.md` のツール一覧と README のバージョンを更新（§10.6）。

