# 全体設計

最終確認: 2026-07-19

## 構成

```text
ブラウザ
  ├─ GitHub Pages: React/Vinext のゲーム本体
  │   ├─ localStorage: 冒険・直前バックアップ・メタ進行・匿名テスト記録
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
| `app/monsters.ts` | 100体の魔物カタログ |
| `app/items.ts` | 100アイテムのカタログ |
| `app/music.ts` | Web AudioによるBGM |
| `app/onboarding.ts` | 初回案内の進捗補完と、現在状況から次に出す案内の判定 |
| `app/telemetry.ts` | 端末内だけの匿名テスト記録 |
| `app/ranking.ts` | ランキングの取得、自動送信、送信待ちキューと再送 |
| `app/layout.tsx` | ランキング設定とCloudflare Web Analytics beaconの読込 |
| `public/ranking-config.js` | ゲームから使うランキングAPI URL |
| `ranking-api/` | Cloudflare Worker・D1の終了記録ランキングと移行SQL |
| `.github/workflows/deploy-pages.yml` | GitHub Pages公開 |

## 公開

ゲーム本体は静的出力する。`npm run build:pages` が `site/` を生成し、GitHub ActionsがそれをGitHub Pagesへ公開する。`docs/` は長期開発資料専用であり、公開ビルドの出力先にしない。

ランキングAPIはゲーム本体と別にCloudflare Workersへ公開する。WorkerのURLは `public/ranking-config.js` にだけ保持し、UIコードへ直書きしない。

Web AnalyticsはGitHub PagesにCloudflareの計測beaconを直接読み込ませる。ゲームの行動・セーブ・名前は送らず、ページ訪問の匿名集計だけをCloudflareダッシュボードで確認する。

## 境界

- GitHub Pagesにはサーバー実行環境がないため、ランキングDBを置かない。
- Cloudflare Workerはランキング以外のゲーム状態を保持しない。`submissionId` の一意制約で同じ終了記録の再送を重複登録しない。
- `db/` のDrizzle補助は現在のGitHub Pages公開ではゲーム本体から利用していない。D1のランキングスキーマは `ranking-api/migrations/` が正とする。
