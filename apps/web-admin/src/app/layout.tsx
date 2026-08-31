import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { BottomNav } from '../components/BottomNav';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'IFAM Eventos | Gestão de Eventos, Simpósios e Workshops',
  description: 'Ecossistema oficial de gestão de eventos, check-in por palestra, transmissão YouTube e certificação do Instituto Federal do Amazonas.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="flex flex-col min-h-screen antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-ifam-green-500 selection:text-white">
        <AuthProvider>
          <Header />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 md:pb-8">
            {children}
          </main>
          <Footer />
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
