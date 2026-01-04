import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "Videlix AI - Video Content Pipeline",
  description: "Quy trình chuẩn hóa nội dung video: Từ ý tưởng đến kịch bản chỉ trong 4 bước.",
  keywords: ["video script", "AI video", "content creation", "youtube", "tiktok"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark">
      <body
        className={`${inter.variable} font-sans antialiased bg-zinc-950 text-white`}
      >
        {children}
      </body>
    </html>
  );
}
