import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'WORD STREET — Casa Shindy English',
  description: '英検5級から準1級まで対応の英語学習アプリ。ストリートカルチャーで英語をマスターしよう！',
  keywords: ['英語学習', '英検', 'English', 'Casa Shindy', 'WORD STREET'],
  openGraph: {
    title: 'WORD STREET by Casa Shindy',
    description: '英検5級〜準1級対応。ストリート系英語学習アプリ。',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={inter.variable}>
        {children}
      </body>
    </html>
  )
}
