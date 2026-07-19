# 地下百景 ランキング API

ゲーム本体（GitHub Pages）は静的な無料公開のまま、ランキングだけを Cloudflare Worker と D1 に置く構成です。

## 初回公開

1. Cloudflare に無料登録し、PCでこのリポジトリを開く。
2. `npm exec wrangler login` を一度だけ実行してブラウザで許可する。
3. `npm exec wrangler d1 create chika-hyakkei-ranking` を実行する。
4. 表示された `database_id` を `wrangler.jsonc` の `REPLACE_WITH_D1_DATABASE_ID` に貼る。
5. `npm exec wrangler d1 migrations apply chika-hyakkei-ranking --remote` を実行する。
6. `npm exec wrangler deploy` を実行する。表示された `https://...workers.dev` が API の住所。
7. `public/ranking-config.js` の空文字を、その API の住所に変更して GitHub Pages を公開する。

無料枠を超えても、Free プランは自動課金されず API が止まるだけです。小規模なランキング用途なら無料枠で十分です。

## 現在の保護

- プレイ結果画面で本人が押した時だけ送信する（自動送信しない）
- テストモードと「冒険を諦める」は送信対象外
- 端末ごとの匿名IDにつき、週間・総合とも自己ベストだけを掲載
- 同じ端末からの連投は20秒待機

これは気軽に遊ぶゲーム用の「カジュアルランキング」です。ブラウザの改変まで完全に防ぐ大会級の不正対策には、将来サーバー発行シードと行動ログの再計算を追加します。
