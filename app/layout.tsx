import type { Metadata } from 'next'
import './globals.css'
import Navbar from './components/Navbar'
import { AuthProvider } from '@/lib/auth-context'
import { ToastProvider } from './components/Toast'
import { ThemeProvider } from './components/ThemeProvider'

export const metadata: Metadata = {
  title: 'Social Growth Copilot — AI Social Media Promotion',
  description: 'AI-powered social media promotion platform. Get a complete campaign, daily content, and live growth tracking.',
  keywords: 'social media marketing, AI content generator, Instagram promotion, campaign automation, India',
  openGraph: {
    title: 'Social Growth Copilot',
    description: 'AI-powered social media promotion for every business',
    type: 'website',
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <Navbar />
              <div className="pt-14">{children}</div>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
