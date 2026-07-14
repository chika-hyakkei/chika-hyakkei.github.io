import type { Metadata } from "next";
import "./globals.css";
import "./grim.css";

export const metadata: Metadata = {
  title: "地下百景｜無限ダンジョンRPG",
  description: "100階の最終ボスを目指す、戦闘予告型レトロ・ローグライト。倒れればすべてを失う。",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: { title: "地下百景｜無限ダンジョンRPG", description: "倒れれば、すべてを失う。", type: "website", locale: "ja_JP", images: [{url:"/og.png",width:1200,height:630,alt:"地下百景"}] },
  twitter: { card: "summary_large_image", title: "地下百景", description: "倒れれば、すべてを失う。", images: ["/og.png"] },
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ja"><body>{children}</body></html>;}
