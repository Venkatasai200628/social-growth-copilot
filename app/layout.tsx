import type { Metadata, Viewport } from 'next'
import './globals.css'
import Navbar from './components/Navbar'
import Shell from './components/Shell'
import { AuthProvider } from '@/lib/auth-context'
import { ToastProvider } from './components/Toast'
import { ThemeProvider } from './components/ThemeProvider'

export const metadata: Metadata = {
  metadataBase: new URL('https://growmitra.app'),
  title: {
    default: 'GrowMitra — Your AI Marketing Mitra for Indian Business',
    template: '%s · GrowMitra',
  },
  description:
    'GrowMitra turns one product photo and a line about your sale into a full campaign — posters, captions, hashtags and a day-by-day calendar — in Hindi, Telugu, Tamil or English, tuned to Indian festivals. Built for jewellery shops, boutiques, cloud kitchens and home bakers.',
  keywords: 'AI marketing, Instagram posts India, Diwali sale poster generator, Hindi captions, Telugu marketing, small business India, cloud kitchen marketing, boutique promotion',
  openGraph: {
    title: 'GrowMitra — Your AI Marketing Mitra',
    description: 'One photo + one line → a full festival-ready campaign in your language.',
    type: 'website',
    siteName: 'GrowMitra',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GrowMitra — Your AI Marketing Mitra',
    description: 'One photo + one line → a full festival-ready campaign in your language.',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#08080d' },
    { media: '(prefers-color-scheme: light)', color: '#f6f5fb' },
  ],
}

// Applied before hydration so light-mode users never see a dark flash.
const themeScript = `(function(){try{var t=localStorage.getItem('growmitra_theme')||localStorage.getItem('sgc_theme');if(!t){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <Navbar />
              <Shell>{children}</Shell>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
