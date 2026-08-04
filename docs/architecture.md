# 全体設計

最終確認: 2026-08-04

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
| `app/page.tsx` | ゲーム状態、戦闘、探索、画面、セーブ復元、描画エラー境界 |
| `app/storage.ts` | 現在セーブ、直前バックアップ、破損データ退避 |
| `app/monsters.ts` | 100体の魔物カタログ、25素体・4変異の弱点・耐性・固有行動・行動パターン、全階層主の攻略データ |
| `app/items.ts` | 100アイテムの共通マスター、装備能力、特殊効果、消耗品・遺物の説明 |
| `app/battle-presentation.ts` | 戦闘コマンドIDからポーズ・効果・HP着弾タイミングを決定 |
| `app/depth-themes.ts` | 10階層帯の地域名・装飾・BGM変奏プロファイル |
| `app/descent.ts` | 奈落降下の安全地点判定、3レーン障害物生成、移動・着地判定、開始報酬を持つ純粋ロジック |
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
| `scripts/balance-simulator.mjs` | 全職業・3ビルド・2戦術の固定シード難易度モデル |
| `scripts/balance-report.mjs` | 到達率、残資源、死因、所要時間の計測レポート |
| `public/ranking-config.js` | ゲームから使うランキングAPI URL |
| `ranking-api/` | Cloudflare Worker・D1の終了記録ランキングと移行SQL |
| `.github/workflows/deploy-pages.yml` | GitHub Pages公開 |

## 公開

ゲーム本体は静的出力する。`npm run build:pages` が `site/` を生成し、GitHub ActionsがそれをGitHub Pagesへ公開する。`docs/` は長期開発資料専用であり、公開ビルドの出力先にしない。

ランキングAPIはゲーム本体と別にCloudflare Workersへ公開する。WorkerのURLは `public/ranking-config.js` にだけ保持し、UIコードへ直書きしない。

Web AnalyticsはGitHub PagesにCloudflareの計測beaconを直接読み込ませる。ゲームの行動・セーブ・名前は送らず、ページ訪問の匿名集計だけをCloudflareダッシュボードで確認する。

PWAのService Workerは同一オリジンの `/` と `/en/`、静的アセットをキャッシュする。HTMLのナビゲーションはネットワーク優先で更新し、通信できない場合だけキャッシュへ戻す。ランキング設定とランキングAPIはキャッシュ対象から外し、既存の送信待ちキュー・再送処理を妨げない。キャッシュにはlocalStorageの冒険・Meta・名前を保存しない。

表示言語は端末内設定として保存する。画面は翻訳キーから文言を取得し、英語辞書に未登録のキーは日本語へ戻す。言語切替はRun・Meta・ランキング値を変更しない。

英語版もRunやMetaに翻訳文を保存しない。既存の日本語名やメッセージを含む旧セーブを読み込んでも、画面表示時に安定ID・現在フェーズ・階番号から英語表示を導出する。静的公開時は `/index.html` と `/en/index.html` の双方を書き出す。

## 境界

- GitHub Pagesにはサーバー実行環境がないため、ランキングDBを置かない。
- Cloudflare Workerはランキング以外のゲーム状態を保持しない。`submissionId` の一意制約で同じ終了記録の再送を重複登録しない。
- `db/` のDrizzle補助は現在のGitHub Pages公開ではゲーム本体から利用していない。D1のランキングスキーマは `ranking-api/migrations/` が正とする。
