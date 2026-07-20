import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VOID SDK Demo | OpenTelemetry AI Incident Intelligence',
  description: 'Hackathon demo application showcasing the VOID SDK emitting OpenTelemetry traces and powering production incident intelligence.',
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#030307] text-[#FFFFFF] font-sans antialiased min-h-screen relative bg-subtle-grid">
        <div className="bg-ambient-glow" />
        {children}
      </body>
    </html>
  );
}
