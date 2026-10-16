import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ad Disclosure Lab",
  description: "AI広告開示に対する消費者反応の実験プラットフォーム",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-neutral-50 text-neutral-900">{children}</body>
    </html>
  );
}
