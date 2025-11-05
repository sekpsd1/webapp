// /app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ระบบจัดเก็บขยะโรงพยาบาล',
  description: 'ระบบจัดการขยะโรงพยาบาล',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}