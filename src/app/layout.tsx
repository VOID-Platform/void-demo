import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'VOID — AI Incident Intelligence',
  description: 'Instrument AI applications with OpenTelemetry. Turn telemetry into incident intelligence.',
  openGraph: {
    title: 'VOID — AI Incident Intelligence',
    description: 'Instrument AI applications with OpenTelemetry. Turn telemetry into incident intelligence.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" style={{ overflow: 'hidden', height: '100%' }}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Geist+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="bg-[#050508] text-[#f4f4f5] font-sans antialiased"
        style={{ overflow: 'hidden', height: '100%', position: 'fixed', width: '100%' }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
