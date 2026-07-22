# 地下百景 ランキング API

ゲーム本体（GitHub Pages）は静的な無料公開のまま、ランキングだけを Cloudflare Worker と D1 に置く構成です。

## 初回公開

1. Cloudflare に無料登録し、PCでこのリポジトリを開く。
2. `npm exec wrangler login` を一度だけ実行してブラウザで許可する。
3. `npm exec wrangler d1 create chika-hyakkei-ranking` を実行する。
4. 表示された `database_id` を `wrangler.jsonc` に貼る。
5. `npm exec wrangler d1 migrations apply chika-hyakkei-ranking --remote` を実行する。
6. `npm exec wrangler deploy` を実行する。表示された `https://...workers.dev` が API の住所。
7. `public/ranking-config.js` を、その API の住所に変更して GitHub Pages を公開する。

無料枠を超えても、Free プランは自動課金されず API が止まるだけです。小規模なランキング用途なら無料枠で十分です。

## 現在の動作

- 通常プレイの死亡・中断・帰還・踏破は、自動で送信する
- テストモードは送信対象外
- 終了した冒険ごとに総合ランキングへ掲載する
- 終了直後は今回作られた記録IDを使い、ランキング画面でその行を強調する
- 通信失敗時は端末へ保留し、次回起動時に自動再送する
- 同じ `submissionId` の再送はD1の一意制約で一件として扱う

これは気軽に遊ぶゲーム用の「カジュアルランキング」です。ブラウザの改変まで完全に防ぐ大会級の不正対策には、将来サーバー発行シードと行動ログの再計算を追加します。

週間集計用の `week_key` は将来の再開に備えてD1へ保持しますが、現在の取得APIとゲーム画面は総合ランキングだけを提供します。
