import { Recursive } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Toaster } from '@/components/ui/toaster'
import Providers from '@/components/Providers'
import { constructMetadata } from '@/lib/utils'
import { AuthProvider } from './AuthProvider'
// import { PrismaClient } from '@prisma/client'

const recursive = Recursive({ subsets: ['latin'] })

export const metadata = constructMetadata()

// const prisma = new PrismaClient({ log: ['info', 'query'], })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {

  // console.log(prisma.configuration.findMany())



  return (
    <AuthProvider>
    <html lang='en'>
      <body className={recursive.className}>
        <Navbar />

        <main className='flex grainy-light flex-col min-h-[calc(100vh-3.5rem-1px)]'>
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
