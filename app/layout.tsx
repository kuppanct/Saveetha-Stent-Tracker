import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Saveetha Urology - DJ Stent Tracker",
  description: "Comprehensive Double-J Stent Tracking and Overdue Prevention System for Saveetha Medical College and Hospital",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0284c7",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Tailwind CSS CDN to guarantee 100% styled layout under any network/bundler conditions */}
        <script src="https://cdn.tailwindcss.com"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                theme: {
                  extend: {
                    colors: {
                      hospital: {
                        50: '#f0f9ff',
                        100: '#e0f2fe',
                        200: '#bae6fd',
                        300: '#7dd3fc',
                        400: '#38bdf8',
                        500: '#0284c7',
                        600: '#0369a1',
                        700: '#075985',
                        800: '#0c4a6e',
                        900: '#082f49',
                      }
                    }
                  }
                }
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-100 flex flex-col antialiased text-slate-900 font-sans">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        
        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>
              🏥 <strong>Saveetha Medical College & Hospital</strong> • Department of Urology
            </p>
            <p className="text-slate-400">
              Double-J Stent Expiry & Overdue Prevention Registry • 100% Free & Open System
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}