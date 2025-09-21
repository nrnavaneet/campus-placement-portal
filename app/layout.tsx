import type React from "react"
import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import "./globals.css"
import { ThemeProvider } from "@/contexts/theme-context"
import { AuthProvider } from "@/contexts/auth-context"
import { ScrollToTop } from "@/components/ui/scroll-to-top"
import { Toaster } from "@/components/ui/sonner"
import { ToastDismissOnRouteChange } from "@/components/toast-dismiss-on-route-change"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Campus Placement Portal - MS Ramaiah University",
  description: "Official placement and internship portal for MS Ramaiah University of Applied Sciences",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider defaultTheme="light" storageKey="campus-portal-theme">
            <ToastDismissOnRouteChange />
            {children}
            <ScrollToTop />
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
