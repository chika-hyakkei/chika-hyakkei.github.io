import type { Metadata } from "next";
import "./globals.css";
import "./grim.css";

export const metadata: Metadata = {
  title: "地下百景｜無限ダンジョンRPG",
  description: "職業を選び、装備を整え、底なしの洞窟へ。倒れればすべてを失う無料レトロRPG。",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: { title: "地下百景｜無限ダンジョンRPG", description: "倒れれば、すべてを失う。", type: "website", locale: "ja_JP", images: [{url:"/og.png",width:1200,height:630,alt:"地下百景"}] },
  twitter: { card: "summary_large_image", title: "地下百景", description: "倒れれば、すべてを失う。", images: ["/og.png"] },
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ja"><head><script src="/ranking-config.js" /><script type="module" src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon={'{"token":"5423cc0e6ea841d3bee5ec4b41162e50"}'} /></head><body>{children}</body></html>;}
