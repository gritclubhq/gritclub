import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'

export const metadata: Metadata = {
  title: 'GritClub — Build With People Who Refuse Average',
  description: 'A private network for serious builders. Host live events, build groups, and connect with people actually moving forward.',
  icons: { icon: '/logo.png', apple: '/logo.png' },
  openGraph: {
    title: 'GritClub',
    description: 'Build With People Who Refuse Average',
    url: 'https://gritclub.live',
    siteName: 'GritClub',
  },
}

export const viewport = { themeColor: '#0B0B0C' }

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
