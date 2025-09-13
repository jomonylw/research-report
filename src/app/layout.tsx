import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "研报中心 - 专业的行业与个股研究报告搜索引擎",
  description:
    "研报中心提供最新、最全的行业研究报告和个股分析报告。通过我们的高级搜索和筛选功能，您可以轻松获取专业的金融数据、市场趋势和投资见解，助力您的决策。",
  keywords: [
    "研报",
    "研究报告",
    "金融",
    "投资",
    "股票",
    "行业分析",
    "个股分析",
    "数据挖掘",
    "市场趋势",
    "券商报告",
  ],
  authors: [{ name: "Jomonylw", url: process.env.NEXT_PUBLIC_APP_URL! }],
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-w-[480px]`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
