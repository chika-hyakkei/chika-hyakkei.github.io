# 全体設計

最終確認: 2026-09-12

## 構成

```text
ブラウザ
  ├─ GitHub Pages: React/Vinext のゲーム本体
  │   ├─ localStorage: 冒険・直前バックアップ・メタ進行・匿名テスト記録
  │   ├─ Service Worker: ゲームシェルと静的アセットのオフラインキャッシュ
  │   ├─ localStorage送信待ちキュー → ランキング API
  │   └─ 匿名集計: Cloudflare Web Analytics beacon
  └─ Cloudflare Worker: ランキング API
      └─ Cloudflare D1: 冒険終了記録ランキング
```

## 主なモジュール

| 場所 | 責務 |
| --- | --- |
| `app/page.tsx` | React状態・入力・画面・演出、探索の接続、セーブ復元、描画エラー境界 |
| `app/game-types.ts` / `shared/jobs.ts` | Run/Metaの型、全8職業の共通ID |
| `app/game-rules.ts` | 能力値・敵生成・階生成・宝箱抽選・遺物候補・依頼進行・貸与装備の純粋関数 |
| `app/battle-engine.ts` | プレイヤー手番・敵手番・道具・勝利報酬。音やReact更新を実行せず、状態と勝利/死亡イベントを返す |
| `app/game-save.ts` | 本番のRun/Meta正規化・破損検査・旧項目補完 |
| `app/run-factory.ts` / `app/progression.ts` | 開始状態・降下着地状態、終了Meta更新・墓回収 |
| `app/game-feedback.ts` | 結果イベントから英語の数値・入手品フィードバックを生成 |
| `app/storage.ts` | 現在セーブ、直前バックアップ、破損データ退避 |
| `app/monsters.ts` | 100体の魔物カタログ、25素体・4変異の弱点・耐性・固有行動・行動パターン、全階層主の攻略データ |
| `app/items.ts` | 100アイテムの共通マスター、装備能力、特殊効果、消耗品・遺物の説明 |
| `app/battle-presentation.ts` | 戦闘コマンドIDからポーズ・効果・HP着弾タイミングを決定 |
| `app/depth-themes.ts` | 10階層帯の地域名・装飾・BGM変奏プロファイル |
| `app/descent.ts` | 奈落降下の安全地点判定、連続座標の障害物生成、フレーム時間に依存しない通過判定・着地判定、開始報酬を持つ純粋ロジック |
| `app/descent-game.tsx` / `app/descent.css` | 奈落降下専用表示、RAF、指・キー長押し入力、一時停止。本編を毎フレーム再描画しない |
| `app/music.ts` | Web Audioによる場面別主旋律と階層帯別変奏 |
| `app/onboarding.ts` | 初回案内の進捗補完と、現在状況から次に出す案内の判定 |
| `app/i18n.ts` | 日本語・英語の翻訳辞書、端末言語判定、日本語フォールバック、言語非依存の地下依頼ID |
| `app/content-localization.ts` | 安定IDから100アイテム、100魔物、10階層主、10地域の英語表示を導出 |
| `app/en/page.tsx` | 英語で直接開くための `/en/` 入口 |
| `app/telemetry.ts` | 端末内だけの匿名テスト記録 |
| `app/ranking.ts` | ランキングの取得、自動送信、送信待ちキューと再送 |
| `app/layout.tsx` | ランキング設定とCloudflare Web Analytics beaconの読込 |
| `public/manifest.webmanifest` | ホーム画面追加用のPWAメタデータ |
| `public/sw.js` | 同一オリジンのゲームシェル・静的アセットのキャッシュと通信復旧 |
| `scripts/combat-audit.mjs` | 本番と共通の着地・敵・戦闘処理を使う全8職業の2連戦検証 |
| `scripts/balance-simulator.mjs` | 旧抽象モデル。仮説用途のみで、現行ゲームのクリア率保証には使わない |
| `scripts/balance-report.mjs` | 到達率、残資源、死因、所要時間の計測レポート |
| `public/ranking-config.js` | ゲームから使うランキングAPI URL |
| `ranking-api/` | Cloudflare Worker・D1の終了記録ランキングと移行SQL |
| `.github/workflows/deploy-pages.yml` | GitHub Pages公開 |

## 公開

ゲーム本体は静的出力する。`npm run build:pages` が `site/` を生成し、GitHub Actionsが型検査・全テスト後にそれをGitHub Pagesへ公開する。Workerランタイム型は `ranking-api/worker-configuration.d.ts` をWranglerから生成する。`docs/` は長期開発資料専用であり、公開ビルドの出力先にしない。

ランキングAPIはゲーム本体と別にCloudflare Workersへ公開する。WorkerのURLは `public/ranking-config.js` にだけ保持し、UIコードへ直書きしない。

Web AnalyticsはGitHub PagesにCloudflareの計測beaconを直接読み込ませる。ゲームの行動・セーブ・名前は送らず、ページ訪問の匿名集計だけをCloudflareダッシュボードで確認する。

PWAのService Workerは同一オリジンの `/` と `/en/`、静的アセットをキャッシュする。HTMLのナビゲーションはネットワーク優先で更新し、通信できない場合だけキャッシュへ戻す。ランキング設定とランキングAPIはキャッシュ対象から外し、既存の送信待ちキュー・再送処理を妨げない。ビルド時に同じHTMLに対応するJS/CSS/画像・フォントの一覧とコンテンツハッシュを生成し、初回インストール完了前に一式をキャッシュする。書込み完了を待って応答し、localStorageの冒険・Meta・名前はキャッシュしない。

表示言語は端末内設定として保存する。画面は翻訳キーから文言を取得し、英語辞書に未登録のキーは日本語へ戻す。言語切替はRun・Meta・ランキング値を変更しない。

マスターの英語名をRunやMetaの判定用データへ置き換えない。新しい表示結果はRun.noticeへ保存し、行動ID・数値・アイテムIDを優先する。単発通知は段階移行中のため英語表示文を含む場合もある。既存の日本語名やメッセージを含む旧セーブを読み込んでも、画面表示時に安定ID・現在フェーズ・階番号から英語表示を導出する。静的公開時は `/index.html` と `/en/index.html` の双方を書き出す。

## 境界

- GitHub Pagesにはサーバー実行環境がないため、ランキングDBを置かない。
- Cloudflare Workerはランキング以外のゲーム状態を保持しない。`submissionId` の一意制約で同じ終了記録の再送を重複登録しない。
- `db/` のDrizzle補助は現在のGitHub Pages公開ではゲーム本体から利用していない。D1のランキングスキーマは `ranking-api/migrations/` が正とする。
