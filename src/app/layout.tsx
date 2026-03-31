import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'

export const metadata: Metadata = {
  title: 'GritClub — Where Ambition Meets Action',
  description: 'Live sessions, 1:1 conversations, and mastermind groups for the relentless. Host events and keep 80% of every ticket.',
  keywords: 'founders, live events, mastermind, mentorship, entrepreneurship, GritClub',
  openGraph: {
    title: 'GritClub — Where Ambition Meets Action',
    description: 'Live sessions, masterminds, and 1:1 conversations for the relentless.',
    url: 'https://gritclub.live',
    siteName: 'GritClub',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GritClub',
    description: 'Where ambition meets action',
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
      <body style={{ background: '#291C0E', color: '#E1D4C2', fontFamily: "'Inter', system-ui, sans-serif" }}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
