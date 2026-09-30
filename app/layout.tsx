import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0F0F0F',
}

export const metadata: Metadata = {
  title: {
    default: 'TECHSAS — Universal Smart Asset Management Platform',
    template: '%s | TECHSAS',
  },
  description:
    'Platform Manajemen & Siklus Hidup Aset Terpadu TECHSAS — Solusi komprehensif pelacakan aset, pemeliharaan, dan audit siklus hidup untuk UMKM Indonesia.',
  keywords: ['techsas', 'manajemen aset', 'asset tracking', 'qr code asset', 'umkm indonesia'],
  icons: {
    icon: [
      { url: '/favicon.png?v=techsas', type: 'image/png' },
      { url: '/icon.png?v=techsas', type: 'image/png' },
    ],
    shortcut: '/favicon.png?v=techsas',
    apple: '/apple-icon.png?v=techsas',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className={`h-full ${inter.variable}`}>
      <head>
        <meta name="theme-color" content="#0F0F0F" />
        <link rel="icon" type="image/png" href="/favicon.png?v=techsas" />
        <link rel="shortcut icon" href="/favicon.png?v=techsas" />
        <link rel="apple-touch-icon" href="/apple-icon.png?v=techsas" />
      </head>
      <body className={`${inter.className} h-full bg-[#FAFCFA] text-[#0F0F0F] antialiased`}>{children}</body>
    </html>
  )
}
