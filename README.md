# 地下百景

地下100階を目指す、スマートフォン対応のレトロダンジョンRPGです。

## 遊び方

- 敵の次行動を読み、防御・技・回復を選ぶ
- 倒れると装備と持ち物を失うが、図鑑・称号・熟練度・墓は端末に残る
- 100階の最終ボス撃破がクリア条件

## 開発

```bash
npm install
npm run dev
npm test
```

GitHub Pages向けの静的出力は `npm run build:pages` で `site/` に生成します。

## 開発資料

長期開発の作業ルールは [AGENTS.md](AGENTS.md) を参照してください。現在地、仕様、保存形式、設計判断、課題は [docs/](docs/) に記録します。作業再開時はまず [docs/now.md](docs/now.md) を確認します。
