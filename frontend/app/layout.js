import './globals.css'

export const metadata = {
  title: 'BFHL — Graph Hierarchy Analyzer',
  description: 'SRM Full Stack Engineering Challenge',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0f0f0f] text-[#e8e8e8] antialiased">
        {children}
      </body>
    </html>
  )
}
