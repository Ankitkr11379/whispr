import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const poppins = Poppins({ weight: ['400', '500', '600', '700'], subsets: ['latin'], variable: '--font-poppins' });

export const metadata: Metadata = {
  title: 'Whispr',
  description: 'A production-grade platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${poppins.variable} antialiased bg-[#0D0D0D] text-white min-h-screen flex flex-col`}>
        {/* Ambient Glows */}
        <div className="fixed top-0 left-0 w-36 h-36 rounded-full blur-[90px] opacity-60 bg-[#FB2BB6] -translate-x-1/2 -translate-y-1/2 z-[-1]" />
        <div className="fixed top-0 right-0 w-36 h-36 rounded-full blur-[90px] opacity-60 bg-[#D210FA] translate-x-1/2 -translate-y-1/2 z-[-1]" />
        
        <main className="flex-grow flex flex-col items-center justify-center relative p-6">
          {children}
        </main>
      </body>
    </html>
  );
}
