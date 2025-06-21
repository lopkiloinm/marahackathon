import React from 'react'
import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk'
})

export const metadata: Metadata = {
  title: 'MARA AI Trading System',
  description: 'Advanced AI-driven trading system for energy and inference marketplace arbitrage',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${spaceGrotesk.variable} font-sans antialiased`}>
        <div className="relative min-h-screen">
          {/* Animated background gradient */}
          <div className="fixed inset-0 -z-10 overflow-hidden">
            <div className="absolute -inset-[10px] opacity-20">
              <div className="animated-gradient absolute inset-0 blur-3xl" />
            </div>
            <div className="absolute inset-0 bg-background/95" />
          </div>
          {children}
        </div>
      </body>
    </html>
  )
} 