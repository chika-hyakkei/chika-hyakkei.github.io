# 全体設計

最終確認: 2026-07-19

## 構成

```text
ブラウザ
  ├─ GitHub Pages: React/Vinext のゲーム本体
  │   ├─ localStorage: 冒険・メタ進行・匿名テスト記録
  │   └─ 任意送信: ランキング API
  └─ Cloudflare Worker: ランキング API
      └─ Cloudflare D1: 自己ベストランキング
```

## 主なモジュール

| 場所 | 責務 |
| --- | --- |
| `app/page.tsx` | ゲーム状態、戦闘、探索、画面、セーブ復元 |
| `app/monsters.ts` | 100体の魔物カタログ |
| `app/items.ts` | 100アイテムのカタログ |
| `app/music.ts` | Web AudioによるBGM |
| `app/telemetry.ts` | 端末内だけの匿名テスト記録 |
| `app/ranking.ts` | ランキングの取得・任意送信 |
| `public/ranking-config.js` | ゲームから使うランキングAPI URL |
| `ranking-api/` | Cloudflare Worker・D1移行SQL |
| `.github/workflows/deploy-pages.yml` | GitHub Pages公開 |

## 公開

ゲーム本体は静的出力する。`npm run build:pages` が `site/` を生成し、GitHub ActionsがそれをGitHub Pagesへ公開する。`docs/` は長期開発資料専用であり、公開ビルドの出力先にしない。

ランキングAPIはゲーム本体と別にCloudflare Workersへ公開する。WorkerのURLは `public/ranking-config.js` にだけ保持し、UIコードへ直書きしない。

## 境界

- GitHub Pagesにはサーバー実行環境がないため、ランキングDBを置かない。
- Cloudflare Workerはランキング以外のゲーム状態を保持しない。
- `db/` のDrizzle補助は現在のGitHub Pages公開ではゲーム本体から利用していない。D1のランキングスキーマは `ranking-api/migrations/` が正とする。
