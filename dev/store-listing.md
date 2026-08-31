# Chrome ウェブストア 掲載情報（下書き）

そのまま Developer Dashboard に貼れるようにまとめたもの。dev/ 配下なのでストア zip には含まれない。

- カテゴリ: **Productivity**（サブ: Workflow & Planning）
- 言語: 日本語 / English（既定ロケール: en）
- プライバシーポリシー URL: `https://github.com/makotos403/tomato-pop/blob/main/PRIVACY.md`

---

## 1. 名前

- EN: `Tomato Pop`
- JA: `トマトポップ`

（manifest の `__MSG_appName__` から自動）

---

## 2. 概要 / Summary（132字以内）

**JA**
> ポモドーロの終了を、ページ上部のスライドインバナーとアイコンの残り時間表示で知らせる集中タイマー。時間は自由に設定。日英対応。

**EN**
> Pomodoro focus timer. A banner slides down the page and the toolbar shows a live countdown when a session ends. EN & JA.

（`_locales/*/messages.json` の `appDesc` と同一にしてある）

---

## 3. 詳細な説明 / Detailed description

**JA**

```
トマトポップは、ポモドーロ・テクニックのための集中タイマーです。

■ 特徴：終了を「画面で」知らせる
作業や休憩の時間が終わると、いま見ているページの上部からバナーがスライドで降りてきます。
ツールバーのアイコンには残り時間が MM:SS でリアルタイム表示されるので、
タイマーを開かなくても状況がわかります。

■ できること
・ポモドーロ / 短い休憩 / 長めの休憩 の3つ。時間はすべて分単位で設定可能
・長めの休憩は「使う / 使わない」を切り替え可能（短いインターバルを繰り返したい人向け）
・セッションの移行は手動。終了時に「次を開始」か「終了」を選ぶだけ
・アイコンをクリックすると円形タイマー（赤い弧が時計回りに減っていく）
・日本語・英語対応。ブラウザの言語に自動追従、設定で切り替えも可能
・ライト / ダークはブラウザの設定に自動追従

■ 通知方法（選べます）
・OS通知（常時）
・音：OS通知音 / ソフトなチャイム / 無音 から選択、音量調整あり
・ページ内バナー：任意。オンにしたときだけ、表示中のページへのアクセス許可を求めます

■ プライバシー
外部との通信は一切ありません。タイマーの状態と設定はお使いの端末内にのみ保存され、
収集も送信もされません。
```

**EN**

```
Tomato Pop is a focus timer for the Pomodoro Technique.

WHAT MAKES IT DIFFERENT — it tells you on the screen
When a focus or break interval ends, a compact banner slides down from the top of
the page you're on. The toolbar icon also shows the time left as a live MM:SS
countdown, so you always know where you are without opening the timer.

FEATURES
- Pomodoro / short break / long break, each length adjustable in minutes
- The long break can be turned off entirely (handy for short, repeated intervals)
- Manual transitions: when an interval ends you choose "start next" or "done"
- Click the icon for a circular timer (a red arc that winds down clockwise)
- English and Japanese; follows your browser language, switchable in settings
- Light / dark follows your browser setting

HOW IT NOTIFIES YOU (your choice)
- System notification (always)
- Sound: system sound / a soft chime / silent, with a volume control
- In-page banner: optional. Turning it on asks for access to the page you're viewing

PRIVACY
No external connections at all. The timer state and your settings are stored only
on your device — nothing is collected or sent anywhere.
```

---

## 4. 単一用途の説明 / Single purpose

**EN（審査は英語なので英語で入力）**
> Tomato Pop is a Pomodoro timer. It runs the focus and break intervals that the
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

## 7. スクリーンショット（1280×800、3〜5枚）

1. タイマー画面（実行中・赤い弧が減っている状態）＋ 上部タブ
2. 設定画面（時間・音・言語。長めの休憩トグル ON）
3. 実際の Web ページにスライドインバナーが出ている様子
4. ダークモードのタイマー画面
5. （任意）長めの休憩トグル OFF で 2 タブだけの状態

---

## 8. 提出用 zip

```
cd D:\Create\Tools\tomato-pop
zip -r ../tomato-pop-v1.0.0.zip . \
  -x 'dev/*' '.git/*' '*.md' 'LICENSE' '.gitignore' '.gitattributes' '*.zip'
```
