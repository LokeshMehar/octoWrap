import { Recursive } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Toaster } from '@/components/ui/toaster'
import Providers from '@/components/Providers'
import { constructMetadata } from '@/lib/utils'
import { AuthProvider } from './AuthProvider'

const recursive = Recursive({ subsets: ['latin'] })

export const metadata = constructMetadata()

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {

  return (
    <AuthProvider>
    <html lang='en'>
      <body className={recursive.className}>
        <Navbar />

        <main className='flex flex-col min-h-[calc(100vh-3.5rem-1px)]'>
          <div className='flex-1 flex flex-col h-full'>
            <Providers>{children}</Providers>
          </div>
          <Footer />
        </main>

        <Toaster />
      </body>
    </html>
    </AuthProvider>
  )
}
