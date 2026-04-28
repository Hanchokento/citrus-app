import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "柑橘類の推薦システム",
  description: "あなたにぴったりの柑橘をおすすめする診断アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}