import type { Metadata } from "next"
import { Geist_Mono, Mulish } from "next/font/google"
import "./globals.css"

const mulish = Mulish({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Платежный календарь",
  description: "Заявки на оплату для сотрудников и руководителя: учёт, недели, аналитика",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className={`${mulish.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
