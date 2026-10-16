import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ad Disclosure Lab",
  description: "Experiment platform for consumer responses to AI ad disclosure",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-neutral-50 text-neutral-900">{children}</body>
    </html>
  );
}
