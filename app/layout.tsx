import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "StentSync • Saveetha Urology",
  description: "Double-J Stent Tracking & Overdue Prevention System • Saveetha Medical College & Hospital (Prof. N. Muthulatha & Prof. M. Siva Sankar)",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.png?v=3", type: "image/png" },
      { url: "/favicon.ico?v=3", sizes: "any" }
    ],
    shortcut: "/icon.png?v=3",
    apple: "/icon.png?v=3",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d9488",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/icon.png?v=3" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon.png?v=3" />
        <link rel="shortcut icon" href="/icon.png?v=3" />
        <link rel="apple-touch-icon" href="/icon.png?v=3" />
        
        <script src="https://cdn.tailwindcss.com"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                darkMode: 'class',
                theme: {
                  extend: {
                    colors: {
                      darkbg: {
                        50: '#1e293b',
                        100: '#0f172a',
                        200: '#0b1120',
                        300: '#060913',
                      },
                      brand: {
                        50: '#f0fdfa',
                        100: '#ccfbf1',
                        200: '#99f6e4',
                        300: '#5eead4',
                        400: '#2dd4bf',
                        500: '#14b8a6',
                        600: '#0d9488',
                        700: '#0f766e',
                        800: '#115e59',
                        900: '#134e4a',
                      }
                    }
                  }
                }
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col antialiased transition-colors duration-200">
        <ThemeProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 sm:pb-8">
            {children}
          </main>
          
          {/* Footer */}
          <footer className="hidden sm:block bg-white dark:bg-[#111827] border-t border-slate-200 dark:border-[#1f293d] py-4 text-center text-xs text-slate-500 dark:text-slate-400">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p>
                🏥 <strong>Saveetha Medical College & Hospital</strong> • Department of Urology
              </p>
              <p className="text-slate-400 dark:text-slate-500">
                Unit 1: Prof. N. Muthulatha • Unit 2: Prof. M. Siva Sankar • 100% Free Open Stent Registry
              </p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}