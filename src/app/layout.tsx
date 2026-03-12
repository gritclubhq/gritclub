import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GritClub — Live Business Events for Founders',
  description: 'LinkedIn meets Twitch for founders. Ticketed live business events, professional networking, and 50/50 revenue share.',
  keywords: 'founders, live events, business networking, startup, entrepreneurship',
  openGraph: {
    title: 'GritClub — Live Business Events for Founders',
    description: 'Ticketed live business events with 50/50 revenue share',
    url: 'https://gritclub.live',
    siteName: 'GritClub',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GritClub',
    description: 'LinkedIn meets Twitch for founders',
  },
  manifest: '/manifest.json',
  themeColor: '#0F172A',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-grit-bg text-grit-text antialiased">
        {children}
      </body>
    </html>
  )
}
