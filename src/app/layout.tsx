import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'

export const metadata: Metadata = {
  title: 'GritClub — Build With People Who Refuse Average',
  description: 'GritClub is where serious builders connect, learn, and execute. No noise. No spectators.',
  keywords: 'founders, live events, mastermind, mentorship, entrepreneurship, GritClub',
  openGraph: {
    title: 'GritClub — Build With People Who Refuse Average',
    description: 'Where serious builders connect, learn, and execute.',
    url: 'https://gritclub.live',
    siteName: 'GritClub',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GritClub',
    description: 'Build With People Who Refuse Average.',
  },
  manifest: '/manifest.json',
  icons: { icon: '/logo.png', apple: '/logo.png', shortcut: '/logo.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ background: '#0B0B0C', color: '#FFFFFF', fontFamily: "'Inter', system-ui, sans-serif" }}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
