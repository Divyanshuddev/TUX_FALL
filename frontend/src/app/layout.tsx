import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tux Fall — Linux Architecture Skyfall Game',
  description: 'Guide Tux falling through the blizzard to capture Linux components and synthesize a cohesive system architecture.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Space+Grotesk:wght@500;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-nordic-darkest text-slate-100 min-h-screen antialiased select-none selection:bg-cyan-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
