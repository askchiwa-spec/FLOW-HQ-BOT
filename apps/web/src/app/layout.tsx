import './globals.css';
import { Inter, Space_Grotesk } from 'next/font/google';
import { Providers } from './providers';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

export const metadata = {
  title: 'Flow HQ - WhatsApp Business Assistant | Made in Tanzania',
  description: 'Transform your WhatsApp into a 24/7 business assistant. Automated booking, sales, and support for Tanzanian businesses.',
  keywords: 'WhatsApp automation, business assistant, Tanzania, chatbot, booking system, customer support',
  authors: [{ name: 'Flow HQ' }],
  openGraph: {
    title: 'Flow HQ - WhatsApp Business Assistant',
    description: 'Never miss a customer. Automate your business with WhatsApp.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
